import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/services/authContext';
import { useProfileStore } from '@/store/profileStore';
import { supabase } from '@/services/supabase';

export default function SetupProfileScreen() {
  const { session, signOut } = useAuth();
  const { user: profile, updateProfile } = useProfileStore();
  
  // Form State
  const [name, setName] = useState('');
  const [inputValue, setInputValue] = useState(''); // Holds Phone (10 digits) or Email
  const [otp, setOtp] = useState('');
  
  // Flow State
  const [missingField, setMissingField] = useState<'phone' | 'email' | null>(null);
  const [verificationStep, setVerificationStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // 1. Get Known Data
    const { email, phone, user_metadata } = session.user;
    
    // Name Pre-fill
    const existingName = profile?.full_name || user_metadata?.full_name || user_metadata?.name || '';
    setName(existingName);

    // 2. Determine Missing Field
    // If we have Email but no Phone (Google Login)
    if (email && !phone) {
        setMissingField('phone');
    } 
    // If we have Phone but no Email (Phone Login)
    else if (phone && !email) {
        setMissingField('email');
    }
    // If we have both (Rare, or previously linked), or neither (Error)
    else {
        // Fallback: Check what public profile lacks, or default to Phone if ambiguous
        if (!profile?.mobile_number) setMissingField('phone');
        else if (!profile?.email) setMissingField('email');
        else setMissingField(null); // All good?
    }

  }, [session, profile]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
        if (missingField === 'phone') {
            if (inputValue.length !== 10) {
                Alert.alert('Invalid Number', 'Please enter a 10-digit mobile number');
                return;
            }
            const fullPhone = `+91${inputValue}`;
            
            // Update User (Triggers OTP)
            const { error } = await supabase.auth.updateUser({ phone: fullPhone });
            
            if (error) throw error;
            
            Alert.alert('OTP Sent', `Verification code sent to ${fullPhone}`);
            setVerificationStep('otp');
        } 
        else if (missingField === 'email') {
            if (!inputValue.includes('@')) {
                Alert.alert('Invalid Email', 'Please enter a valid email address');
                return;
            }

            // Update User (Triggers OTP or Link)
            const { error } = await supabase.auth.updateUser({ email: inputValue });
            
            if (error) throw error;

            Alert.alert('Verification Sent', `Check your email ${inputValue} for a code.`);
            setVerificationStep('otp');
        }
    } catch (e: any) {
        console.error(e);
        if (e.message?.includes('already registered') || e.message?.includes('unique constraint')) {
            Alert.alert(
                'Account Exists', 
                'This contact info is already linked to another account.\n\nPlease log in with it to access your existing account.',
                [
                    { text: 'Go to Login', onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                    }},
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } else {
            Alert.alert('Error', e.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
        let verifyError;
        
        if (missingField === 'phone') {
            const fullPhone = `+91${inputValue}`;
            const { error } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: otp,
                type: 'phone_change'
            });
            verifyError = error;
        } else {
             const { error } = await supabase.auth.verifyOtp({
                email: inputValue,
                token: otp,
                type: 'email_change'
            });
            verifyError = error;
        }

        if (verifyError) throw verifyError;

        // Verification Success! Now save profile.
        await handleSaveProfile();

    } catch (e: any) {
        Alert.alert('Verification Failed', e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const profileUpdates: any = {
            id: session.user.id,
            full_name: name,
            updated_at: new Date().toISOString(),
        };

        if (missingField === 'phone') {
            profileUpdates.mobile_number = `+91${inputValue}`;
        } else if (missingField === 'email') {
            profileUpdates.email = inputValue;
        }

        // Use upsert to handle cases where user doesn't exist yet
        const { error } = await supabase
          .from('users')
          .upsert(profileUpdates);
        
        if (error) throw error;

        await updateProfile(session.user.id, profileUpdates);
        router.replace('/(tabs)/home');

      } catch (e: any) {
          Alert.alert('Save Failed', e.message);
      }
  };

  // Render UI
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
           {missingField === 'phone' ? 'Verify your Mobile Number' : 'Verify your Email Address'}
        </Text>

        {/* Name Field (Always Visible) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            editable={verificationStep === 'input'} // Lock during OTP
          />
        </View>

        {/* Contact Input or OTP Input */}
        {verificationStep === 'input' ? (
            <View style={styles.formGroup}>
                <Text style={styles.label}>
                    {missingField === 'phone' ? 'Mobile Number' : 'Email Address'}
                </Text>
                
                {missingField === 'phone' ? (
                    <View style={styles.phoneInputContainer}>
                        <Text style={styles.prefix}>+91</Text>
                        <TextInput
                            style={[styles.input, {flex: 1, borderWidth: 0, backgroundColor: 'transparent'}]}
                            placeholder="1234567890"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={inputValue}
                            onChangeText={setInputValue}
                        />
                    </View>
                ) : (
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={inputValue}
                        onChangeText={setInputValue}
                    />
                )}
            </View>
        ) : (
            <View style={styles.formGroup}>
                <Text style={styles.label}>Enter Verification Code</Text>
                <TextInput
                    style={[styles.input, {textAlign: 'center', fontSize: 24, letterSpacing: 5}]}
                    placeholder="XXXXXX"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                />
                <TouchableOpacity onPress={() => setVerificationStep('input')}>
                    <Text style={{color: Colors.primary, textAlign: 'center', marginTop: 10}}>Change {missingField === 'phone' ? 'Number' : 'Email'}</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]} 
          onPress={verificationStep === 'input' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <Text style={styles.buttonText}>
                  {verificationStep === 'input' ? 'Get OTP' : 'Verify & Finish'}
              </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#FAFAFA',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50, // Match input height
    backgroundColor: '#FAFAFA',
  },
  prefix: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
