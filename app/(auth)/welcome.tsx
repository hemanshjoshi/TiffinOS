import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
           <View style={styles.logoContainer}>
             <Image 
               source={require('@/assets/logo.png')} 
               style={styles.logo}
               resizeMode="contain"
             />
           </View>
           <Text style={styles.brandName}>YUMQUICK</Text>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
           <Text style={styles.description}>
             Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.
           </Text>
        </View>

        {/* Button Section */}
        <View style={styles.buttonContainer}>
          <Button 
            title="Log In" 
            onPress={() => router.push('/(auth)/login')}
            size="lg"
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />
          
          <Button 
            title="Sign Up" 
            variant="primary"
            onPress={() => router.push('/(auth)/signup')}
            size="lg"
            style={styles.signupButton}
            textStyle={styles.signupButtonText}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E65100', // Deep Orange matching the screenshot
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: height * 0.15,
    paddingBottom: 50,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 20,
    // Add logic for the heart/fork/spoon shape if it was an SVG, but using image for now
  },
  logo: {
    width: '100%',
    height: '100%',
    tintColor: '#FFC107', // Yellow tint for the logo
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginTop: 10,
  },
  textSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 20,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#FFC107', // Yellow button
    borderRadius: 30,
    height: 56,
  },
  loginButtonText: {
    color: '#E65100', // Orange text
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#FFE0B2', // Light orange/cream button
    borderRadius: 30,
    height: 56,
  },
  signupButtonText: {
    color: '#E65100', // Orange text
    fontSize: 18,
    fontWeight: 'bold',
  },
});
