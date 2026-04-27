import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Power, TrendingUp, ShoppingBag, Clock } from 'lucide-react-native';

export default function PartnerDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [kitchen, setKitchen] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchKitchenStatus(user.id);
      }
    };
    checkUser();
  }, []);

  const fetchKitchenStatus = async (uid: string) => {
    try {
      // Check profiles first as kitchens might be linked there
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (error) throw error;
      
      setKitchen(data);
      setIsOnline(data.is_active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (value: boolean) => {
    if (!userId) return;
    
    // Optimistic update
    setIsOnline(value);
    
    const { error } = await supabase
        .from('profiles')
        .update({ is_open: value })
        .eq('id', userId);
        
    if (error) {
        console.error('Error updating status:', error);
        setIsOnline(!value); // Revert
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.greeting}>Namaste,</Text>
            <Text style={styles.kitchenName}>{kitchen?.kitchen_name || 'Kitchen Partner'}</Text>
        </View>
        <View style={styles.statusContainer}>
            <Text style={[styles.statusText, {color: isOnline ? 'green' : 'gray'}]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch 
                value={isOnline} 
                onValueChange={toggleOnline}
                trackColor={{ false: "#767577", true: Colors.success }}
                thumbColor={isOnline ? "#fff" : "#f4f3f4"}
            />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                <View style={[styles.iconBg, {backgroundColor: '#E3F2FD'}]}>
                    <ShoppingBag size={24} color="#1E88E5" />
                </View>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Orders Today</Text>
            </View>
            <View style={styles.statCard}>
                <View style={[styles.iconBg, {backgroundColor: '#E8F5E9'}]}>
                    <TrendingUp size={24} color="#43A047" />
                </View>
                <Text style={styles.statValue}>₹4,500</Text>
                <Text style={styles.statLabel}>Earnings</Text>
            </View>
        </View>

        {/* Action Needed */}
        <Text style={styles.sectionTitle}>Action Needed</Text>
        <View style={styles.actionCard}>
            <View style={styles.actionRow}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.actionText}>2 Orders Pending Confirmation</Text>
            </View>
            <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Orders</Text>
            </TouchableOpacity>
        </View>

        {/* Recent Performance */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.chartPlaceholder}>
            <Text style={{color: '#999'}}>Weekly Earnings Chart Placeholder</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  kitchenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
