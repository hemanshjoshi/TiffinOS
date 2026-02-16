import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useEffect, useState } from 'react';
import { useAuth } from '@/services/authContext';
import { ArrowLeft, Star, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';

export default function FavoritesScreen() {
  const { user: authUser } = useAuth();
  const [favoriteKitchens, setFavoriteKitchens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, kitchens(*)')
        .eq('user_id', authUser.id);

      if (error) throw error;
      
      setFavoriteKitchens(data.map(f => f.kitchens).filter(k => k !== null));
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [authUser]);

  const removeFavorite = async (kitchenId: string) => {
    if (!authUser) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', authUser.id)
      .eq('kitchen_id', kitchenId);

    if (!error) {
      setFavoriteKitchens(prev => prev.filter(k => k.id !== kitchenId));
    }
  };

  const renderKitchenCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/kitchen/${item.id}`)}
    >
      <Image source={{ uri: item.profile_image_url }} style={styles.cardImage} />
      <TouchableOpacity 
        style={styles.heartButton}
        onPress={() => removeFavorite(item.id)}
      >
        <Heart size={20} color={Colors.primary} fill={Colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.kitchenName}>{item.kitchen_name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Star size={10} color="#fff" fill="#fff" style={{marginLeft: 2}} />
          </View>
        </View>
        <Text style={styles.maaName}>by {item.maa_name}</Text>
        <Text style={styles.tags} numberOfLines={1}>{item.tags?.join(', ')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
      </View>

      {favoriteKitchens.length > 0 ? (
        <FlatList
          data={favoriteKitchens}
          renderItem={renderKitchenCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : !loading ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#DDD" />
          <Text style={styles.emptyText}>You haven't added any favorites yet.</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.exploreButtonText}>Explore Kitchens</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
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
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kitchenName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#239B56',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  maaName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  tags: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
