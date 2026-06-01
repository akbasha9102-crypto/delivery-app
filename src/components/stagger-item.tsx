import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import ReAnimated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

type Props = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Web version — opacity stays 1, only translateY animates on mount
function StaggerItemWeb({ index, children, style }: Props) {
  const slideAnim = useRef(new Animated.Value(22)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 70;
    const anim = Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Native version — uses Reanimated, replays on every focus
function StaggerItemNative({ index, children, style }: Props) {
  const translateY = useSharedValue(22);
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      translateY.value = 22;
      opacity.value = 0;
      const delay = index * 70;
      translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ReAnimated.View style={[animatedStyle, style]}>
      {children}
    </ReAnimated.View>
  );
}

export function StaggerItem(props: Props) {
  if (Platform.OS === 'web') return <StaggerItemWeb {...props} />;
  return <StaggerItemNative {...props} />;
}
