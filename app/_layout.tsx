import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/services/authContext';
import { useOnboardingStore } from '@/store/onboardingStore';
import * as Location from 'expo-location';
import { useAddressStore } from '@/store/addressStore';
import { supabase } from '@/services/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

// 1. COMPLETELY BYPASS SPLASH SCREEN PREVENT ON WEB
// This is the most common cause of hangs on localhost:8081
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function RootLayoutContent() {
  const { session, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();
  const { setCurrentLocation, setIsServiceable } = useAddressStore();
  
  // 2. FONT LOADING WITH ERROR HANDLING
  const [fontsLoaded, fontError] = useFonts({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);

        // Check serviceability via Supabase RPC
        const { data: serviceable, error } = await supabase.rpc('is_location_serviceable', {
          user_lat: coords.latitude,
          user_lng: coords.longitude
        });

        if (!error) {
          setIsServiceable(!!serviceable);
        }
      } catch (e) {
        console.error('Failed to get location', e);
      }
    };

    if (isReady) {
      initLocation();
    }
  }, [isReady]);

  useEffect(() => {
    // Force ready if fonts load, error out, or we're on web
    if (fontsLoaded || fontError || Platform.OS === 'web') {
      setIsReady(true);
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [fontsLoaded, fontError]);

  // 3. NAVIGATION LOGIC
  useEffect(() => {
    // Don't do anything until basic app structure is ready
    if (!isReady) return;
    
    // On web, we might want to proceed even if auth is "loading" to prevent white screens
    // but for initial redirect, we wait a bit. AuthProvider now has a 5s safety timeout.
    if (authLoading) return;

    const currentSegments = segments as string[];
    const inAuthGroup = currentSegments[0] === '(auth)';
    const onboardingScreens = ['biometric', 'permissions'];
    const currentSubSegment = currentSegments.length > 1 ? currentSegments[1] : '';
    const isOnboarding = inAuthGroup && onboardingScreens.includes(currentSubSegment);

    if (!session) {
      if (!inAuthGroup || isOnboarding) {
        router.replace('/(auth)/welcome');
      }
    } else {
      if (inAuthGroup) {
        if (isOnboarding) {
          if (hasCompletedOnboarding) {
            router.replace('/(tabs)/home');
          }
        } else {
          if (hasCompletedOnboarding) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/(auth)/biometric');
          }
        }
      }
    }
  }, [session, authLoading, isReady, segments, hasCompletedOnboarding]);

  // 4. BULLETPROOF RENDER
  // We always render the Stack as soon as isReady is true.
  // We don't block the entire Stack on authLoading anymore.
  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="kitchen/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="cart/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="search/filters" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(modals)/logout" options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }} />
        <Stack.Screen name="order/success" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
