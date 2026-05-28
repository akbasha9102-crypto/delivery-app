import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4f46e5', headerShown: false }}>
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
          title: 'إدارة المنيو',
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
  );
}
