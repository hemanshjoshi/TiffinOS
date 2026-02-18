import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export default function BestSellersScreen() {
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    setLoading(true);
    // Fetch top rated kitchens or specific best sellers
    const { data, error } = await supabase
      .from('kitchens')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (data) {
      setKitchens(data);
    }
    setLoading(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/kitchen/${item.id}`)}
    >
      <Image 
        source={{ uri: item.profile_image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.image} 
        contentFit="cover"
        transition={200}
      />
      <View style={styles.cardContent}>
        <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{item.kitchen_name || 'Kitchen Name'}</Text>
            <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                <Star size={10} color="#fff" fill="#fff" />
            </View>
        </View>
        <Text style={styles.cuisine}>{item.cuisine || 'North Indian, Chinese'}</Text>
        <View style={styles.priceRow}>
            <Text style={styles.price}>₹200 for one</Text>
            <View style={styles.addButton}>
                <Text style={styles.addButtonText}>Order</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Best Sellers</Text>
      </View>

      <FlatList
        data={kitchens}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E65100', // Orange
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cuisine: {
    color: '#666',
    marginBottom: 12,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#E65100',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
