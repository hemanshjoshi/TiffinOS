import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ClipboardList, Grid } from 'lucide-react-native';

export default function PartnerLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
        }
    }}>
      <Tabs.Screen 
        name="orders" 
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="hub" 
        options={{
          title: 'Hub',
          tabBarIcon: ({ color }) => <Grid size={24} color={color} />,
        }} 
      />
      {/* Hide other screens from tab bar but keep them in route */}
      <Tabs.Screen 
        name="menu" 
        options={{
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="dashboard" 
        options={{
          href: null,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          href: null,
        }} 
      />
    </Tabs>
  );
}
