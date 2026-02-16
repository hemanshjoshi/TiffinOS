import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Pressable, Platform, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Bell, Utensils, Heart, ShoppingBag, Truck } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface NotificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ visible, onClose }: NotificationsDrawerProps) {
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

  const notifications = [
    { icon: <Utensils size={24} color="#EE5D28" />, text: 'We have added a product you might like.' },
    { icon: <Heart size={24} color="#EE5D28" />, text: 'One of your favorite is on promotion.' },
    { icon: <ShoppingBag size={24} color="#EE5D28" />, text: 'Your order has been delivered' },
    { icon: <Truck size={24} color="#EE5D28" />, text: 'The delivery is on his way' },
  ];

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
              <View style={styles.bellContainer}>
                <Bell size={32} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.list}>
                {notifications.map((item, index) => (
                    <View key={index}>
                      <View style={styles.notificationItem}>
                          <View style={styles.iconContainer}>
                              {item.icon}
                          </View>
                          <Text style={styles.notificationText}>{item.text}</Text>
                      </View>
                      <View style={styles.separator} />
                    </View>
                ))}
            </View>
        </View>
      </Animated.View>

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
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  bellContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginLeft: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  list: {
    paddingHorizontal: 30,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 30,
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
    zIndex: 1001,
  },
  tabIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    opacity: 0.8,
  }
});
