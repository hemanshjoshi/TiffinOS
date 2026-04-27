import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/services/authContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated';

export default function SplashScreen() {
  const { loading } = useAuth();
  
  // Animation values
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start animation
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    opacity.value = withTiming(1, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image 
          source={require('@/assets/logo.png')} 
          style={{ width: 120, height: 120, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Maakhana</Text>
        <Text style={styles.tagline}>maakhana name</Text>
      </Animated.View>
      {/* Optional: Add loading indicator to show something is happening */}
      {loading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    fontStyle: 'italic',
  },
  tagline: {
    marginTop: 10,
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
});
