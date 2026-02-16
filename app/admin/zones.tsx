import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export default function ZoneManagement() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    city: 'Jaipur',
    center_lat: '',
    center_lng: '',
    radius_km: '5'
  });

  const fetchZones = async () => {
    const { data, error } = await supabase.from('service_zones').select('*').order('created_at', { ascending: false });
    if (!error) setZones(data || []);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.center_lat || !newZone.center_lng) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('service_zones').insert([{
      ...newZone,
      center_lat: parseFloat(newZone.center_lat),
      center_lng: parseFloat(newZone.center_lng),
      radius_km: parseFloat(newZone.radius_km)
    }]);

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewZone({ name: '', city: 'Jaipur', center_lat: '', center_lng: '', radius_km: '5' });
      fetchZones();
    }
  };

  const toggleZone = async (id: string, currentStatus: boolean) => {
    await supabase.from('service_zones').update({ is_active: !currentStatus }).eq('id', id);
    fetchZones();
  };

  const deleteZone = async (id: string) => {
    Alert.alert('Delete Zone', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('service_zones').delete().eq('id', id);
        fetchZones();
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zone Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Delivery Zone</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Zone Name (e.g. Malviya Nagar)" 
            value={newZone.name}
            onChangeText={t => setNewZone({...newZone, name: t})}
          />
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, {flex: 1, marginRight: 8}]} 
              placeholder="Lat" 
              keyboardType="numeric"
              value={newZone.center_lat}
              onChangeText={t => setNewZone({...newZone, center_lat: t})}
            />
            <TextInput 
              style={[styles.input, {flex: 1, marginLeft: 8}]} 
              placeholder="Lng" 
              keyboardType="numeric"
              value={newZone.center_lng}
              onChangeText={t => setNewZone({...newZone, center_lng: t})}
            />
          </View>
          <TextInput 
            style={styles.input} 
            placeholder="Radius (KM)" 
            keyboardType="numeric"
            value={newZone.radius_km}
            onChangeText={t => setNewZone({...newZone, radius_km: t})}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddZone} disabled={loading}>
            <Text style={styles.addButtonText}>Create Zone</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Active Zones</Text>
        {zones.map(zone => (
          <View key={zone.id} style={styles.zoneCard}>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneName}>{zone.name}</Text>
              <Text style={styles.zoneDetails}>{zone.city} • {zone.radius_km}km radius</Text>
              <Text style={styles.coords}>{zone.center_lat}, {zone.center_lng}</Text>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity onPress={() => toggleZone(zone.id, zone.is_active)}>
                {zone.is_active ? <CheckCircle size={24} color="green" /> : <XCircle size={24} color="#ccc" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteZone(zone.id)}>
                <Trash2 size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row' },
  addButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  zoneCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  zoneDetails: { fontSize: 14, color: '#666', marginTop: 2 },
  coords: { fontSize: 10, color: '#999', marginTop: 4 },
  zoneActions: { flexDirection: 'row', gap: 16 },
});
