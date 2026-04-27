import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Dimensions, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Facebook, Fingerprint } from 'lucide-react-native';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if input is mobile number
  useEffect(() => {
    // Simple check: if it contains only digits and length > 6
    const cleanInput = identifier.replace(/[^0-9]/g, '');
    if (cleanInput.length > 6 && /^\d+$/.test(cleanInput)) {
       setIsMobile(true);
    } else {
       setIsMobile(false);
    }
  }, [identifier]);

  const handleLogin = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter email or mobile number');
      return;
    }

    setLoading(true);

    try {
      if (isMobile) {
        // Mobile OTP Login Flow
        const cleanPhone = identifier.replace(/[^0-9]/g, '');
        // Assuming India +91 for now, or user enters country code. 
        // We'll prepend +91 if not present and length is 10
        let phoneToSend = cleanPhone;
        if (cleanPhone.length === 10) {
            phoneToSend = '91' + cleanPhone;
        }
        
        const { error } = await supabase.auth.signInWithOtp({
          phone: '+' + phoneToSend,
        });

        if (error) throw error;

        // Navigate to OTP screen
        router.push({
            pathname: '/(auth)/otp',
            params: { phone: phoneToSend }
        });
        
      } else {
        // Email Password Login Flow
        if (!password) {
            Alert.alert('Error', 'Please enter password');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.replace('/(tabs)/home');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // Implementation for social login
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
         <Text style={styles.screenTitle}>Log In</Text>
      </View>

      {/* White Bottom Section */}
      <View style={styles.bottomSection}>
         <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.welcomeSection}>
               <Text style={styles.welcomeTitle}>Welcome</Text>
               <Text style={styles.welcomeSubtitle}>
                 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
               </Text>
            </View>

            <View style={styles.formSection}>
               <Input 
                 label="Email or Mobile Number"
                 placeholder="example@example.com"
                 value={identifier}
                 onChangeText={setIdentifier}
                 autoCapitalize="none"
                 style={styles.input}
               />

               {/* Show Password only if NOT mobile (or maybe optional?) 
                   User said "easy for otp verification", so if mobile, we hide password 
               */}
               {!isMobile && (
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
               )}
               
               {/* Forgot Password - only relevant for password login */}
               {!isMobile && (
                   <TouchableOpacity style={styles.forgotPassword}>
                     <Text style={styles.forgotPasswordText}>Forget Password?</Text>
                   </TouchableOpacity>
               )}

               <Button 
                 title={isMobile ? "Get OTP" : "Log In"}
                 onPress={handleLogin}
                 loading={loading}
                 style={styles.mainButton}
                 textStyle={styles.mainButtonText}
               />

               <View style={styles.separator}>
                  <Text style={styles.separatorText}>or sign up with</Text>
               </View>

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
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                     <Text style={styles.signupText}>Sign Up</Text>
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
    height: height * 0.2, // 20% of screen
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
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3E2723', // Dark Brown
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#5D4037', // Brownish grey
    lineHeight: 22,
  },
  formSection: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F3E5AB', // Light yellow input bg
    borderRadius: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#E65100', // Orange
    fontWeight: '600',
    fontSize: 14,
  },
  mainButton: {
    backgroundColor: '#E65100', // Orange
    borderRadius: 30,
    height: 56,
    marginTop: 10,
    marginBottom: 24,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  separatorText: {
    color: '#5D4037',
    fontSize: 14,
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
  signupText: {
    color: '#E65100',
    fontWeight: '700',
    fontSize: 14,
  },
});
