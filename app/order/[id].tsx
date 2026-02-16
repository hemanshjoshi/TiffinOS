import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { ArrowLeft, MapPin, Clock, Phone, ChevronRight, CheckCircle2, Circle } from 'lucide-react-native';
import { Image } from 'expo-image';

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const statuses = ['Pending', 'Confirmed', 'Cooking', 'ReadyForPickup', 'OutForDelivery', 'Delivered'];

  useEffect(() => {
    const fetchOrder = async () => {
      // First try to fetch with kitchens join
      let { data, error } = await supabase
        .from('orders')
        .select('*, kitchens(*), order_items(*, menu_items(*))')
        .eq('id', id)
        .single();

      if (error || !data?.kitchens) {
        // Fallback: Check profiles table for kitchen info
        const { data: orderOnly } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(*))')
          .eq('id', id)
          .single();
        
        if (orderOnly) {
          const { data: profileKitchen } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', orderOnly.kitchen_id)
            .single();
          
          data = { 
            ...orderOnly, 
            kitchens: profileKitchen ? {
              ...profileKitchen,
              kitchen_name: profileKitchen.kitchen_name || profileKitchen.kitchenName
            } : null 
          };
        }
      }

      if (data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();

    // Set up real-time listener
    const subscription = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        console.log('Order updated:', payload.new);
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  if (loading) return null;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  const currentStatusIndex = statuses.indexOf(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Status</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Info */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Info</Text>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order ID</Text>
                <Text style={styles.infoValue}>#{order.id.slice(0, 8)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kitchen</Text>
                <Text style={styles.infoValue}>{order.kitchens?.kitchen_name || 'Unknown'}</Text>
            </View>
        </View>

        {/* Status Stepper */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Track Progress</Text>
          <View style={styles.stepperContainer}>
            {statuses.map((status, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isLast = index === statuses.length - 1;

              return (
                <View key={status} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepDot, (isCompleted || isCurrent) && styles.stepDotActive]}>
                      {isCompleted ? (
                        <CheckCircle2 size={20} color={Colors.primary} />
                      ) : (
                        <Circle size={20} color={isCurrent ? Colors.primary : '#DDD'} fill={isCurrent ? Colors.primary : 'transparent'} />
                      )}
                    </View>
                    {!isLast && <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />}
                  </View>
                  <View style={styles.stepRight}>
                    <Text style={[styles.stepText, (isCompleted || isCurrent) && styles.stepTextActive]}>
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    {isCurrent && <Text style={styles.currentStepSubtext}>Estimated: 10-15 mins</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#666" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {order.delivery_address_snapshot?.house_flat_no}, {order.delivery_address_snapshot?.building_society}, {order.delivery_address_snapshot?.street_area}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invoice Details</Text>
          {order.order_items?.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemText}>{item.quantity} x {item.menu_items?.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price_at_time * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{order.total_amount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Need help with your order?</Text>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepperContainer: {
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepLeft: {
    alignItems: 'center',
    width: 30,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  stepDotActive: {
    // handled by icon color
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD',
    marginVertical: -2,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepRight: {
    marginLeft: 16,
    flex: 1,
    paddingBottom: 20,
  },
  stepText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  currentStepSubtext: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#444',
  },
  itemPrice: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  supportButtonText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
