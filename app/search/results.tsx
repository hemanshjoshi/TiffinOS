import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, Star, SlidersHorizontal, Search } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

export default function SearchResultsScreen() {
  const { q } = useLocalSearchParams();
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      
      // Use the new global search RPC
      try {
        const { data, error } = await supabase.rpc('search_global', { search_query: q });
        
        if (error) {
          console.error('Search RPC Error:', error);
          setResults([]);
        } else if (data) {
          // Combine kitchens and dishes
          const combined = [
            ...(data.kitchens || []),
            ...(data.dishes || [])
          ];
          setResults(combined);
        }
      } catch (e) {
        console.error('Search Exception:', e);
      }
      
      setLoading(false);
    };

    fetchResults();
  }, [q]);

  const renderItem = ({ item }: { item: any }) => {
    const isDish = item.type === 'dish';
    const link = isDish ? `/kitchen/${item.kitchen_id}` : `/kitchen/${item.id}`; // Both go to kitchen for now

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(link)}
      >
        <Image 
            source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }} 
            style={styles.image} 
            resizeMode="cover" 
          />
        
        <View style={styles.content}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              {item.rating && (
                <View style={styles.rating}>
                  <Text style={styles.ratingText}>{item.rating}</Text>
                  <Star size={10} color="#fff" fill="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.row}>
              {isDish ? (
                 <Text style={styles.tags}>In {item.kitchen_name}</Text>
              ) : (
                 <Text style={styles.tags}>Kitchen</Text>
              )}
              {isDish ? (
                <Text style={styles.price}>₹{item.price}</Text>
              ) : (
                <Text style={styles.price}>View Menu</Text>
              )}
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.time}>{isDish ? 'Order Now' : '25 min delivery'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
           <Text style={styles.searchLabel} numberOfLines={1}>{q}</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/search/filters')} style={styles.filterButton}>
           <SlidersHorizontal size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>{results.length} results found</Text>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={{ textAlign: 'center', marginTop: 50, color: Colors.textSecondary }}>No kitchens found matching "{q}"</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  list: {
    padding: 24,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
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
    fontWeight: '800',
    color: Colors.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tags: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
