import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, Star, Heart } from 'lucide-react-native';

const MOCK_ITEMS = [
  {
    id: '1',
    name: 'Domino\'s Pizza',
    rating: 4.5,
    time: '30 min',
    image: 'https://b.zmtcdn.com/data/pictures/chains/1/10571/6f0e74283c4f74d9e033100c8788410d.jpg',
    tags: ['Pizza', 'Fast Food'],
    price: '₹200 for one',
  },
  {
    id: '2',
    name: 'La Pino\'z Pizza',
    rating: 4.2,
    time: '40 min',
    image: 'https://b.zmtcdn.com/data/pictures/chains/2/18600752/7762634d0b134d11019f56477114b7e1.jpg',
    tags: ['Pizza', 'Italian'],
    price: '₹250 for one',
  },
  {
    id: '3',
    name: 'Pizza Hut',
    rating: 4.0,
    time: '35 min',
    image: 'https://b.zmtcdn.com/data/pictures/chains/6/10506/42527710920f32104085f12ee566d48c.jpg',
    tags: ['Pizza', 'Fast Food'],
    price: '₹300 for one',
  },
];

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const title = typeof id === 'string' ? id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ') : 'Category';

  const renderItem = ({ item }: { item: typeof MOCK_ITEMS[0] }) => (
    <TouchableOpacity 
       style={styles.card}
       onPress={() => router.push(`/kitchen/${item.id}`)}
    >
       <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
       
       <View style={styles.content}>
          <View style={styles.row}>
             <Text style={styles.name}>{item.name}</Text>
             <View style={styles.rating}>
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Star size={10} color="#fff" fill="#fff" />
             </View>
          </View>
          
          <View style={styles.row}>
             <Text style={styles.tags}>{item.tags.join(', ')}</Text>
             <Text style={styles.price}>{item.price}</Text>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.time}>{item.time} delivery</Text>
       </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={MOCK_ITEMS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  list: {
    padding: 24,
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
    backgroundColor: '#239B56',
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
