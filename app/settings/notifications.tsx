import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Switch } from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationSettingScreen() {
  const [settings, setSettings] = useState({
    general: true,
    sound: true,
    soundCall: true,
    vibrate: false,
    specialOffers: false,
    payments: false,
    promo: false,
    cashback: false,
  });

  const toggleSwitch = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch 
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#FFE8E0', true: '#EE5D28' }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
        ios_backgroundColor="#FFE8E0"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.yellowHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#EE5D28" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Setting</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.whiteCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <SettingRow label="General Notification" value={settings.general} onToggle={() => toggleSwitch('general')} />
          <SettingRow label="Sound" value={settings.sound} onToggle={() => toggleSwitch('sound')} />
          <SettingRow label="Sound Call" value={settings.soundCall} onToggle={() => toggleSwitch('soundCall')} />
          <SettingRow label="Vibrate" value={settings.vibrate} onToggle={() => toggleSwitch('vibrate')} />
          <SettingRow label="Special Offers" value={settings.specialOffers} onToggle={() => toggleSwitch('specialOffers')} />
          <SettingRow label="Payments" value={settings.payments} onToggle={() => toggleSwitch('payments')} />
          <SettingRow label="Promo and discount" value={settings.promo} onToggle={() => toggleSwitch('promo')} />
          <SettingRow label="Cashback" value={settings.cashback} onToggle={() => toggleSwitch('cashback')} />
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3E1F1F',
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
