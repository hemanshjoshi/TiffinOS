import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Bell, Lock, UserX } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const menuItems = [
    { icon: <Bell size={32} color="#EE5D28" />, label: 'Notification Setting', route: '/settings/notifications' },
    { icon: <Lock size={32} color="#EE5D28" />, label: 'Password Setting', route: '/settings/password' },
    { icon: <UserX size={32} color="#EE5D28" />, label: 'Delete Account', route: '/settings/delete' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <div style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>{item.icon}</View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronDown color="#EE5D28" size={24} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Tab Bar Placeholder */}
      <View style={styles.bottomTab}>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
        <TouchableOpacity><Image source={require('@/assets/icon.png')} style={styles.tabIcon} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDCB52',
  },
  yellowHeader: {
    height: 150,
    backgroundColor: '#FDCB52',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingHorizontal: 30,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
    gap: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#3E1F1F',
    marginLeft: 15,
  },
  bottomTab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#EE5D28',
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.8,
  }
});
