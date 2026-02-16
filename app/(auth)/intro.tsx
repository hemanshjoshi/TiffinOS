import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Order Food',
    description: 'Order your favorite food from top restaurants and enjoy the meal.',
    image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Placeholder
  },
  {
    id: '2',
    title: 'Easy Payment',
    description: 'Payment made easy through multiple payment gateways.',
    image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Placeholder
  },
  {
    id: '3',
    title: 'Fast Delivery',
    description: 'Get your food delivered at your doorstep in the shortest time.',
    image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // Placeholder
  },
];

export default function IntroScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
         <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={Colors.background}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Button 
          title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext}
          size="lg"
          style={styles.button}
        />
        
        {currentIndex < SLIDES.length - 1 && (
            <Button 
                title="Skip"
                variant="ghost"
                onPress={() => router.replace('/(auth)/welcome')}
                style={{marginTop: 8}}
            />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    height: height * 0.7, // Occupy top 70%
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 24,
  },
  footer: {
    height: height * 0.3,
    padding: 24,
    justifyContent: 'flex-start',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  button: {
    width: '100%',
  },
});
