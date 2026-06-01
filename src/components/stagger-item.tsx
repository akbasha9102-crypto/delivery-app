import React, { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

type Props = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StaggerItem({ index, children, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 24;
      const delay = index * 70;
      opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
