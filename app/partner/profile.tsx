import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

export default function PartnerProfile() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Partner Profile</Text>
      <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>Anita Sharma</Text>
          
          <Text style={styles.label}>Kitchen Name</Text>
          <Text style={styles.value}>Anita's Kitchen</Text>
          
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>+91 9876543210</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
          <Text style={styles.logoutText}>Logout / Switch to User App</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.text,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
});
