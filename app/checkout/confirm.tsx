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
  const { items, clearCart, getTotalPrice } = useCartStore();
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
        const totalPrice = getTotalPrice();
        const finalAmount = totalPrice + 40 + Math.round(totalPrice * 0.05);

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            kitchen_id: kitchenId,
            status: 'Pending',
            total_amount: finalAmount,
            delivery_address_id: selectedAddress?.id,
            delivery_address_snapshot: selectedAddress, // Store full address in case it's deleted later
            payment_method: 'UPI', // Mocked for now
            payment_status: 'Paid'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map(item => ({
          order_id: order.id,
          menu_item_id: item.menuItemId,
          user_id: user.id,
          quantity: item.quantity,
          price_at_time: item.price,
          selected_variant: item.selectedVariant,
          selected_addons: item.selectedAddons
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

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
