import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ChevronLeft, Home, Circle, CheckCircle2, Plus, ShoppingBag, Heart, User, Search } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { AddressService } from '@/services/address';
import { Address } from '@/types/address';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/services/authContext';
import { useAddressStore } from '@/store/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressListScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const setSelectedAddress = useAddressStore((state) => state.setSelectedAddress);
  const isFocused = useIsFocused();

  const loadAddresses = useCallback(async () => {
    // If no user, just stop loading
    if (!authUser) {
        setLoading(false);
        return;
    }
    
    console.log("Loading addresses...");
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );
      
      const data = await Promise.race([
        AddressService.getAddresses(authUser.id),
        timeoutPromise
      ]) as Address[];
      
      console.log("Addresses loaded:", data?.length);
      setAddresses(data || []);
      
      // Auto-select first address if none selected and addresses exist
      if (!selectedAddress && data && data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (e) {
      console.error("Address load error:", e);
      // Don't show alert on simple timeout, just empty list
      if (addresses.length === 0) {
         // Optional: Set dummy data for UI testing if backend fails
         // setAddresses([{ id: '1', label: 'HOME', house_flat_no: '123', street_area: 'Demo St', city: 'City', user_id: '1', pincode: '00000', state: 'State' } as Address]);
      }
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, selectedAddress]);

  useEffect(() => {
    if (isFocused) {
        loadAddresses();
    }
  }, [isFocused, loadAddresses]);

  const onSelectAddress = (item: Address) => {
    setSelectedAddress(item);
  };

  const renderItem = ({ item }: { item: Address }) => {
    const isSelected = selectedAddress?.id === item.id;
    return (
      <View style={styles.addressItemContainer}>
        <TouchableOpacity 
          style={styles.addressItem} 
          onPress={() => onSelectAddress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.addressIconContainer}>
            <Home size={28} color="#EE5D28" />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>{item.label === 'HOME' ? 'My home' : item.label === 'WORK' ? 'My Office' : item.label}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {item.house_flat_no}, {item.building_society}, {item.street_area}, {item.city}
            </Text>
          </View>
          <View style={styles.radioContainer}>
            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
              {isSelected && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.separator} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Delivery Address</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#EE5D28" />
            <Text style={{marginTop: 20, color: '#7A7A7A'}}>Loading addresses...</Text>
          </View>
        ) : (
          <FlatList
            data={addresses}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<View style={styles.listTopSeparator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No addresses saved yet.</Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity 
                style={styles.addNewButton} 
                onPress={() => router.push('/address/add')}
              >
                <Text style={styles.addNewButtonText}>Add New Address</Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>

      {/* Bottom Tab Bar with Icons */}
      <View style={styles.bottomTab}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')}><Home size={24} color="#fff" strokeWidth={2} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}><ShoppingBag size={24} color="#fff" strokeWidth={2} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/favorites')}><Heart size={24} color="#fff" strokeWidth={2} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/address')}><Search size={24} color="#fff" strokeWidth={2} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}><User size={24} color="#fff" strokeWidth={2} /></TouchableOpacity>
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
    overflow: 'hidden', // Ensure content stays within rounded corners
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  listTopSeparator: {
    height: 1,
    backgroundColor: '#F0E0E0',
    marginTop: 40,
    marginBottom: 20,
  },
  addressItemContainer: {
    marginBottom: 20,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 15,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1F1F',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#7A7A7A',
    lineHeight: 18,
  },
  radioContainer: {
    paddingLeft: 10,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#EE5D28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#EE5D28',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EE5D28',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0E0E0',
    marginTop: 20,
  },
  addNewButton: {
    backgroundColor: '#FFE8E0',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  addNewButtonText: {
    color: '#EE5D28',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7A7A7A',
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
