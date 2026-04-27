import { Tabs } from 'expo-router';
import { Home, Receipt, User, ShoppingBag, Heart, ClipboardList, Headset, UtensilsCrossed } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '@/store/cartStore';

export default function TabLayout() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: '#E65100', // Deep Orange
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarShowLabel: false, // Screenshot seems to have no labels or very small ones. Let's hide them for cleaner look like screenshot
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={28} />,
        }}
      />
      
      {/* Changing Cart to Food Icon/Cloche as per screenshot */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, size }) => (
            <View>
              <UtensilsCrossed color={color} size={28} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={28} />,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={28} />,
        }}
      />

      {/* Profile or Support? Screenshot has Headset (Support) as last icon */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => <Headset color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#E65100',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
