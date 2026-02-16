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
    }
  }, [id, isEdit, loadAddress]);

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
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={`${formData.house_flat_no ? formData.house_flat_no + ', ' : ''}${formData.building_society ? formData.building_society + ', ' : ''}${formData.street_area ? formData.street_area : ''}`}
                onChangeText={t => {
                   // Simple parsing for the demo, in real app would have separate fields
                   setFormData({...formData, street_area: t});
                }}
                multiline
                placeholder="778 Locust View Drive Oaklanda, CA"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleSave} disabled={loading}>
            <Text style={styles.applyButtonText}>Apply</Text>
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
    marginBottom: 40,
  },
  form: {
    gap: 25,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3E1F1F',
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#F5EBC1',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    color: '#3E1F1F',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  applyButton: {
    backgroundColor: '#EE5D28',
    borderRadius: 25,
    paddingVertical: 12,
    width: 120,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 50,
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
