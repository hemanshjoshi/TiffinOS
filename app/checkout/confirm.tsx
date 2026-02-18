import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';
import { useAddressStore } from '@/store/addressStore';

export default function ConfirmOrderScreen() {
  const { items, clearCart, coupon } = useCartStore();
  const { user } = useAuth();
  const { selectedAddress } = useAddressStore();
  const [status, setStatus] = useState('Processing Payment...');

  useEffect(() => {
    const createOrder = async () => {
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        router.replace('/(auth)/login');
        return;
      }

      if (items.length === 0) {
        router.replace('/(tabs)/home');
        return;
      }

      try {
        setStatus('Placing Order...');
        
        const kitchenId = items[0].kitchenId;

        // Construct payload for RPC
        const payload = {
          p_kitchen_id: kitchenId,
          p_delivery_address_id: selectedAddress?.id,
          p_items: items.map(item => ({
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            variant_id: item.selectedVariant?.id || null, // Ensure explicit null if undefined
            addon_ids: item.selectedAddons?.map(addon => addon.id) || []
          })),
          p_coupon_code: coupon?.code || null
        };

        console.log('Calling create_order RPC with payload:', JSON.stringify(payload, null, 2));

        // Call Secure RPC Function
        const { data: order, error } = await supabase.rpc('create_order', payload);

        if (error) {
          console.error('RPC Error:', error);
          throw error;
        }

        console.log('Order created successfully:', order);

        // 3. Success
        clearCart();
        router.replace('/order/success');
      } catch (error: any) {
        console.error('Order Creation Error:', error);
        setStatus('Order Failed');
        Alert.alert('Order Failed', error.message || 'Something went wrong while placing your order.');
        router.replace('/checkout/payment-failed');
      }
    };

    // Simulate small delay for "Processing" feel
    const timer = setTimeout(() => {
      createOrder();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Screen backgroundColor={Colors.primary} safeArea={false}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Processing Payment...</Text>
        <Text style={styles.subtext}>Please do not press back or close the app</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
  },
  subtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
});
