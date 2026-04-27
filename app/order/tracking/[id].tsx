import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, Phone, MessageSquare, CheckCircle, Clock } from 'lucide-react-native';
import Animated, { FadeInUp, SlideInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';

const STEPS_CONFIG = [
  { id: 1, status: 'Pending', title: 'Order Placed' },
  { id: 2, status: 'Confirmed', title: 'Order Accepted' },
  { id: 3, status: 'Preparing', title: 'Cooking in Progress' },
  { id: 4, status: 'Out for Delivery', title: 'Out for Delivery' },
  { id: 5, status: 'Delivered', title: 'Delivered' },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setOrder(data);
        updateStep(data.status);
      }
    };

    fetchOrder();

    const subscription = supabase
      .channel(`tracking-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        setOrder(payload.new);
        updateStep(payload.new.status);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const updateStep = (status: string) => {
    const step = STEPS_CONFIG.find(s => s.status === status);
    if (step) {
      setCurrentStep(step.id);
    } else if (status === 'Cancelled') {
      setCurrentStep(0);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background Placeholder */}
      <Image 
        source={{ uri: 'https://img.freepik.com/free-vector/city-map-navigation-gps-app-interface_1017-13396.jpg' }} 
        style={styles.map}
        resizeMode="cover"
      />

      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Track Order</Text>
         <View style={{ width: 40 }} />
      </View>

      <View style={styles.bottomSheet}>
         <View style={styles.handle} />
         
         <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Estimated Delivery</Text>
            <Text style={styles.timeValue}>20 - 30 Mins</Text>
         </View>

         <View style={styles.timeline}>
            {STEPS_CONFIG.map((step, index) => {
               const isActive = currentStep >= step.id;
               const isCompleted = currentStep > step.id;
               
               return (
                  <View key={step.id} style={styles.stepRow}>
                     <View style={styles.timelineLeft}>
                        <View style={[styles.dot, isActive && styles.activeDot]}>
                           {isActive && <CheckCircle size={12} color="#fff" />}
                        </View>
                        {index < STEPS_CONFIG.length - 1 && (
                           <View style={[styles.line, isCompleted && styles.activeLine]} />
                        )}
                     </View>
                     <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, isActive && styles.activeText]}>{step.title}</Text>
                        <Text style={styles.stepTime}>
                           {isActive && order?.updated_at ? new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                     </View>
                  </View>
               );
            })}
            {order?.status === 'Cancelled' && (
               <View style={styles.stepRow}>
                  <View style={styles.timelineLeft}>
                     <View style={[styles.dot, { backgroundColor: Colors.error }]}>
                        <CheckCircle size={12} color="#fff" />
                     </View>
                  </View>
                  <View style={styles.stepContent}>
                     <Text style={[styles.stepTitle, { color: Colors.error }]}>Order Cancelled</Text>
                  </View>
               </View>
            )}
         </View>

         <View style={styles.driverCard}>
            <Image 
               source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
               style={styles.driverImage}
            />
            <View style={styles.driverInfo}>
               <Text style={styles.driverName}>Ramesh Kumar</Text>
               <Text style={styles.driverRating}>★ 4.8 (Delivery Partner)</Text>
            </View>
            <View style={styles.actions}>
               <TouchableOpacity style={styles.actionBtn}>
                  <MessageSquare size={20} color={Colors.primary} />
               </TouchableOpacity>
               <TouchableOpacity style={styles.actionBtn}>
                  <Phone size={20} color={Colors.primary} />
               </TouchableOpacity>
            </View>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height * 0.6,
    position: 'absolute',
    top: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    maxHeight: height * 0.6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  timeInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  timeline: {
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    height: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    width: 24,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeDot: {
    backgroundColor: Colors.success,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  activeLine: {
    backgroundColor: Colors.success,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeText: {
    color: Colors.text,
  },
  stepTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 16,
  },
  driverImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  driverRating: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
