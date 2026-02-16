import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';
import { usePartnerKitchen } from '@/hooks/usePartnerKitchen';
import { useAuth } from '@/services/authContext';
import { 
    ChevronRight, 
    UtensilsCrossed, 
    MessageSquare, 
    Info, 
    Users, 
    Settings, 
    Phone, 
    Clock, 
    HelpCircle, 
    DollarSign,
    FileText
} from 'lucide-react-native';

export default function PartnerHub() {
  const [kitchen, setKitchen] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const { kitchenId, loading } = usePartnerKitchen();
  const { session } = useAuth();

  useEffect(() => {
    if (kitchenId) {
        fetchKitchen();
    }
  }, [kitchenId]);

  const fetchKitchen = async () => {
    if (!kitchenId) return;
    const { data, error } = await supabase.from('kitchens').select('*').eq('id', kitchenId).single();
    if (error) console.error('Fetch kitchen error:', error);
    if (data) {
        setKitchen(data);
        setIsOnline(data.is_active);
    }
  };

  const toggleOnline = async (value: boolean) => {
    if (!kitchenId) {
        console.error("No kitchen ID found");
        return;
    }
    setIsOnline(value);
    const { error } = await supabase.from('kitchens').update({ is_active: value }).eq('id', kitchenId);
    if (error) {
        console.error('Update error:', error);
        setIsOnline(!value);
    }
  };

  const renderMenuItem = (icon: any, title: string, subtitle?: string, onPress?: () => void) => (
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
          <View style={styles.menuIcon}>{icon}</View>
          <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{title}</Text>
              {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
          <ChevronRight size={20} color="#ccc" />
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <View>
              <Text style={styles.kitchenName}>{kitchen?.kitchen_name || 'My Kitchen'}</Text>
              <Text style={styles.location}>{kitchen?.address || 'Mumbai'}</Text>
          </View>
          <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Switch 
                value={isOnline} 
                onValueChange={toggleOnline}
                trackColor={{ false: "#767577", true: Colors.success }} 
              />
          </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          {/* Debug Info - Remove later */}
          {!kitchenId && !loading && (
              <View style={{padding: 10, backgroundColor: '#ffebee'}}>
                  <Text style={{color: 'red'}}>Debug: No Kitchen Linked.</Text>
                  <Text style={{fontSize: 10}}>User ID: {session?.user?.id || 'None'}</Text>
              </View>
          )}
          
          <Text style={styles.sectionHeader}>To Orders</Text>
          <View style={styles.card}>
              {renderMenuItem(<UtensilsCrossed size={20} color="#444" />, "Inventory (Menu)", "Manage dishes & prices", () => router.push('/partner/menu'))}
              {renderMenuItem(<MessageSquare size={20} color="#444" />, "Feedback", "Customer reviews")}
          </View>

          <Text style={styles.sectionHeader}>Manage Outlet</Text>
          <View style={styles.card}>
              {renderMenuItem(<Info size={20} color="#444" />, "Outlet Info", "Name, address, photos")}
              {renderMenuItem(<Clock size={20} color="#444" />, "Outlet Timings", "Opening & closing hours")}
              {renderMenuItem(<Users size={20} color="#444" />, "Manage Staff", "Add/remove helpers")}
          </View>

          <Text style={styles.sectionHeader}>Settings</Text>
          <View style={styles.card}>
              {renderMenuItem(<Settings size={20} color="#444" />, "General Settings")}
              {renderMenuItem(<Phone size={20} color="#444" />, "Manage Communication")}
          </View>

          <Text style={styles.sectionHeader}>Help & Support</Text>
          <View style={styles.card}>
              {renderMenuItem(<HelpCircle size={20} color="#444" />, "Help Center")}
          </View>

          <Text style={styles.sectionHeader}>Accounting</Text>
          <View style={styles.card}>
              {renderMenuItem(<DollarSign size={20} color="#444" />, "Payouts", "View earnings")}
              {renderMenuItem(<FileText size={20} color="#444" />, "Invoices & Taxes")}
          </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitchenName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  switchContainer: {
      alignItems: 'center',
  },
  switchLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
      color: Colors.text,
  },
  content: {
      padding: 16,
  },
  sectionHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666',
      marginBottom: 8,
      marginTop: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
  },
  menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
      width: 32,
      alignItems: 'center',
  },
  menuText: {
      flex: 1,
  },
  menuTitle: {
      fontSize: 16,
      color: Colors.text,
  },
  menuSubtitle: {
      fontSize: 12,
      color: '#999',
      marginTop: 2,
  },
});
