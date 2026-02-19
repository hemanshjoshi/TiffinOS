import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { useCartStore } from '@/store/cartStore';
import { useAddressStore } from '@/store/addressStore';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Ticket, ChevronRight, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { Image } from 'expo-image';
import RazorpayCheckout from 'react-native-razorpay';

export default function CartScreen() {
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const { items, removeItem, addItem, clearCart, applyCoupon, removeCoupon, coupon: appliedCoupon } = useCartStore();
  const [tipAmount, setTipAmount] = useState(0);
  const [isCouponModalVisible, setCouponModalVisible] = useState(false);
  const [kitchen, setKitchen] = useState<any>(null);
  const [crossSellItems, setCrossSellItems] = useState<any[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [manualCouponCode, setManualCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [billSummary, setBillSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const kitchenId = items.length > 0 ? items[0].kitchenId : null;

  useEffect(() => {
    const fetchSummary = async () => {
      if (items.length > 0 && kitchenId) {
        setIsLoadingSummary(true);
        const { data, error } = await supabase.rpc('get_cart_summary', {
          p_items: items.map(item => ({
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            variant_id: item.selectedVariant?.id || null,
            addon_ids: item.selectedAddons?.map(addon => addon.id) || []
          })),
          p_coupon_code: appliedCoupon?.code || null,
          p_kitchen_id: kitchenId
        });

        if (error) {
            console.error('Error fetching summary:', error);
        } else if (data) {
            setBillSummary(data);
        }
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [items, appliedCoupon, kitchenId]);

  useEffect(() => {
    const fetchKitchen = async () => {
      if (kitchenId) {
        const { data, error } = await supabase
          .from('kitchens')
          .select('*')
          .eq('id', kitchenId)
          .single();

        if (error) {
          console.error('Error fetching kitchen:', error);
        } else {
          setKitchen(data);
        }
      }
    };

    const fetchCoupons = async () => {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error("Error fetching coupons:", error);
        } else {
            const validCoupons = data.filter(c => 
                (c.valid_until === null || new Date(c.valid_until) > new Date()) &&
                (c.kitchen_id === null || c.kitchen_id === kitchenId)
            );
            setAvailableCoupons(validCoupons);
        }
    };

    const fetchCrossSellItems = async () => {
        if (items.length > 0 && kitchenId) {
            const cartItemIds = new Set(items.map(i => i.menuItemId));
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('kitchen_id', kitchenId)
                .limit(10);

            if (error) {
                console.error("Error fetching cross sell items:", error);
            } else {
                const filteredItems = data.filter(i => !cartItemIds.has(i.id)).slice(0, 5);
                setCrossSellItems(filteredItems);
            }
        }
    };

    fetchKitchen();
    fetchCoupons();
    fetchCrossSellItems();
  }, [kitchenId]);

  const grandTotal = useMemo(() => {
    if (!billSummary) return 0;
    return billSummary.grand_total + tipAmount;
  }, [billSummary, tipAmount]);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleApplyManualCoupon = () => {
    const code = manualCouponCode.trim().toUpperCase();
    const coupon = availableCoupons.find(c => c.code === code);
    if (coupon) {
        const itemTotal = billSummary?.item_total || 0;
        if (itemTotal >= coupon.min_order_value) {
            applyCoupon(coupon);
            setCouponModalVisible(false);
            setManualCouponCode('');
            setCouponError('');
        } else {
            setCouponError(`Minimum order value is ₹${coupon.min_order_value}`);
        }
    } else {
        setCouponError('Invalid coupon code');
    }
  };

  const handlePayment = async () => {
    if (!selectedAddress) {
        Alert.alert('Address Required', 'Please select a delivery address first.');
        return;
    }

    setIsProcessingPayment(true);
    
    try {
        const options = {
            description: 'Order Payment for Maakhana',
            image: 'https://maakhana.app/logo.png',
            currency: 'INR',
            key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            amount: Math.round(grandTotal * 100),
            name: 'Maakhana App',
            prefill: {
                email: 'customer@example.com',
                contact: '9999999999',
                name: 'Maakhana User'
            },
            theme: { color: Colors.primary }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
            const payload = {
                p_kitchen_id: kitchenId,
                p_delivery_address_id: selectedAddress?.id,
                p_items: items.map(item => ({
                    menu_item_id: item.menuItemId,
                    quantity: item.quantity,
                    variant_id: item.selectedVariant?.id || null, 
                    addon_ids: item.selectedAddons?.map(addon => addon.id) || []
                })),
                p_coupon_code: appliedCoupon?.code || null
            };

            const { data: orderResponse, error } = await supabase.rpc('create_order', payload);

            if (error) throw error;

            router.replace({ pathname: '/order/success', params: { orderId: orderResponse.order_id } });
            setTimeout(() => clearCart(), 500);
        }).catch((error: any) => {
            console.log('Payment failed:', error);
            Alert.alert('Payment Failed', 'Payment failed or cancelled.');
        }).finally(() => {
            setIsProcessingPayment(false);
        });

    } catch (error: any) {
        console.error('Payment Error:', error);
        Alert.alert('Error', 'Failed to initiate payment.');
        setIsProcessingPayment(false);
    }
  };

  const renderCartItem = (item: any) => {
    let customizationText = '';
    if (item.selectedVariant) {
        customizationText += item.selectedVariant.name;
    }
    if (item.selectedAddons && item.selectedAddons.length > 0) {
        if (customizationText) customizationText += ' | ';
        customizationText += item.selectedAddons.map((a: any) => a.name).join(', ');
    }

    return (
        <View key={item.id} style={styles.cartItem}>
            <View style={styles.cartItemRow}>
                <View style={styles.vegIcon}>
                    <View style={[styles.vegDot, !item.isVeg && styles.nonVegDot]} />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {customizationText ? (
                        <View style={styles.customizationRow}>
                            <Text style={styles.itemCustomization}>{customizationText}</Text>
                        </View>
                    ) : (
                        <View style={styles.customizationRow}>
                             <Text style={styles.itemPriceUnit}>₹{item.price}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.qtyContainer}>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addItem(item, item.selectedVariant, item.selectedAddons)} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
            </View>
        </View>
    );
  };

  if (items.length === 0) {
     return (
        <SafeAreaView style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Browse Kitchens</Text>
            </TouchableOpacity>
        </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#000" size={24} />
         </TouchableOpacity>
         <View>
             <Text style={styles.headerTitle}>{kitchen ? kitchen.kitchen_name || kitchen.kitchenName : 'Your Cart'}</Text>
             {kitchen && <Text style={styles.headerSubtitle}>{kitchen.address}</Text>}
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Items List */}
        <View style={styles.section}>
            {items.map(renderCartItem)}
            
            <View style={styles.inputRow}>
                <TextInput 
                    placeholder="Add a note for the restaurant"
                    style={styles.noteInput}
                    placeholderTextColor="#999"
                />
            </View>
        </View>

        {/* Cross Sell */}
        {crossSellItems && crossSellItems.length > 0 && (
            <View style={styles.crossSellSection}>
                <Text style={styles.crossSellTitle}>Complete your meal with</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {crossSellItems.map((item) => (
                        <View key={item.id} style={styles.crossSellCard}>
                            <Image source={{ uri: item.image_url || item.image }} style={styles.crossSellImage} />
                            <View style={styles.crossSellInfo}>
                                <View style={styles.vegIconSmall}>
                                    <View style={styles.vegDotSmall} />
                                </View>
                                <Text style={styles.crossSellName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.crossSellPrice}>₹{item.price}</Text>
                            </View>
                            <TouchableOpacity style={styles.crossSellAdd} onPress={() => addItem(item)}>
                                <Text style={styles.crossSellAddText}>ADD</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        )}

        {/* Coupons */}
        <View style={styles.section}>
            <TouchableOpacity style={styles.couponRow} onPress={() => setCouponModalVisible(true)}>
                <View style={styles.couponLeft}>
                    <Ticket size={20} color={Colors.primary} />
                    <View>
                        {appliedCoupon ? (
                            <View>
                                <Text style={styles.couponTextApplied}>Code {appliedCoupon.code} applied</Text>
                                <Text style={styles.couponSavings}>You saved ₹{billSummary?.discount_amount || 0}</Text>
                            </View>
                        ) : (
                            <Text style={styles.couponText}>Apply Coupon</Text>
                        )}
                    </View>
                </View>
                {appliedCoupon ? (
                     <TouchableOpacity onPress={removeCoupon}>
                        <Text style={[styles.viewCoupons, {color: 'red'}]}>Remove</Text>
                     </TouchableOpacity>
                ) : (
                     <Text style={styles.viewCoupons}>View All</Text>
                )}
            </TouchableOpacity>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.billTitle}>Bill Summary</Text>
                {isLoadingSummary && <ActivityIndicator size="small" color={Colors.primary} />}
            </View>
            
            {billSummary ? (
                <>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Item Total</Text>
                        <Text style={styles.billValue}>₹{billSummary.item_total}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Restaurant packaging charges</Text>
                        <Text style={styles.billValue}>₹{billSummary.packaging_charge}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Delivery partner fee</Text>
                        <View style={{flexDirection: 'row'}}>
                            {billSummary.delivery_fee === 0 ? (
                                <Text style={[styles.billValue, {color: Colors.primary}]}>FREE</Text>
                            ) : (
                                <Text style={styles.billValue}>₹{billSummary.delivery_fee}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>Platform fee</Text>
                        <Text style={styles.billValue}>₹{billSummary.platform_fee}</Text>
                    </View>
                    <View style={styles.billRow}>
                        <Text style={styles.billLabel}>GST (govt. taxes)</Text>
                        <Text style={styles.billValue}>₹{billSummary.gst_amount}</Text>
                    </View>
                    {tipAmount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={styles.billLabel}>Delivery Tip</Text>
                            <Text style={styles.billValue}>₹{tipAmount}</Text>
                        </View>
                    )}
                    {billSummary.discount_amount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, {color: Colors.success}]}>Coupon Discount</Text>
                            <Text style={[styles.billValue, {color: Colors.success}]}>-₹{billSummary.discount_amount}</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.billRow}>
                        <Text style={styles.totalLabel}>To Pay</Text>
                        <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
                    </View>
                </>
            ) : (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
            )}
        </View>

        {/* Tip Section */}
        <View style={styles.section}>
            <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>Tip your delivery partner</Text>
            </View>
            <Text style={styles.tipSubtitle}>Your kindness means a lot! 100% of your tip will go directly to them.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipOptions}>
                {[15, 20, 30, 50].map((amount) => (
                    <TouchableOpacity 
                        key={amount} 
                        style={[styles.tipChip, tipAmount === amount && styles.tipChipActive]}
                        onPress={() => setTipAmount(tipAmount === amount ? 0 : amount)}
                    >
                        <Text style={[styles.tipText, tipAmount === amount && styles.tipTextActive]}>₹{amount}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policyContainer}>
            <Text style={styles.policyTitle}>CANCELLATION POLICY</Text>
            <Text style={styles.policyText}>Orders cannot be cancelled once packed by the restaurant. In case of unexpected delays, a refund will be provided, if applicable.</Text>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, (isProcessingPayment || !billSummary) && { opacity: 0.8 }]} 
            onPress={handlePayment}
            disabled={isProcessingPayment || !billSummary}
          >
             {isProcessingPayment ? (
               <View style={{ flex: 1, alignItems: 'center' }}>
                 <Text style={styles.payText}>Processing Payment...</Text>
               </View>
             ) : (
               <>
                 <View>
                     <Text style={styles.payTotal}>₹{grandTotal.toFixed(2)}</Text>
                     <Text style={styles.paySub}>TOTAL</Text>
                 </View>
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.payText}>Pay & Place Order</Text>
                    <ChevronRight color="#fff" size={20} />
                 </View>
               </>
             )}
          </TouchableOpacity>
      </View>

      {/* Coupon Modal */}
      <Modal visible={isCouponModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Apply Coupon</Text>
                    <TouchableOpacity onPress={() => setCouponModalVisible(false)}>
                        <X color="#000" size={24} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.manualCouponContainer}>
                    <TextInput
                        style={styles.manualCouponInput}
                        placeholder="Enter coupon code"
                        value={manualCouponCode}
                        onChangeText={(text) => {
                            setManualCouponCode(text);
                            setCouponError('');
                        }}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity 
                        style={[styles.applyButton, !manualCouponCode && styles.applyButtonDisabled]} 
                        disabled={!manualCouponCode}
                        onPress={handleApplyManualCoupon}
                    >
                        <Text style={styles.applyButtonText}>APPLY</Text>
                    </TouchableOpacity>
                </View>
                {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}

                <Text style={styles.availableCouponsTitle}>Available Coupons</Text>

                <ScrollView contentContainerStyle={styles.couponList}>
                    {availableCoupons.map((coupon: any) => {
                        const itemTotal = billSummary?.item_total || 0;
                        const isApplicable = itemTotal >= coupon.min_order_value;
                        return (
                            <TouchableOpacity 
                                key={coupon.id} 
                                style={[styles.couponCard, !isApplicable && styles.couponDisabled]}
                                disabled={!isApplicable}
                                onPress={() => {
                                    applyCoupon(coupon);
                                    setCouponModalVisible(false);
                                }}
                            >
                                <View style={styles.couponHeader}>
                                    <View style={styles.codeBadge}>
                                        <Text style={styles.codeText}>{coupon.code}</Text>
                                    </View>
                                    {appliedCoupon?.code === coupon.code && <Text style={styles.appliedText}>APPLIED</Text>}
                                </View>
                                <Text style={styles.couponTitle}>{coupon.code}</Text>
                                <Text style={styles.couponDesc}>{coupon.description}</Text>
                                <Text style={styles.couponDesc}>
                                    {coupon.discount_type === 'FLAT' 
                                        ? `Flat ₹${coupon.discount_value} off` 
                                        : `${coupon.discount_value}% off up to ₹${coupon.max_discount || 'unlimited'}`}
                                </Text>
                                {!isApplicable && (
                                    <Text style={styles.minOrderText}>Add items worth ₹{coupon.min_order_value - itemTotal} more to apply</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    {availableCoupons.length === 0 && (
                        <Text style={styles.noCouponsText}>No coupons available for this kitchen.</Text>
                    )}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cartItem: {
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vegIcon: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    marginTop: 4,
    marginRight: 8,
  },
  vegDot: {
    width: 8,
    height: 8,
    backgroundColor: 'green',
    borderRadius: 4,
  },
  nonVegDot: {
    backgroundColor: 'red',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  customizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCustomization: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  itemPriceUnit: {
    fontSize: 14,
    color: '#666',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
    height: 30,
    marginRight: 12,
  },
  qtyButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: 'bold',
  },
  itemTotal: {
    fontWeight: 'bold',
    fontSize: 14,
    width: 60,
    textAlign: 'right',
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  crossSellSection: {
    marginBottom: 16,
  },
  crossSellTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.text,
  },
  crossSellCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    elevation: 1,
  },
  crossSellImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  crossSellInfo: {
    marginBottom: 8,
  },
  vegIconSmall: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    marginBottom: 4,
  },
  vegDotSmall: {
    width: 6,
    height: 6,
    backgroundColor: 'green',
    borderRadius: 3,
  },
  crossSellName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  crossSellPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  crossSellAdd: {
    position: 'absolute',
    top: 95,
    right: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 2,
  },
  crossSellAddText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 12,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  couponTextApplied: {
    fontWeight: 'bold',
    color: Colors.success,
  },
  couponSavings: {
    fontSize: 10,
    color: Colors.success,
  },
  viewCoupons: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  couponList: {
    padding: 16,
  },
  couponCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  couponDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  codeText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 12,
  },
  couponTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  couponDesc: {
    color: '#666',
    fontSize: 12,
  },
  minOrderText: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  manualCouponContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  manualCouponInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      textTransform: 'uppercase',
  },
  applyButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderRadius: 8,
  },
  applyButtonDisabled: {
      backgroundColor: '#ccc',
  },
  applyButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  },
  errorText: {
      color: 'red',
      fontSize: 12,
      paddingHorizontal: 16,
      marginTop: 4,
  },
  availableCouponsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      paddingHorizontal: 16,
      marginTop: 16,
      color: '#666',
  },
  noCouponsText: {
      textAlign: 'center',
      marginTop: 20,
      color: '#999',
  },
  appliedText: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 12,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    color: '#666',
    fontSize: 14,
  },
  billValue: {
    color: Colors.text,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  tipChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  tipChipActive: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
  },
  tipText: {
    fontWeight: '600',
    color: Colors.text,
  },
  tipTextActive: {
    color: Colors.primary,
  },
  policyContainer: {
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  policyTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  policyText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: 'green',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paySub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
});
