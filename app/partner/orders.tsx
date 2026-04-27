import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { usePartnerKitchen } from '@/hooks/usePartnerKitchen';

const TABS = [
    { label: 'Preparing', status: ['Pending', 'Confirmed', 'Cooking'] },
    { label: 'Ready', status: ['ReadyForPickup'] },
    { label: 'Out for Delivery', status: ['OutForDelivery'] },
    { label: 'Completed', status: ['Delivered', 'Cancelled'] },
];

export default function PartnerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Preparing');
  const { kitchenId } = usePartnerKitchen();

  useEffect(() => {
    if (kitchenId) {
        fetchOrders();
        const subscription = supabase
          .channel('orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `kitchen_id=eq.${kitchenId}` }, fetchOrders)
          .subscribe();

        return () => { subscription.unsubscribe(); };
    }
  }, [kitchenId]);

  const fetchOrders = async () => {
    if (!kitchenId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setOrders(data || []);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      fetchOrders();
  };

  const getFilteredOrders = () => {
      const targetStatuses = TABS.find(t => t.label === activeTab)?.status || [];
      return orders.filter(o => targetStatuses.includes(o.status));
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>
      
      <Text style={styles.amount}>Total: ₹{item.total_amount}</Text>
      <Text style={styles.statusText}>Status: {item.status}</Text>

      <View style={styles.actionRow}>
          {item.status === 'Pending' && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus(item.id, 'Confirmed')}>
                  <Text style={styles.btnText}>Accept Order</Text>
              </TouchableOpacity>
          )}
          {item.status === 'Confirmed' && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus(item.id, 'Cooking')}>
                  <Text style={styles.btnText}>Start Cooking</Text>
              </TouchableOpacity>
          )}
          {item.status === 'Cooking' && (
              <TouchableOpacity style={styles.successButton} onPress={() => updateStatus(item.id, 'ReadyForPickup')}>
                  <Text style={styles.btnText}>Mark Ready</Text>
              </TouchableOpacity>
          )}
          {item.status === 'ReadyForPickup' && (
              <Text style={styles.infoText}>Waiting for Delivery Partner...</Text>
          )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TABS.map(tab => (
                  <TouchableOpacity 
                    key={tab.label} 
                    style={[styles.tab, activeTab === tab.label && styles.activeTab]}
                    onPress={() => setActiveTab(tab.label)}
                  >
                      <Text style={[styles.tabText, activeTab === tab.label && styles.activeTabText]}>{tab.label}</Text>
                  </TouchableOpacity>
              ))}
          </ScrollView>
      </View>

      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders in {activeTab}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabContainer: {
      backgroundColor: '#fff',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 4,
      backgroundColor: '#f0f0f0',
  },
  activeTab: {
      backgroundColor: Colors.primary,
  },
  tabText: {
      fontWeight: '600',
      color: '#666',
  },
  activeTabText: {
      color: '#fff',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderTime: {
    color: '#666',
    fontSize: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
      fontSize: 12,
      color: '#666',
      marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoText: {
      color: '#888',
      fontStyle: 'italic',
      fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});
