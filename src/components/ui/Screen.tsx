import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  safeArea?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  backgroundColor?: string;
  lightBar?: boolean;
}

export const Screen = ({ 
  children, 
  safeArea = true, 
  edges = ['top', 'left', 'right'],
  backgroundColor = Colors.background,
  lightBar = false,
  style,
  ...props
}: ScreenProps) => {
  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container 
      style={[styles.container, { backgroundColor }, style]} 
      edges={safeArea ? edges : undefined}
      {...props}
    >
      <StatusBar style={lightBar ? 'light' : 'dark'} />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
