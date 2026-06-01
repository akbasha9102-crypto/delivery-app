import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '@/context/ThemeContext';
import { AnimatedTabBarButton } from '@/components/animated-tab-bar-button';

export default function ClientLayout() {
  const { dark } = useDarkMode();

  const tabBarBg = dark ? '#1a1a1a' : '#ffffff';
  const borderColor = dark ? '#2a2a2a' : '#e5e7eb';
  const inactiveColor = dark ? '#888888' : '#8e8e93';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#944a00',
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          borderTopWidth: 1,
        },
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'المنيو',
          tabBarIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'تتبع طلبك',
          tabBarIcon: ({ color }) => <MaterialIcons name="local-shipping" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
