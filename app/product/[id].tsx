import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, Heart, Share2, Star, Minus, Plus } from 'lucide-react-native';
import { useCartStore } from '@/store/cartStore';

const { width } = Dimensions.get('window');

const MOCK_PRODUCT = {
  id: '1',
  name: 'Farmhouse Pizza',
  price: 450,
  description: 'Delightful combination of onion, capsicum, tomato & grilled mushroom.',
  rating: 4.5,
  ratingCount: '2K+',
  image: 'https://b.zmtcdn.com/data/pictures/chains/1/10571/6f0e74283c4f74d9e033100c8788410d.jpg',
  isVeg: true,
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    // In a real app, we'd pass the actual product object
    // addItem({ ...MOCK_PRODUCT, id: id as string });
    router.back();
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
           <Image source={{ uri: MOCK_PRODUCT.image }} style={styles.image} resizeMode="cover" />
           
           <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                 <ArrowLeft size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.rightIcons}>
                 <TouchableOpacity style={styles.iconButton}>
                    <Share2 size={24} color="#000" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.iconButton}>
                    <Heart size={24} color="#000" />
                 </TouchableOpacity>
              </View>
           </View>
        </View>

        <View style={styles.content}>
           <View style={styles.titleRow}>
              <View style={styles.vegIcon}>
                 <View style={styles.vegDot} />
              </View>
              {MOCK_PRODUCT.rating >= 4.5 && (
                 <View style={styles.bestsellerTag}>
                    <Text style={styles.bestsellerText}>Bestseller</Text>
                 </View>
              )}
           </View>

           <Text style={styles.name}>{MOCK_PRODUCT.name}</Text>
           <Text style={styles.price}>₹{MOCK_PRODUCT.price}</Text>
           
           <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                 <Text style={styles.ratingText}>{MOCK_PRODUCT.rating}</Text>
                 <Star size={12} color="#fff" fill="#fff" />
              </View>
              <Text style={styles.ratingCount}>({MOCK_PRODUCT.ratingCount} ratings)</Text>
           </View>

           <Text style={styles.description}>{MOCK_PRODUCT.description}</Text>

           <View style={styles.divider} />

           <Text style={styles.sectionTitle}>Add-ons</Text>
           {/* Mock Addons */}
           <View style={styles.addonItem}>
              <Text style={styles.addonName}>Extra Cheese</Text>
              <View style={styles.addonRight}>
                 <Text style={styles.addonPrice}>₹50</Text>
                 <TouchableOpacity style={styles.checkbox} />
              </View>
           </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
         <View style={styles.quantityControl}>
            <TouchableOpacity 
               style={styles.qtyBtn} 
               onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
               <Minus size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity 
               style={styles.qtyBtn}
               onPress={() => setQuantity(quantity + 1)}
            >
               <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
         </View>

         <Button 
            title={`Add item ₹${MOCK_PRODUCT.price * quantity}`} 
            onPress={handleAddToCart}
            style={styles.addButton}
         />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  vegDot: {
    width: 8,
    height: 8,
    backgroundColor: 'green',
    borderRadius: 4,
  },
  bestsellerTag: {
    backgroundColor: '#FF7E00', // Gold/Orange
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  addonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addonName: {
    fontSize: 16,
    color: Colors.text,
  },
  addonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addonPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 12,
    gap: 16,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    flex: 1,
  },
});
