import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Home } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { AddressService } from '@/services/address';
import { Address } from '@/types/address';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';
import { useAddressStore } from '@/store/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

export default function AddAddressScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const { user: authUser } = useAuth();
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const setSelectedAddress = useAddressStore((state) => state.setSelectedAddress);
  
  const [loading, setLoading] = useState(false);

  // Dynamically require Map components only on native platforms/when needed
  const MapView = Platform.OS !== 'web' ? require('react-native-maps').default : null;
  const Marker = Platform.OS !== 'web' ? require('react-native-maps').Marker : null;

  const [formData, setFormData] = useState<Partial<Address>>({
    label: 'HOME',
    house_flat_no: '',
    building_society: '',
    street_area: '',
    city: 'Oakland',
    state: 'CA',
    pincode: '',
    user_id: authUser?.id
  });

  const loadAddress = useCallback(async (addressId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('addresses').select('*').eq('id', addressId).single();
      if (error) throw error;
      if (data) setFormData(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load address details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadAddress(id as string);
    } else {
        // Auto-detect location on load for web for better UX
        detectLocation();
    }
  }, [id, isEdit, loadAddress]);

  const detectLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse Geocoding - Prefer OSM for Web to match Home Screen consistency
      try {
         const response = await fetch(
             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
             {
               headers: {
                 'User-Agent': 'MaakhanaApp/1.0',
                 'Accept-Language': 'en'
               }
             }
         );
         const data = await response.json();
         if (data && data.address) {
             const house = data.address.house_number ? `${data.address.house_number}, ` : '';
             const street = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood || '';
             const city = data.address.city || data.address.town || data.address.village || '';
             const state = data.address.state || '';
             const pincode = data.address.postcode || '';
             
             let streetArea = `${house}${street}`;
             if (!streetArea) streetArea = data.display_name.split(',')[0]; // Fallback to first part of display name

             setFormData(prev => ({
                 ...prev,
                 latitude,
                 longitude,
                 street_area: streetArea,
                 city: city,
                 state: state,
                 pincode: pincode,
                 building_society: data.address.suburb || data.address.residential || ''
             }));
             return; // Success with OSM
         }
      } catch (osmErr) {
         console.warn("OSM Geocoding failed, falling back to Expo Location", osmErr);
      }

      // Fallback to Expo Location (Google Maps if configured)
      let [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (addr) {
        console.log("Geocoded Address:", addr);
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          street_area: addr.street || addr.name || addr.district || prev.street_area, 
          city: addr.city || addr.subregion || prev.city,
          state: addr.region || prev.state,
          pincode: addr.postalCode || prev.pincode,
          landmark: addr.name || prev.landmark
        }));
      }
    } catch (e) {
      console.error("Location detection failed:", e);
    }
  };

  const handleSave = async () => {
    if (!formData.house_flat_no || !formData.street_area) {
        Alert.alert('Error', 'Please fill all required fields.');
        return;
    }

    // Ensure user_id is set (in case it wasn't ready at mount)
    const dataToSave = { ...formData, user_id: formData.user_id || authUser?.id };
    
    if (!dataToSave.user_id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
    }

    setLoading(true);
    try {
        let savedAddress;
        if (isEdit) {
            savedAddress = await AddressService.updateAddress(id as string, dataToSave);
            if (selectedAddress?.id === id) {
                setSelectedAddress(savedAddress);
            }
        } else {
            savedAddress = await AddressService.addAddress(dataToSave as Omit<Address, 'id'>);
            setSelectedAddress(savedAddress);
        }
        router.back();
    } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to save address');
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Address</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.houseIconContainer}>
            <Home size={120} color="#EE5D28" strokeWidth={1} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.input}
                value={formData.label}
                onChangeText={t => setFormData({...formData, label: t as any})}
                placeholder="e.g. My Home"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House / Flat No</Text>
              <TextInput 
                style={styles.input}
                value={formData.house_flat_no}
                onChangeText={t => setFormData({...formData, house_flat_no: t})}
                placeholder="e.g. B-404"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Building / Society</Text>
              <TextInput 
                style={styles.input}
                value={formData.building_society}
                onChangeText={t => setFormData({...formData, building_society: t})}
                placeholder="e.g. Gokuldham"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street / Area / Address</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={formData.street_area}
                onChangeText={t => setFormData({...formData, street_area: t})}
                multiline
                placeholder="e.g. 200 Feet Road"
              />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.city}
                        onChangeText={t => setFormData({...formData, city: t})}
                    />
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.pincode}
                        onChangeText={t => setFormData({...formData, pincode: t})}
                        keyboardType="number-pad"
                    />
                </View>
            </View>
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyButtonText}>Apply</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom Tab Bar Placeholder */}
      <View style={styles.bottomTab}>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
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
    paddingHorizontal: 30,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 100,
  },
  houseIconContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E1F1F',
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#F5EBC1',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#3E1F1F',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  applyButton: {
    backgroundColor: '#EE5D28',
    borderRadius: 25,
    paddingVertical: 12,
    width: 120,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#EE5D28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.8,
  }
});
