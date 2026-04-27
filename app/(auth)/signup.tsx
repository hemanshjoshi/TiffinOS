import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, Calendar, Facebook, Fingerprint } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    // 1. Sign up user with email and password
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          mobile_number: phone,
          dob: dob,
        }
      }
    });

    if (signUpError) {
      Alert.alert('Signup Failed', signUpError.message);
      setLoading(false);
      return;
    }

    if (user) {
      // 2. Insert into our custom users/profiles table
      try {
        const { error: profileError } = await supabase
          .from('profiles') // Assuming profiles table based on home.tsx usage
          .upsert({
            id: user.id,
            full_name: name,
            mobile_number: phone,
            email: email,
            // dob: dob, // If column exists
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError.message);
        }
      } catch (err) {
        console.error('Exception during profile creation:', err);
      } finally {
        setLoading(false);
      }
      
      Alert.alert(
          'Success', 
          'Account created successfully! Please verify your email.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } else {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    Alert.alert('Social Login', `${provider} login not implemented yet`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Yellow Top Section */}
      <View style={styles.topSection}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={Colors.text} size={24} />
         </TouchableOpacity>
         <Text style={styles.screenTitle}>New Account</Text>
      </View>

      {/* White Bottom Section */}
      <View style={styles.bottomSection}>
         <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.formSection}>
              <Input 
                label="Full name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />

              <Input 
                label="Password"
                placeholder="••••••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? <EyeOff size={20} color="#9A9FAE" /> : <Eye size={20} color="#9A9FAE" />}
                onRightIconPress={() => setShowPassword(!showPassword)}
                style={styles.input}
              />

              <Input 
                label="Email"
                placeholder="example@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Input 
                label="Mobile Number"
                placeholder="+91 9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
              
              <Input 
                label="Date of birth"
                placeholder="DD / MM / YYYY"
                value={dob}
                onChangeText={setDob}
                style={styles.input}
              />

              <Text style={styles.termsText}>
                By continuing, you agree to {'\n'}
                <Text style={styles.termsLink}>Terms of Use</Text> and <Text style={styles.termsLink}>Privacy Policy.</Text>
              </Text>

              <Button 
                title="Sign Up" 
                onPress={handleSignup}
                loading={loading}
                style={styles.mainButton}
                textStyle={styles.mainButtonText}
              />
              
              <Text style={styles.orText}>or sign up with</Text>

              <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('google')}>
                      <View style={[styles.socialIcon, { backgroundColor: '#DB4437' }]}>
                        <Text style={styles.socialIconText}>G</Text>
                      </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('facebook')}>
                      <View style={[styles.socialIcon, { backgroundColor: '#4267B2' }]}>
                         <Facebook size={20} color="#fff" />
                      </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                      <View style={[styles.socialIcon, { backgroundColor: '#333' }]}>
                         <Fingerprint size={20} color="#fff" />
                      </View>
                  </TouchableOpacity>
               </View>

               <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                     <Text style={styles.loginText}>Log in</Text>
                  </TouchableOpacity>
               </View>

            </View>
         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC107', // Yellow top
  },
  topSection: {
    height: height * 0.18, // Slightly smaller than login
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 20,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Off-white
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 30,
    paddingBottom: 50,
  },
  formSection: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F3E5AB', // Light yellow input bg
    borderRadius: 12,
  },
  termsText: {
    fontSize: 12,
    color: '#5D4037',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 4,
    lineHeight: 18,
  },
  termsLink: {
    color: '#E65100', // Orange
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: '#E65100', // Orange
    borderRadius: 30,
    height: 56,
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#5D4037',
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  socialButton: {
    // 
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  socialIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#5D4037',
    fontSize: 14,
  },
  loginText: {
    color: '#E65100',
    fontWeight: '700',
    fontSize: 14,
  },
});
