import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, Pressable } from 'react-native';
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
  X
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75; // Approx width from screenshot

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-width)).current;
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
          toValue: -width,
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
    { icon: ShoppingBag, label: 'My Orders', route: '/(tabs)/orders' },
    { icon: User, label: 'My Profile', route: '/(tabs)/profile' },
    { icon: MapPin, label: 'Delivery Address', route: '/address' },
    { icon: CreditCard, label: 'Payment Methods', route: '/profile/payment' },
    { icon: Phone, label: 'Contact Us', route: '/support' },
    { icon: MessageCircle, label: 'Help & FAQs', route: '/support/faq' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  const handleNavigation = (route: string) => {
    onClose();
    // Small delay to allow drawer to close
    setTimeout(() => {
        router.push(route);
    }, 300);
  };

  const handleLogout = () => {
    onClose();
    router.replace('/(auth)/login');
  };

  const [shouldRender, setShouldRender] = React.useState(visible);

  useEffect(() => {
    if (visible) {
        setShouldRender(true);
    } else {
        const timeout = setTimeout(() => {
            setShouldRender(false);
        }, 300); // Match animation duration
        return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerContent}>
            
            {/* Header */}
            <View style={styles.header}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop' }} 
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>John Smith</Text>
                    <Text style={styles.userEmail}>Loremipsum@email.com</Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.menuItem}
                        onPress={() => handleNavigation(item.route)}
                    >
                        <View style={styles.iconContainer}>
                            <item.icon size={20} color="#E65100" />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <View style={styles.logoutIconContainer}>
                    <LogOut size={20} color="#fff" />
                </View>
                <Text style={styles.logoutLabel}>Log Out</Text>
            </TouchableOpacity>

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
    justifyContent: 'center', // Centers the orange panel vertically if needed, but here we want full height with shape
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#E65100', // Deep Orange
    paddingTop: 60,
    paddingHorizontal: 30,
    borderTopRightRadius: 60, // The curved shape top-right
    borderBottomRightRadius: 60, // The curved shape bottom-right (optional, but looks consistent)
    height: '100%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingLeft: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    height: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 120,
    backgroundColor: '#FF7D47', // Slightly lighter orange for button background
    padding: 10,
    borderRadius: 30,
    paddingRight: 24,
    alignSelf: 'flex-start',
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E65100', // Deep orange circle
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
