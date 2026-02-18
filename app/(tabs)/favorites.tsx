import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { Heart, Star } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';
import { useFocusEffect, router } from 'expo-router';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          kitchens (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setFavorites(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [user])
  );

  const renderItem = ({ item }: { item: any }) => {
    const kitchen = item.kitchens;
    if (!kitchen) return null;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/kitchen/${kitchen.id}`)}
      >
        <Image 
          source={{ uri: kitchen.profile_image_url || 'https://via.placeholder.com/150' }} 
          style={styles.image} 
        />
        <View style={styles.info}>
          <Text style={styles.name}>{kitchen.kitchen_name}</Text>
          <View style={styles.ratingRow}>
             <Star size={14} color={Colors.primary} fill={Colors.primary} />
             <Text style={styles.rating}>{kitchen.rating || 'New'}</Text>
          </View>
          <Text style={styles.address} numberOfLines={1}>{kitchen.address}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
      </View>
      
      {favorites.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Heart size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>Mark your favorite food and restaurants to see them here.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFavorites} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  list: {
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  address: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  },
});
