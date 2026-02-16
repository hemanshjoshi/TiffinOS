import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/services/authContext';
import { Button } from '@/components/ui/Button';

export default function OrdersScreen() {
  const { user: authUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');

  useFocusEffect(
    useCallback(() => {
      const fetchOrders = async () => {
        if (!authUser) return;
        setLoading(true);
        
        // Fetch orders with related data
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            kitchens (kitchen_name, maa_name),
            order_items (
              quantity,
              menu_items (
                name,
                image_url,
                master_menu_items (
                  name,
                  default_image_url
                )
              )
            )
          `)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setOrders(data);
        }
        setLoading(false);
      };
      fetchOrders();
    }, [authUser])
  );

  // Filter orders based on status
  // Active: Pending, Confirmed, Preparing, Out for Delivery
  // Completed: Delivered
  // Cancelled: Cancelled
  const getOrdersByTab = () => {
    return orders.filter(order => {
      const status = order.status;
      if (activeTab === 'Active') {
        return ['Pending', 'Confirmed', 'Cooking', 'ReadyForPickup', 'OutForDelivery'].includes(status);
      } else if (activeTab === 'Completed') {
        return status === 'Delivered';
      } else {
        return status === 'Cancelled';
      }
    });
  };

  const displayOrders = getOrdersByTab();

  const renderOrderItem = ({ item }: { item: any }) => {
    // Get the first item to display image and name
    const firstItem = item.order_items?.[0];
    const menuItem = firstItem?.menu_items;
    const masterItem = menuItem?.master_menu_items;
    
    const name = menuItem?.name || masterItem?.name || 'Unknown Item';
    const imageUrl = menuItem?.image_url || masterItem?.default_image_url || 'https://via.placeholder.com/100';

    const itemCount = item.order_items?.length || 0;
    
    // Format date: "29 Nov, 01:20 pm"
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    const formattedDate = `${dateStr}, ${timeStr}`;

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardContent}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.foodImage}
          />
          <View style={styles.detailsContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.foodName} numberOfLines={1}>{name}</Text>
              <Text style={styles.price}>${item.total_amount}</Text>
            </View>
            
            <Text style={styles.dateText}>{formattedDate}</Text>
            
            <View style={styles.itemsRow}>
              <Text style={styles.itemsCount}>{itemCount} items</Text>
            </View>

            <View style={styles.actionButtons}>
              {['Delivered', 'Cancelled'].includes(item.status) ? (
                <TouchableOpacity 
                  style={[styles.trackButton, { flex: 1, backgroundColor: Colors.primary }]}
                  onPress={() => router.push(`/order/${item.id}`)}
                >
                  <Text style={[styles.trackButtonText, { color: '#FFF' }]}>Details</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => router.push({ pathname: '/order/cancel-reason', params: { orderId: item.id } })}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.trackButton}
                    onPress={() => router.push(`/order/tracking/${item.id}`)}
                  >
                    <Text style={styles.trackButtonText}>Track Driver</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <FileText size={120} color="#FFCCBC" strokeWidth={1} />
        {/* Placeholder for the specific icon in design which looks like a document with arrows */}
      </View>
      <Text style={styles.emptyTitle}>
        You don't have any {activeTab.toLowerCase()} orders at this time
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFC529" />
      
      {/* Header Section with Yellow Background */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 24 }} /> 
        </View>
      </SafeAreaView>

      {/* Main Content with White Background and Rounded Top Corners */}
      <View style={styles.contentContainer}>
        <View style={styles.tabsContainer}>
          {(['Active', 'Completed', 'Cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab ? styles.activeTab : styles.inactiveTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab ? styles.activeTabText : styles.inactiveTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {displayOrders.length > 0 ? (
          <FlatList
            data={displayOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          !loading && <EmptyState />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC529', // Match header background
  },
  headerSafeArea: {
    backgroundColor: '#FFC529',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Light gray background for content area
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF5722', // Deep Orange
  },
  inactiveTab: {
    backgroundColor: '#FFCCBC', // Light Orange
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  inactiveTabText: {
    color: '#FF5722',
  },
  listContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
  },
  foodImage: {
    width: 80,
    height: 100, // Taller aspect ratio as per design
    borderRadius: 15,
    backgroundColor: '#eee',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  itemsRow: {
    marginBottom: 15,
  },
  itemsCount: {
    fontSize: 12,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  trackButton: {
    backgroundColor: '#FFCCBC',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    marginBottom: 30,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5722',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
