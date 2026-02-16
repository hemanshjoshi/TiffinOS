import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Gift, Percent } from 'lucide-react-native';
import NotificationsEmpty from './empty';

// Toggle this to test empty state
const NOTIFICATIONS: any[] = [
  // { id: '1', title: 'Order Delivered', message: 'Your order from Punjabi Dhaba has been delivered.', type: 'order', time: '2 hrs ago' },
  // { id: '2', title: '50% OFF', message: 'Get 50% off on your next order using code WELCOME50.', type: 'promo', time: '1 day ago' },
  // { id: '3', title: 'New Arrival', message: 'Try the new Pizza range from Domino\'s.', type: 'info', time: '2 days ago' },
];

export default function NotificationsScreen() {
  if (NOTIFICATIONS.length === 0) {
    return (
        <Screen backgroundColor={Colors.background} safeArea={true}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>
            <NotificationsEmpty />
        </Screen>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    let Icon = Bell;
    let color = Colors.primary;
    if (item.type === 'promo') { Icon = Percent; color = Colors.success; }
    if (item.type === 'order') { Icon = Gift; color = Colors.secondary; }

    return (
      <TouchableOpacity style={styles.item}>
         <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
         </View>
         <View style={styles.textContainer}>
            <View style={styles.topRow}>
               <Text style={styles.title}>{item.title}</Text>
               <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.message}>{item.message}</Text>
         </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={NOTIFICATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  list: {
    padding: 24,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
