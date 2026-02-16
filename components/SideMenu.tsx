import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, Pressable, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  Phone, 
  MessageCircle, 
  Settings,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/services/authContext';
import { useProfileStore } from '@/store/profileStore';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { user: profile } = useProfileStore();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuItems = [
    { icon: <ShoppingBag size={24} color="#EE5D28" />, label: 'My Orders', route: '/(tabs)/orders' },
    { icon: <User size={24} color="#EE5D28" />, label: 'My Profile', route: '/(tabs)/profile' },
    { icon: <MapPin size={24} color="#EE5D28" />, label: 'Delivery Address', route: '/address' },
    { icon: <CreditCard size={24} color="#EE5D28" />, label: 'Payment Methods', route: '/profile/payment' },
    { icon: <Phone size={24} color="#EE5D28" />, label: 'Contact Us', route: '/support' },
    { icon: <MessageCircle size={24} color="#EE5D28" />, label: 'Help & FAQs', route: '/support/faq' },
    { icon: <Settings size={24} color="#EE5D28" />, label: 'Settings', route: '/settings' },
  ];

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
        router.push(route as any);
    }, 300);
  };

  const handleLogoutPress = () => {
    onClose();
    setTimeout(() => {
      router.push('/(modals)/logout');
    }, 300);
  };

  const [shouldRender, setShouldRender] = React.useState(visible);

  useEffect(() => {
    if (visible) {
        setShouldRender(true);
    } else {
        const timeout = setTimeout(() => {
            setShouldRender(false);
        }, 300);
        return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerContent}>
            <View style={styles.header}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop' }} 
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{profile?.full_name || 'John Smith'}</Text>
                    <Text style={styles.userEmail}>{authUser?.email || 'Loremipsum@email.com'}</Text>
                </View>
            </View>

            <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                    <View key={index}>
                      <TouchableOpacity 
                          style={styles.menuItem}
                          onPress={() => handleNavigation(item.route)}
                      >
                          <View style={styles.iconContainer}>
                              {item.icon}
                          </View>
                          <Text style={styles.menuLabel}>{item.label}</Text>
                      </TouchableOpacity>
                      {index < menuItems.length - 1 && <View style={styles.separator} />}
                    </View>
                ))}
            </View>

            {/* Logout Modal Trigger Section - matches the design with white box */}
            <View style={styles.logoutContainer}>
              <View style={styles.logoutModalPlaceholder}>
                <Text style={styles.logoutQuestion}>Are you sure you want to log out?</Text>
                <View style={styles.logoutButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmLogoutButton} onPress={handleLogoutPress}>
                    <Text style={styles.confirmLogoutText}>Yes, logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'transparent',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#EE5D28',
    paddingTop: 60,
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    height: '100%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  menuList: {
    paddingHorizontal: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: 60,
  },
  logoutContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  logoutModalPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
  },
  logoutQuestion: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFE8E0',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#EE5D28',
    fontWeight: '700',
    fontSize: 16,
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#EE5D28',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});
