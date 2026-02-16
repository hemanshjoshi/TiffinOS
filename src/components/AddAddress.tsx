import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Home, MapPin, LocateFixed, ShoppingBag, Heart, Search, User } from 'lucide-react-native';
import { useState, useEffect, useCallback, createElement } from 'react';
import { AddressService } from '@/services/address';
import { Address } from '@/types/address';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';
import { useAddressStore } from '@/store/addressStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'AIzaSyBLqn_6wCZ7eaql9MpVsBbZD284ultRrcA';

// Simple Leaflet Map Component for Web using iframe
const LeafletMap = ({ lat, lng, onLocationSelect }: { lat: number, lng: number, onLocationSelect: (lat: number, lng: number) => void }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; }
        #map { height: 100%; width: 100%; }
        .leaflet-control-attribution { display: none; } 
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl: false}).setView([${lat}, ${lng}], 18);
        
        L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
            maxZoom: 20,
            subdomains:['mt0','mt1','mt2','mt3']
        }).addTo(map);
        
        var redIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        var marker = L.marker([${lat}, ${lng}], {draggable: true, icon: redIcon}).addTo(map);
        
        L.control.zoom({ position: 'topright' }).addTo(map);
        
        function updateParent(lat, lng) {
          window.parent.postMessage({type: 'locationUpdate', lat: lat, lng: lng}, '*');
        }

        marker.on('dragend', function(e) {
          var coord = e.target.getLatLng();
          updateParent(coord.lat, coord.lng);
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          updateParent(e.latlng.lat, e.latlng.lng);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12 }}>
      {createElement('iframe', {
        srcDoc: htmlContent,
        style: { width: '100%', height: '100%', border: 'none', display: 'block' }
      })}
    </View>
  );
};

export default function AddAddressScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const { user: authUser } = useAuth();
  const selectedAddress = useAddressStore((state) => state.selectedAddress);
  const setSelectedAddress = useAddressStore((state) => state.setSelectedAddress);
  
  const [loading, setLoading] = useState(false);

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
      detectLocation();
    }
  }, [id, isEdit, loadAddress]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'locationUpdate') {
         const { lat, lng } = event.data;
         setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
         fetchAddressDetails(lat, lng);
      }
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }
  }, []);

  const fetchAddressDetails = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        
        let street = '';
        let route = '';
        let neighborhood = '';
        let sublocality = '';
        let city = '';
        let state = '';
        let pincode = '';
        let premise = '';

        components.forEach((c: any) => {
          if (c.types.includes('street_number')) street = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('neighborhood')) neighborhood = c.long_name;
          if (c.types.includes('sublocality')) sublocality = c.long_name;
          if (c.types.includes('administrative_area_level_2') || c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_1')) state = c.long_name;
          if (c.types.includes('postal_code')) pincode = c.long_name;
          if (c.types.includes('premise')) premise = c.long_name;
        });

        let streetArea = [premise, street, route, neighborhood, sublocality].filter(Boolean).join(', ');
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          street_area: streetArea || result.formatted_address,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode,
          landmark: neighborhood || sublocality || ''
        }));
      }
    } catch (e) {
      console.error("Google Geocoding failed", e);
    }
  };

  const detectLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      setFormData(prev => ({ ...prev, latitude, longitude }));
      await fetchAddressDetails(latitude, longitude);
      
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not detect location');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.house_flat_no || !formData.street_area) {
        Alert.alert('Error', 'Please fill all required fields.');
        return;
    }

    setLoading(true);
    try {
        let savedAddress;
        if (isEdit) {
            savedAddress = await AddressService.updateAddress(id as string, formData);
            if (selectedAddress?.id === id) {
                setSelectedAddress(savedAddress);
            }
        } else {
            savedAddress = await AddressService.addAddress(formData as Omit<Address, 'id'>);
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
          
          {/* Map Section */}
          <View style={styles.mapContainer}>
            {formData.latitude && formData.longitude ? (
              <>
                <LeafletMap 
                  lat={formData.latitude} 
                  lng={formData.longitude} 
                  onLocationSelect={(lat, lng) => {}} 
                />
                <View style={styles.dragHint}>
                   <Text style={styles.dragHintText}>Drag pin to adjust exact location</Text>
                </View>
              </>
            ) : (
              <View style={styles.mapPlaceholder}>
                  {loading ? <ActivityIndicator color={Colors.primary} /> : <MapPin size={32} color={Colors.primary} />}
                  <Text style={styles.mapText}>{loading ? 'Fetching location...' : 'Map loading...'}</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.gpsButton} onPress={detectLocation}>
                <LocateFixed size={16} color={Colors.primary} />
                <Text style={styles.gpsText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.houseIconContainer}>
            <Home size={40} color="#EE5D28" strokeWidth={1} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.input}
                value={formData.label}
                onChangeText={t => setFormData({...formData, label: t as any})}
                placeholder="e.g. My Home"
                placeholderTextColor="rgba(62, 31, 31, 0.4)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>House / Flat No</Text>
              <TextInput 
                style={styles.input}
                value={formData.house_flat_no}
                onChangeText={t => setFormData({...formData, house_flat_no: t})}
                placeholder="e.g. B-404"
                placeholderTextColor="rgba(62, 31, 31, 0.4)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Building / Society</Text>
              <TextInput 
                style={styles.input}
                value={formData.building_society}
                onChangeText={t => setFormData({...formData, building_society: t})}
                placeholder="e.g. Gokuldham"
                placeholderTextColor="rgba(62, 31, 31, 0.4)"
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
                placeholderTextColor="rgba(62, 31, 31, 0.4)"
              />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.city}
                        onChangeText={t => setFormData({...formData, city: t})}
                        placeholderTextColor="rgba(62, 31, 31, 0.4)"
                    />
                </View>
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                    <Text style={styles.inputLabel}>Pincode</Text>
                    <TextInput 
                        style={styles.input} 
                        value={formData.pincode}
                        onChangeText={t => setFormData({...formData, pincode: t})}
                        keyboardType="number-pad"
                        placeholderTextColor="rgba(62, 31, 31, 0.4)"
                    />
                </View>
            </View>
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyButtonText}>Save Address</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>

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
    paddingHorizontal: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 100,
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    marginTop: 10,
    color: '#888',
  },
  gpsButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EE5D28',
    marginLeft: 5,
  },
  dragHint: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dragHintText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  houseIconContainer: {
    alignSelf: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(245, 235, 193, 0.5)',
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
    width: 200,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
