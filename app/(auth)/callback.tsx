import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { router, useLocalSearchParams } from 'expo-router';

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback event:', event);
      if (session) {
        router.replace('/(tabs)/home');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
