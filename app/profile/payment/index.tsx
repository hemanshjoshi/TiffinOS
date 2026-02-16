import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Trash2, Plus } from 'lucide-react-native';

const MOCK_CARDS = [
  { id: '1', type: 'Visa', number: '•••• •••• •••• 4242', expiry: '12/24' },
  { id: '2', type: 'Mastercard', number: '•••• •••• •••• 8888', expiry: '09/25' },
];

export default function PaymentMethodsScreen() {
  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
         {MOCK_CARDS.map((card) => (
            <View key={card.id} style={styles.cardItem}>
               <View style={styles.cardLeft}>
                  <View style={styles.cardIcon}>
                     <CreditCard size={24} color={Colors.primary} />
                  </View>
                  <View>
                     <Text style={styles.cardNumber}>{card.number}</Text>
                     <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
                  </View>
               </View>
               <TouchableOpacity>
                  <Trash2 size={20} color={Colors.textSecondary} />
               </TouchableOpacity>
            </View>
         ))}

         <TouchableOpacity 
            style={styles.addCardButton}
            onPress={() => router.push('/profile/payment/add')}
         >
            <Plus size={20} color={Colors.primary} />
            <Text style={styles.addCardText}>Add New Card</Text>
         </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 24,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 8,
  },
  addCardText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
