import React, { useCallback } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

type Props = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StaggerItem({ index, children, style }: Props) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      translateY.value = 20;
      opacity.value = 0;
      const delay = index * 70;
      translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    }, [])
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[style, { animationDuration: `${300 + index * 70}ms`, animationFillMode: 'both' } as any]}>
        {children}
      </View>
    );
  }

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
