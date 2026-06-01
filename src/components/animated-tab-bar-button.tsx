import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function AnimatedTabBarButton(props: any) {
  const { children, onPress, style, ...rest } = props;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.82, { damping: 10, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      }}
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Animated.View style={animatedStyle}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  );
}
