import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams();

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.container}>
        <View style={styles.content}>
           <CheckCircle size={80} color={Colors.success} style={styles.icon} />
           <Text style={styles.title}>Order Placed!</Text>
           <Text style={styles.subtitle}>
             Your order #{String(orderId || '').slice(0, 8).toUpperCase()} has been placed successfully. You can track the delivery in the 'Orders' section.
           </Text>
        </View>

        <View style={styles.footer}>
           <Button 
             title="Track Order" 
             onPress={() => router.replace(`/order/tracking/${orderId || '123'}` as any)}
             size="lg"
             style={styles.button}
           />
           <Button 
             title="Continue Shopping" 
             variant="ghost"
             onPress={() => router.replace('/(tabs)/home')}
             style={styles.homeButton}
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
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    width: '100%',
    paddingBottom: 24,
  },
  button: {
    marginBottom: 16,
  },
  homeButton: {
    //
  },
});
