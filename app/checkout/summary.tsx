import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ChevronLeft, Pencil, Trash2, Minus, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useAddressStore } from '@/store/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSummaryScreen() {
  const { items, getTotalPrice, addItem, removeItem } = useCartStore();
  const { selectedAddress } = useAddressStore();
  const subtotal = getTotalPrice();
  const tax = 5.00;
  const delivery = 3.00;
  const total = subtotal + tax + delivery;

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Order</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <TouchableOpacity onPress={() => router.push('/address')}>
                <Pencil size={18} color="#EE5D28" />
              </TouchableOpacity>
            </View>
            <View style={styles.addressDisplay}>
              <Text style={styles.addressText}>
                {selectedAddress 
                  ? `${selectedAddress.house_flat_no}, ${selectedAddress.building_society}, ${selectedAddress.street_area}, ${selectedAddress.city}`
                  : '778 Locust View Drive Oaklanda, CA'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.separator} />

            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1541167760496-1628856ab752?q=80&w=1000&auto=format&fit=crop' }} 
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Trash2 size={18} color="#EE5D28" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemDate}>29 Nov, 15:20 pm</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.itemQuantityText}>{item.quantity} items</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.cancelItemButton}>
                      <Text style={styles.cancelItemText}>Cancel Order</Text>
                    </TouchableOpacity>
                    <View style={styles.quantityControls}>
                      <Pencil size={14} color="#EE5D28" />
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <View style={styles.qtyBtn}>
                          <Minus size={14} color="#fff" />
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => addItem({id: item.menuItemId, name: item.name, price: item.price}, item.selectedVariant, item.selectedAddons)}>
                        <View style={[styles.qtyBtn, styles.qtyBtnPlus]}>
                          <Plus size={14} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.billSection}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax and Fees</Text>
              <Text style={styles.billValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery</Text>
              <Text style={styles.billValue}>${delivery.toFixed(2)}</Text>
            </View>
            <View style={styles.billSeparator} />
            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.placeOrderButton}
            onPress={() => router.push('/checkout/confirm')}
          >
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Tab Bar Placeholder */}
      <View style={styles.bottomTab}>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDCB52',
  },
  yellowHeader: {
    height: 150,
    backgroundColor: '#FDCB52',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingHorizontal: 30,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3E1F1F',
  },
  addressDisplay: {
    backgroundColor: '#F5EBC1',
    borderRadius: 20,
    padding: 15,
  },
  addressText: {
    fontSize: 16,
    color: '#3E1F1F',
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#FFE8E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  editButtonText: {
    color: '#EE5D28',
    fontSize: 12,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1F1F',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    color: '#7A7A7A',
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EE5D28',
    position: 'absolute',
    right: 0,
    top: 25,
  },
  itemQuantityText: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelItemButton: {
    backgroundColor: '#FFE8E0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  cancelItemText: {
    color: '#EE5D28',
    fontSize: 13,
    fontWeight: '700',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFE8E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: '#EE5D28',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E1F1F',
  },
  billSection: {
    gap: 12,
    marginBottom: 30,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1F1F',
  },
  billValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1F1F',
  },
  billSeparator: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 1,
    marginVertical: 5,
  },
  totalLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3E1F1F',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3E1F1F',
  },
  placeOrderButton: {
    backgroundColor: '#FFE8E0',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 40,
    marginTop: 10,
  },
  placeOrderText: {
    color: '#EE5D28',
    fontSize: 20,
    fontWeight: '700',
  },
  bottomTab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#EE5D28',
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.8,
  }
});
