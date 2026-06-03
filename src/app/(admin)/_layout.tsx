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
          tabBarActiveTintColor: '#f97316',
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
          sceneStyle: { backgroundColor: bg },
        }}
      >
        <Tabs.Screen
          name="orders"
          options={{
            title: 'الطلبات',
            tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'الإحصاء',
            tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'المنيو',
            tabBarIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appearance"
          options={{
            title: 'المظهر',
            tabBarIcon: ({ color }) => <MaterialIcons name="palette" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
