import { View } from "react-native";
import { useEffect } from "react";
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  withSequence 
} from "react-native-reanimated";

export default function SkeletonCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 120,
          borderRadius: 16,
          backgroundColor: "#EAEAEA",
          marginBottom: 16
        },
        animatedStyle
      ]}
    />
  );
}
