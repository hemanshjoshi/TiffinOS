import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);

  const handleResend = async () => {
    setTimer(30);
    const cleanPhone = phone?.toString().startsWith('+') ? phone : `+${phone}`;
    try {
        const { error } = await supabase.auth.signInWithOtp({
            phone: cleanPhone as string,
        });
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'OTP resent successfully');
        }
    } catch (err: any) {
        Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code');
      return;
    }

    const cleanPhone = phone?.toString().startsWith('+') ? phone : `+${phone}`;
    const { error, data } = await supabase.auth.verifyOtp({
      phone: cleanPhone as string,
      token: otp,
      type: 'sms',
    });

    if (error) {
      Alert.alert('Verification Failed', error.message);
      return;
    }

    if (data.session) {
      // Navigation is handled by RootLayout onAuthStateChange
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          We have sent a verification code to{'\n'}
          <Text style={styles.phoneText}>+{phone}</Text>
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder="XXXXXX"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            autoFocus
            textAlign="center"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { opacity: otp.length === 6 ? 1 : 0.6 }]} 
          onPress={handleVerify}
          disabled={otp.length !== 6}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 40,
  },
  phoneText: {
    fontWeight: '600',
    color: Colors.text,
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInput: {
    fontSize: 24,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    color: Colors.text,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    color: '#666',
  },
  timerText: {
    color: '#666',
    fontWeight: '600',
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
