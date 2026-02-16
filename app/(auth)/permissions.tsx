import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { MapPin, Bell } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function PermissionsScreen() {
  const { setHasCompletedOnboarding } = useOnboardingStore();

  const handleContinue = () => {
    // Logic to request permissions would go here
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)/home');
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)/home');
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.container}>
        <View style={styles.header}>
           <Text style={styles.title}>Enable Permissions</Text>
           <Text style={styles.subtitle}>
             To provide the best experience, we need the following permissions.
           </Text>
        </View>
        
        <View style={styles.content}>
           <Card style={styles.permissionCard} padding="lg">
              <View style={styles.iconCircle}>
                 <MapPin size={24} color={Colors.primary} />
              </View>
              <View style={styles.textCol}>
                 <Text style={styles.permTitle}>Location</Text>
                 <Text style={styles.permDesc}>To find the best restaurants near you and track your order.</Text>
              </View>
           </Card>

           <Card style={styles.permissionCard} padding="lg">
              <View style={styles.iconCircle}>
                 <Bell size={24} color={Colors.primary} />
              </View>
              <View style={styles.textCol}>
                 <Text style={styles.permTitle}>Notifications</Text>
                 <Text style={styles.permDesc}>Get real-time updates on your order status and promotions.</Text>
              </View>
           </Card>
        </View>

        <View style={styles.footer}>
           <Button 
             title="Allow Permissions" 
             onPress={handleContinue} 
             size="lg"
             style={styles.button}
           />
           <Button 
             title="Maybe Later" 
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
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    gap: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textCol: {
    flex: 1,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  permDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
