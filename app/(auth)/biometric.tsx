import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';

export default function BiometricScreen() {
  const handleEnable = () => {
    // Logic to enable biometrics would go here
    router.push('/(auth)/permissions');
  };

  const handleSkip = () => {
    router.push('/(auth)/permissions');
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.container}>
        <View style={styles.content}>
           <View style={styles.iconContainer}>
              <Fingerprint size={80} color={Colors.primary} />
           </View>
           
           <Text style={styles.title}>Enable Biometric Access</Text>
           <Text style={styles.subtitle}>
             Login quickly and securely with your fingerprint or face ID.
           </Text>
        </View>

        <View style={styles.footer}>
           <Button 
             title="Use Biometric" 
             onPress={handleEnable} 
             size="lg"
             style={styles.button}
           />
           <Button 
             title="Skip for now" 
             variant="ghost"
             onPress={handleSkip} 
             style={styles.skipButton}
           />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    width: '100%',
    paddingBottom: 24,
  },
  button: {
    marginBottom: 16,
  },
  skipButton: {
    //
  },
});
