import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';
import { supabase } from '@/services/supabase';
import { useEffect, useState } from 'react';
import { ArrowLeft, Star, MapPin, Share2, Search, ChevronDown, Filter } from 'lucide-react-native';
import { useCartStore } from '@/store/cartStore';
import Animated, { SlideInDown } from 'react-native-reanimated';
import CustomizationModal from '@/components/CustomizationModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function KitchenDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [kitchen, setKitchen] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReplaceModalVisible, setReplaceModalVisible] = useState(false);
  const [pendingItem, setPendingItem] = useState<any>(null);

  // Constants for styling - App Theme
  const PRIMARY_COLOR = Colors.primary;
  const SECONDARY_COLOR = Colors.secondary;
  const BG_COLOR = '#ffffff';
  const TEXT_COLOR = Colors.text;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch Kitchen - Use 'kitchens' table
      const { data: profileData, error: profileError } = await supabase
        .from('kitchens')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profileData) {
        setKitchen({
          ...profileData,
          kitchen_name: profileData.kitchen_name,
          profile_image_url: profileData.profile_image_url || profileData.image_url
        });
      }

      // Fetch Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('kitchen_id', id);
      
      if (menuData) setMenuItems(menuData);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const { items, addItem, removeItem, getTotalPrice, clearCart } = useCartStore();
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [customizationVisible, setCustomizationVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getItemQty = (itemId: string) => {
    return items
      .filter(i => i.menuItemId === itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleAddItemCheck = (item: any) => {
    const itemKitchenId = id as string;
    
    // Check if cart has items from a different kitchen
    if (items.length > 0 && items[0].kitchenId !== itemKitchenId) {
      setPendingItem(item);
      setReplaceModalVisible(true);
    } else {
      proceedWithAdd(item);
    }
  };

  const handleConfirmReplace = () => {
    clearCart();
    setReplaceModalVisible(false);
    if (pendingItem) {
      setTimeout(() => {
        proceedWithAdd(pendingItem);
        setPendingItem(null);
      }, 100);
    }
  };

  const proceedWithAdd = (item: any) => {
    const itemWithKitchen = { ...item, kitchenId: id as string };
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      setSelectedItem(itemWithKitchen);
      setCustomizationVisible(true);
    } else {
      addItem(itemWithKitchen);
    }
  };

  const onAddCustomized = (item: any, variant: any, addons: any[]) => {
    addItem({ ...item, kitchenId: id as string }, variant, addons);
  };

  const handleRemoveItemCheck = (item: any) => {
     const cartItems = items.filter(i => i.menuItemId === item.id);
     if (cartItems.length > 0) {
        removeItem(cartItems[cartItems.length - 1].id);
     }
  };

  const renderMenuItem = ({ item }: { item: any }) => {
    const qty = getItemQty(item.id);

    return (
      <View style={styles.menuItem}>
        <View style={styles.menuInfo}>
          {/* Veg Icon */}
          <View style={styles.vegIcon}>
            <View style={styles.vegDot} />
          </View>
          
          <Text style={styles.menuName}>{item.name}</Text>
          <Text style={styles.menuPrice}>₹{item.price}</Text>
          
          <View style={styles.ratingBadge}>
             <Star size={10} color={Colors.primary} fill={Colors.primary} />
             <Text style={styles.ratingText}>4.5 (120)</Text>
          </View>

          <Text style={styles.menuDesc} numberOfLines={2}>{item.description || 'Delicious home cooked meal.'}</Text>
        </View>

        <View style={styles.menuImageContainer}>
          <View style={styles.imageContent}>
            <Image 
               source={{ uri: item.image_url || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
               style={styles.menuImage} 
               contentFit="cover"
            />
            <View style={styles.addButtonWrapper}>
              {qty > 0 ? (
                <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={() => handleRemoveItemCheck(item)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity onPress={() => handleAddItemCheck(item)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleAddItemCheck(item)} style={styles.addButton}>
                  <Text style={styles.addButtonText}>ADD</Text>
                  <Text style={styles.plusSign}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.customizableText}>Customisable</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={Colors.text} size={24} />
         </TouchableOpacity>
         <View style={styles.headerRight}>
            <TouchableOpacity><Search color={Colors.text} size={24} style={{ marginRight: 20 }} /></TouchableOpacity>
            <TouchableOpacity><Share2 color={Colors.text} size={24} /></TouchableOpacity>
         </View>
      </View>

      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        
        {/* Kitchen Info */}
        <View style={styles.kitchenInfo}>
           <Text style={styles.kitchenName}>{kitchen?.kitchen_name || kitchen?.kitchenName || 'Loading...'}</Text>
           
           <View style={styles.metaRow}>
              <View style={styles.ratingBox}>
                 <Text style={styles.ratingBoxText}>{kitchen?.rating || '4.1'}</Text>
                 <Star size={10} fill="#fff" color="#fff" />
              </View>
              <Text style={styles.metaText}>• {kitchen?.distance || '3.2 km'} • {kitchen?.time || '20-25 mins'}</Text>
           </View>

           <View style={styles.addressRow}>
               <MapPin size={14} color="#666" />
               <Text style={styles.addressText}>{kitchen?.address || 'Pratap Nagar'} <ChevronDown size={12} color="#666" /></Text>
           </View>
           
           <View style={styles.offerBanner}>
               <Text style={styles.offerText}>Free delivery above ₹99</Text>
               <Text style={styles.offerSubText}>6 offers</Text>
           </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
              <View style={styles.filterChip}>
                 <Filter size={14} color={Colors.text} />
                 <Text style={styles.filterText}>Filters</Text>
                 <ChevronDown size={14} color={Colors.text} />
              </View>
              <View style={styles.filterChip}><Text style={styles.filterText}>Pure Veg</Text></View>
              <View style={styles.filterChipActive}><Text style={styles.filterTextActive}>Highly reordered</Text></View>
              <View style={styles.filterChip}><Text style={styles.filterText}>Spicy</Text></View>
              <View style={styles.filterChip}><Text style={styles.filterText}>No onion</Text></View>
           </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
           <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Recommended</Text>
           </View>

           {loading ? (
              <Text style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading Menu...</Text>
           ) : menuItems.length > 0 ? (
              menuItems.map((item, index) => (
                 <View key={item.id || index}>
                    {renderMenuItem({ item })}
                    <View style={styles.divider} />
                 </View>
              ))
           ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                 <Text style={{ color: Colors.text, fontSize: 16, marginBottom: 8 }}>No items available</Text>
                 <Text style={{ color: '#888', fontSize: 14 }}>This kitchen hasn't added any menu items yet.</Text>
              </View>
           )}
           
           <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <Animated.View 
          entering={SlideInDown}
          style={styles.cartBarContainer}
        >
          <TouchableOpacity 
             style={styles.cartBar}
             onPress={() => router.push('/cart')}
          >
             <View style={styles.cartInfo}>
               <Text style={styles.cartCountText}>{cartItemCount} items added</Text>
               <Text style={styles.cartTotalText}>Extra discount unlocked!</Text>
             </View>
             <View style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>View cart {'>'}</Text>
             </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <CustomizationModal
        visible={customizationVisible}
        item={selectedItem}
        onClose={() => setCustomizationVisible(false)}
        onAdd={onAddCustomized}
      />

      <ConfirmationModal
        visible={isReplaceModalVisible}
        title="Replace cart items?"
        message="Your cart contains items from another kitchen. Do you want to discard the selection and add items from this kitchen instead?"
        onConfirm={handleConfirmReplace}
        onCancel={() => {
            setReplaceModalVisible(false);
            setPendingItem(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
  },
  kitchenInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  kitchenName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#029C48', // Green for Pure Veg
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    gap: 4,
  },
  ratingBoxText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  addressText: {
    color: '#666',
    fontSize: 12,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', // Light green bg
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#029C48',
  },
  offerText: {
    color: '#017A38',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerSubText: {
    color: '#017A38',
    fontSize: 12,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.text,
    fontSize: 12,
  },
  filterTextActive: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  menuHeader: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuInfo: {
    flex: 1,
    paddingRight: 16,
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 2,
  },
  vegDot: {
    width: 8,
    height: 8,
    backgroundColor: 'green',
    borderRadius: 4,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  menuDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  menuImageContainer: {
    width: 130,
    alignItems: 'center',
  },
  imageContent: {
    width: 130,
    height: 130,
    position: 'relative',
    marginBottom: 20, // Space for the hanging button
  },
  menuImage: {
    width: 130,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  addButtonWrapper: {
    position: 'absolute',
    bottom: -14, // Hangs half-way or slightly more
    left: 10, // Center: (130 - 110) / 2 = 10
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: '100%',
    height: 36,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  plusSign: {
    position: 'absolute',
    right: 8,
    top: 2,
    color: Colors.primary,
    fontSize: 14,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  qtyButton: {
    width: 30,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  qtyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customizableText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4, // Button takes space in margin, so small margin here is enough
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  cartBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
  },
  cartBar: {
    backgroundColor: Colors.primary, // Orange Cart Bar
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
  },
  cartInfo: {
    flex: 1,
  },
  cartCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartTotalText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
