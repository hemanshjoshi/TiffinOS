import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function AdminDashboard() {
  const stats = [
    { label: 'Active Kitchens', value: '124' },
    { label: 'Orders Today', value: '1,432' },
    { label: 'Revenue', value: '₹4.5L' },
    { label: 'Pending Verifications', value: '12' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maakhana Admin</Text>
        <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
            {stats.map((s, i) => (
                <View key={i} style={styles.statCard}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kitchen Verifications</Text>
            {['Suman Maa (Andheri)', 'Rekha Maa (Borivali)'].map((k, i) => (
                <View key={i} style={styles.listItem}>
                    <Text style={styles.listText}>{k}</Text>
                    <View style={{flexDirection: 'row', gap: 8}}>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#ffebee'}]}>
                            <Text style={[styles.actionText, {color: 'red'}]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#e8f5e9'}]}>
                            <Text style={[styles.actionText, {color: 'green'}]}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Controls</Text>
            <TouchableOpacity style={styles.listItem} onPress={() => router.push('/admin/zones')}>
                <Text style={styles.listText}>Delivery Zone Management</Text>
                <Text style={{color: Colors.primary, fontWeight: 'bold'}}>Configure {'>'}</Text>
            </TouchableOpacity>
            <View style={styles.listItem}>
                <Text style={styles.listText}>Accepting Orders</Text>
                <Switch value={true} />
            </View>
            <View style={styles.listItem}>
                <Text style={styles.listText}>Surge Pricing</Text>
                <Switch value={false} />
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listText: {
    fontSize: 16,
    color: '#444',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
