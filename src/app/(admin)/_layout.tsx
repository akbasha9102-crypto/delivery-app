import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '@/context/ThemeContext';
import { AnimatedTabBarButton } from '@/components/animated-tab-bar-button';

export default function AdminLayout() {
  const { dark, loaded } = useDarkMode();

  const bg = dark ? '#0f172a' : '#f1f5f9';
  const tabBarBg = dark ? '#1a1a1a' : '#ffffff';
  const borderColor = dark ? '#2a2a2a' : '#e5e7eb';
  const inactiveColor = dark ? '#888888' : '#8e8e93';

  if (!loaded) return <View style={{ flex: 1, backgroundColor: bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: borderColor,
            borderTopWidth: 1,
          },
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
          sceneStyle: { backgroundColor: bg },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'اللوحة',
            tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'قائمة الطعام',
            tabBarIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="drivers"
          options={{
            title: 'السائقين',
            tabBarIcon: ({ color }) => <MaterialIcons name="local-shipping" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
