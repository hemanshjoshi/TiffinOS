import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { ChevronRight, Heart, MapPin, CreditCard, Settings, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { useAuth } from '@/services/authContext';

export default function ProfileScreen() {
  const { user: profile } = useProfileStore();
  const { user: authUser } = useAuth();

  const menuItems = [
    { icon: <User size={22} color={Colors.text} />, label: 'Edit Profile', route: '/profile/edit' },
    { icon: <MapPin size={22} color={Colors.text} />, label: 'Delivery Addresses', route: '/address' },
    { icon: <CreditCard size={22} color={Colors.text} />, label: 'Payment Methods', route: '/profile/payment' },
    { icon: <Heart size={22} color={Colors.text} />, label: 'Favorites', route: '/(tabs)/favorites' },
    { icon: <Settings size={22} color={Colors.text} />, label: 'Settings', route: '/settings' },
  ];

  return (
    <Screen backgroundColor={Colors.background} safeArea={true}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || authUser?.email?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
                <Text style={styles.userPhone}>{profile?.mobile_number || 'No phone set'}</Text>
                <Text style={styles.userEmail}>{authUser?.email || 'user@example.com'}</Text>
            </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
                <TouchableOpacity 
                    key={index} 
                    style={styles.menuItem}
                    onPress={() => item.route && router.push(item.route as any)}
                >
                    <View style={styles.menuIconContainer}>{item.icon}</View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <ChevronRight color={Colors.textSecondary} size={20} />
                </TouchableOpacity>
            ))}
            
            {/* Admin Link */}
            <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/admin/dashboard')}
            >
                <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <ShieldCheck size={22} color={Colors.primary} />
                </View>
                <Text style={[styles.menuLabel, {color: Colors.primary}]}>Admin Dashboard</Text>
                <ChevronRight color={Colors.primary} size={20} />
            </TouchableOpacity>

             <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]}
                onPress={() => router.push('/(modals)/logout')}
            >
                <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <LogOut size={22} color={Colors.error} />
                </View>
                <Text style={[styles.menuLabel, {color: Colors.error}]}>Log Out</Text>
            </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 24,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
    fontSize: 12,
  },
});
