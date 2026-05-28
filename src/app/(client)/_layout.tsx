import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ClientLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#944a00', headerShown: false }}>
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
          tabBarIcon: ({ color }) => <MaterialIcons name="analytics" size={24} color={color} />,
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
