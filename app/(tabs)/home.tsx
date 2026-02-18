import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, StatusBar, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Screen } from '@/components/ui/Screen';
import SkeletonCard from '@/components/SkeletonCard';
import { Search, SlidersHorizontal, Star, Heart, ChevronDown, Zap, Menu, Bell, ShoppingBag, User, MapPin, AlertCircle } from 'lucide-react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';
import { useAddressStore } from '@/store/addressStore';
import { useAuth } from '@/services/authContext';
import { useProfileStore } from '@/store/profileStore';
import { AddressService } from '@/services/address';
import SideMenu from '@/components/SideMenu';
import { FOOD_CATEGORIES } from '@/constants/Categories';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const setSelectedAddress = useAddressStore((state) => state.setSelectedAddress);
  const currentLocation = useAddressStore((state) => state.currentLocation);
  const isServiceable = useAddressStore((state) => state.isServiceable);
  const { user: authUser } = useAuth();
  const { user: profile } = useProfileStore();
  
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [isNearbyOnly, setIsNearbyOnly] = useState(true);
  const [favoriteKitchenIds, setFavoriteKitchenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Snacks');
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState<string | null>(null);
  const setCurrentLocation = useAddressStore((state) => state.setCurrentLocation);

  const categories = FOOD_CATEGORIES;

  // Initialize Address & Fetch Data
  useEffect(() => {
    const initAddress = async () => {
      // If no address selected, try to detect location immediately
      if (!selectedAddress) {
         detectLocation(); 
      }

      // If user is logged in, try to fetch saved addresses to override
      if (!selectedAddress && authUser) {
        try {
          const addresses = await AddressService.getAddresses(authUser.id);
          if (addresses && addresses.length > 0) {
             const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
             setSelectedAddress(defaultAddr);
          }
        } catch (e) {
          console.error("Failed to load address", e);
        }
      }
    };
    initAddress();
  }, [authUser]);

  const detectLocation = async () => {
    console.log("Starting detectLocation...");
    setCurrentLocationName('Locating...');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to find nearby kitchens.');
        setCurrentLocationName('Location Denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = location.coords;
      console.log("Location detected:", latitude, longitude);
      
      setCurrentLocation({ latitude, longitude });

      // Reverse Geocoding
      let [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (addr && (addr.street || addr.city)) {
        const name = `${addr.street || addr.name || ''}, ${addr.city || ''}`;
        setCurrentLocationName(name.replace(/^, /, '')); 
      } else {
        // Fallback to OpenStreetMap Nominatim for Web (or if native fails)
        try {
           const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
           const data = await response.json();
           if (data && data.address) {
              // Construct a readable address from OSM data
              const house = data.address.house_number ? `${data.address.house_number}, ` : '';
              const street = data.address.road || data.address.pedestrian || data.address.suburb || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              const name = `${house}${street}, ${city}`.replace(/^, /, '');
              setCurrentLocationName(name || 'Current Location');
           } else {
              setCurrentLocationName('Current Location');
           }
        } catch (err) {
           console.error("OSM Fallback failed", err);
           setCurrentLocationName('Current Location');
        }
      }
    } catch (e) {
      console.error("Error detecting location", e);
      setCurrentLocationName('Location Error');
      // specific error handling if needed
    }
  };

  const fetchKitchens = async (forceAll = false) => {
    setLoading(true);
    
    try {
      let data, error;
      
      if (currentLocation && !forceAll && isNearbyOnly) {
        // Fetch nearby kitchens within their service radius
        console.log("Fetching nearby kitchens from kitchens table...");
        const { data: nearby, error: nearbyError } = await supabase
          .from('kitchens')
          .select('*')
          .eq('is_active', true);
        data = nearby;
        error = nearbyError;
      } else {
        // Fetch all kitchens
        console.log("Fetching all kitchens from kitchens table...");
        const { data: all, error: allError } = await supabase
          .from('kitchens')
          .select('*')
          .eq('is_active', true);
        data = all;
        error = allError;
        if (forceAll) setIsNearbyOnly(false);
      }
      
      if (error) throw error;
      setKitchens(data || []);

    } catch (err) {
      console.error("HomeScreen: Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchens();
  }, [currentLocation]);


  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => setSelectedCategory(item.name)}
    >
      <View style={[
          styles.categoryIconContainer, 
          selectedCategory === item.name && styles.categoryIconContainerActive
      ]}>
        <Image
          source={{ uri: item.icon }}
          style={styles.categoryImage}
          contentFit="contain"
        />
      </View>
      <Text style={[
        styles.categoryName, 
        selectedCategory === item.name && styles.categoryNameSelected
      ]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRecommendedCard = ({ item }: { item: any }) => (
      <TouchableOpacity 
        style={styles.recommendCard}
        onPress={() => router.push(`/kitchen/${item.id}`)}
      >
        <Image 
          source={{ uri: item.image_url || item.profile_image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop' }} 
          style={styles.recommendImage} 
          contentFit="cover" 
        />
        <View style={styles.recommendContent}>
           <Text style={styles.recommendName}>{item.kitchen_name || 'Kitchen Name'}</Text>
           <View style={styles.ratingRow}>
              <View style={styles.starBadge}>
                 <Text style={styles.starText}>{item.rating || '4.5'}</Text>
                 <Star size={10} color="#fff" fill="#fff" />
              </View>
           </View>
        </View>
      </TouchableOpacity>
  );

  console.log("HomeScreen Render: kitchens count =", kitchens.length);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Yellow Top Section */}
      <View style={styles.topSection}>
         {/* Location Header */}
         <TouchableOpacity 
            style={styles.locationHeader}
            onPress={() => router.push('/address')}
          >
            <MapPin size={18} color="#333" />
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveringToText}>Delivering to</Text>
              <View style={styles.locationNameRow}>
                <Text style={styles.locationNameText} numberOfLines={1}>
                  {selectedAddress 
                    ? `${selectedAddress.street_area}, ${selectedAddress.city}` 
                    : (currentLocationName || 'Select Location')}
                </Text>
                <ChevronDown size={14} color="#333" />
              </View>
            </View>
         </TouchableOpacity>

         {/* Header Row */}
         <View style={styles.headerRow}>
            <View style={styles.searchContainer}>
               <Search color={Colors.textSecondary} size={20} />
               <Text style={styles.searchPlaceholder}>Search for food...</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
               <SlidersHorizontal color="#fff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/cart')}>
               <ShoppingBag color="#fff" size={20} />
            </TouchableOpacity>
         </View>

         {/* Unserviceable Warning */}
         {!isServiceable && (
           <View style={styles.unserviceableBanner}>
             <AlertCircle size={16} color="#fff" />
             <Text style={styles.unserviceableText}>Not serviceable in your current location</Text>
           </View>
         )}

         {/* Greeting */}
         <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Hi {profile?.full_name?.split(' ')[0] || 'there'},</Text>
            <Text style={styles.greetingSubtitle}>Rise And Shine! It's Breakfast Time</Text>
         </View>

         {/* Categories */}
         <View style={styles.categoriesSection}>
             <FlatList 
               data={categories}
               renderItem={renderCategory}
               horizontal
               showsHorizontalScrollIndicator={false}
               keyExtractor={item => item.id}
               contentContainerStyle={styles.categoriesList}
             />
         </View>
      </View>

      {/* White Bottom Section */}
      <View style={styles.bottomSection}>
         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Best Seller */}
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Best Seller</Text>
               <TouchableOpacity onPress={() => router.push('/best-sellers')}>
                  <Text style={styles.seeAllText}>See All {'>'}</Text>
               </TouchableOpacity>
            </View>
            
            <FlatList 
               data={kitchens.slice(0, 5)}
               horizontal
               showsHorizontalScrollIndicator={false}
               keyExtractor={item => item.id}
               contentContainerStyle={styles.horizontalList}
               renderItem={({ item }) => (
                 <TouchableOpacity style={styles.bestSellerCard} onPress={() => router.push(`/kitchen/${item.id}`)}>
                    <Image 
                      source={{ uri: item.image_url || item.profile_image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop' }} 
                      style={styles.bestSellerImage} 
                      contentFit="cover" 
                    />
                 </TouchableOpacity>
               )}
            />

            {/* Banner */}
            <View style={styles.bannerContainer}>
               <View style={styles.bannerContent}>
                  <Text style={styles.bannerText}>Experience our{'\n'}delicious new dish</Text>
                  <Text style={styles.bannerDiscount}>30% OFF</Text>
               </View>
               <Image 
                  source={{ uri: 'https://img.freepik.com/free-photo/freshly-italian-pizza-with-mozzarella-cheese-slice-generative-ai_188544-12347.jpg' }} 
                  style={styles.bannerImage} 
                  contentFit="cover"
               />
            </View>

            {/* Recommend */}
            <Text style={styles.sectionTitle}>Recommend</Text>
            {kitchens.length === 0 && !loading && (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No kitchens found in your area</Text>
            )}
        <View style={styles.recommendList}>
           {kitchens.length > 0 ? (
             kitchens.map((item) => (
                <View key={item.id}>
                   {renderRecommendedCard({ item })}
                </View>
             ))
           ) : (
             <View style={{ width: '100%', alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#999', textAlign: 'center' }}>
                  {isNearbyOnly ? 'No kitchens found in your area' : 'No kitchens available at the moment'}
                </Text>
                {isNearbyOnly && (
                   <TouchableOpacity 
                    onPress={() => fetchKitchens(true)} 
                    style={{ marginTop: 12, padding: 12, backgroundColor: '#444', borderRadius: 8 }}
                  >
                     <Text style={{ color: '#fff' }}>Show All Kitchens</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => fetchKitchens()} 
                  style={{ marginTop: 20, padding: 10, backgroundColor: '#E65100', borderRadius: 8 }}
                >
                   <Text style={{ color: '#fff' }}>Retry Nearby</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>
            
            <View style={{ height: 100 }} /> 
         </ScrollView>
      </View>
      <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD54F', // Yellow Header
  },
  topSection: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  deliveringToText: {
    fontSize: 10,
    color: '#5D4037',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  unserviceableBanner: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
    marginBottom: 10,
  },
  unserviceableText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)', // Increased opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333', // Darker text for yellow bg
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#5D4037', // Brownish dark for yellow bg
    opacity: 0.9,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8E1', // Light yellow bg
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconContainerActive: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E65100',
  },
  categoryImage: {
    width: 32,
    height: 32,
  },
  categoryName: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: '600',
  },
  categoryNameSelected: {
    color: '#E65100',
    fontWeight: 'bold',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    marginBottom: 24,
  },
  bestSellerCard: {
    width: 140,
    height: 140,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bestSellerImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#E65100',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bannerContainer: {
    backgroundColor: '#E65100',
    borderRadius: 20,
    height: 150,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    zIndex: 1,
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bannerDiscount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  bannerImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    height: '100%',
  },
  recommendList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recommendCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendImage: {
    width: '100%',
    height: 100,
  },
  recommendContent: {
    padding: 10,
  },
  recommendName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#029C48', // Green for Pure Veg
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  starText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: -2,
  },
});
