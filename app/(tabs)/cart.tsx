import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cartStore';

export default function CartScreen() {
  const { items, getTotalPrice, removeItem, clearCart } = useCartStore();
  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <Screen backgroundColor={Colors.background} safeArea={true}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <ShoppingBag size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything to your cart yet.</Text>
          
          <Button 
            title="Browse Food" 
            onPress={() => router.push('/(tabs)/home')}
            style={styles.browseButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity onPress={clearCart}>
           <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
               <View style={styles.itemInfo}>
                  <View style={styles.titleRow}>
                     <View style={[styles.vegIcon, { borderColor: item.isVeg ? 'green' : 'red' }]}>
                        <View style={[styles.vegDot, { backgroundColor: item.isVeg ? 'green' : 'red' }]} />
                     </View>
                     <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                  {item.selectedVariant && (
                     <Text style={styles.variantText}>{item.selectedVariant.name}</Text>
                  )}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                     <Text style={styles.addonText}>+ {item.selectedAddons.map(a => a.name).join(', ')}</Text>
                  )}
               </View>
               
               <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyBtn}>
                     <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn}>
                     <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
               </View>
            </View>
         ))}

         <View style={styles.billSection}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>Item Total</Text>
               <Text style={styles.billValue}>₹{totalPrice}</Text>
            </View>
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>Delivery Fee</Text>
               <Text style={styles.billValue}>₹40</Text>
            </View>
            <View style={styles.billRow}>
               <Text style={styles.billLabel}>Taxes</Text>
               <Text style={styles.billValue}>₹{Math.round(totalPrice * 0.05)}</Text>
            </View>
            <View style={[styles.billRow, styles.totalRow]}>
               <Text style={styles.totalLabel}>To Pay</Text>
               <Text style={styles.totalValue}>₹{totalPrice + 40 + Math.round(totalPrice * 0.05)}</Text>
            </View>
         </View>
      </ScrollView>

      <View style={styles.footer}>
         <Button 
            title="Proceed to Pay" 
            onPress={() => router.push('/checkout/summary')}
            size="lg"
            style={styles.payButton}
            icon={<ArrowRight size={20} color="#fff" />}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  clearText: {
    color: Colors.error,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    width: 200,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vegIcon: {
    width: 14,
    height: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  variantText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    height: 32,
  },
  qtyBtn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  qtyText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  billSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
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
  },
  payButton: {
    width: '100%',
  },
});
