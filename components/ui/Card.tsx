import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
}: CardProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1);
  };

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return 12;
      case 'lg': return 24;
      default: return 16;
    }
  };

  const Container = onPress ? AnimatedPressable : View;

  return (
    <Container
      style={[
        styles.container,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        { padding: getPadding() },
        style,
        onPress ? animatedStyle : {},
      ]}
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: 'visible', // allow shadows
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
        shadowColor: Colors.shadow,
      },
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
