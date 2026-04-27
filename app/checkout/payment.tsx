import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, CreditCard, Wallet, Banknote, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cartStore';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    title: 'UPI',
    icon: <Wallet size={24} color={Colors.primary} />,
    description: 'Google Pay, PhonePe, Paytm',
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    icon: <CreditCard size={24} color={Colors.primary} />,
    description: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'netbanking',
    title: 'Netbanking',
    icon: <Banknote size={24} color={Colors.primary} />,
    description: 'All Indian banks',
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    icon: <Banknote size={24} color={Colors.primary} />,
    description: 'Pay cash at your doorstep',
  },
];

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const { getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const finalAmount = totalPrice + 40 + Math.round(totalPrice * 0.05);

  const handlePayment = () => {
    // Navigate to confirm or success
    router.push('/checkout/confirm');
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Options</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         <Text style={styles.sectionTitle}>Recommended</Text>
         
         <View style={styles.methodsContainer}>
            {PAYMENT_METHODS.map((method) => (
               <TouchableOpacity 
                  key={method.id} 
                  style={[styles.methodCard, selectedMethod === method.id && styles.methodCardSelected]}
                  onPress={() => setSelectedMethod(method.id)}
               >
                  <View style={styles.iconContainer}>
                     {method.icon}
                  </View>
                  <View style={styles.methodInfo}>
                     <Text style={styles.methodTitle}>{method.title}</Text>
                     <Text style={styles.methodDesc}>{method.description}</Text>
                  </View>
                  <View style={[styles.radio, selectedMethod === method.id && styles.radioSelected]}>
                     {selectedMethod === method.id && <View style={styles.radioInner} />}
                  </View>
               </TouchableOpacity>
            ))}
         </View>
      </ScrollView>

      <View style={styles.footer}>
         <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Amount to Pay</Text>
            <Text style={styles.totalValue}>₹{finalAmount}</Text>
         </View>
         <Button 
            title="Place Order" 
            onPress={handlePayment}
            style={styles.payButton}
         />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  methodsContainer: {
    gap: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF8F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '800',
  },
  payButton: {
    width: 160,
  },
});
