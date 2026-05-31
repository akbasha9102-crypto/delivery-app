import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type OrderItem = { id: string; item_name: string; quantity: number; price: number };
type Order = {
  id: string;
  client_name: string;
  client_phone: string;
  delivery_address: string | null;
  client_note: string | null;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
  items?: OrderItem[];
};

const STATUS_CONFIG = {
  pending:   { label: 'جديد',        bg: 'bg-yellow-500', next: 'preparing', nextLabel: 'ابدأ التجهيز' },
  preparing: { label: 'قيد التجهيز', bg: 'bg-blue-500',   next: 'ready',    nextLabel: 'جاهز للتسليم' },
  ready:     { label: 'جاهز',        bg: 'bg-green-500',  next: 'completed', nextLabel: 'تم التسليم' },
  completed: { label: 'مكتمل',       bg: 'bg-gray-400',   next: null,        nextLabel: '' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  return `منذ ${Math.floor(diff / 3600)} س`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');

  const fetchOrders = useCallback(async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!ordersData) { setLoading(false); return; }

    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        return { ...order, items: items || [] };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
    );
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const pending   = orders.filter((o) => o.status === 'pending').length;
  const preparing = orders.filter((o) => o.status === 'preparing').length;
  const ready     = orders.filter((o) => o.status === 'ready').length;
  const todayTotal = orders
    .filter((o) => o.status === 'completed' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 bg-gray-900 border-b border-gray-800">
        <TouchableOpacity onPress={handleLogout} className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30">
          <Text className="text-red-400 font-bold text-sm">خروج</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-xl font-bold">🍽️ لوحة الكاشير</Text>
          <Text className="text-gray-400 text-xs mt-0.5">تحديث كل 15 ثانية</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(admin)/menu')} className="bg-orange-500/20 px-4 py-2 rounded-xl border border-orange-500/30">
          <Text className="text-orange-400 font-bold text-sm">المنيو</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 py-4 gap-3">
        <View className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 items-center">
          <Text className="text-yellow-400 text-2xl font-bold">{pending}</Text>
          <Text className="text-yellow-300/70 text-xs mt-1">طلبات جديدة</Text>
        </View>
        <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 items-center">
          <Text className="text-blue-400 text-2xl font-bold">{preparing}</Text>
          <Text className="text-blue-300/70 text-xs mt-1">قيد التجهيز</Text>
        </View>
        <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl p-3 items-center">
          <Text className="text-green-400 text-2xl font-bold">{ready}</Text>
          <Text className="text-green-300/70 text-xs mt-1">جاهزة</Text>
        </View>
        <View className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 items-center">
          <Text className="text-orange-400 text-lg font-bold">{todayTotal.toLocaleString()}</Text>
          <Text className="text-orange-300/70 text-xs mt-1">إيراد اليوم</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" style={{ flexGrow: 0 }}>
        {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            className={`mr-2 px-4 py-2 rounded-full border ${filter === tab ? 'bg-orange-500 border-orange-500' : 'bg-gray-800 border-gray-700'}`}
          >
            <Text className={`text-sm font-bold ${filter === tab ? 'text-white' : 'text-gray-400'}`}>
              {tab === 'all' ? 'الكل' : STATUS_CONFIG[tab].label}
              {tab !== 'all' && tab !== 'completed' && orders.filter((o) => o.status === tab).length > 0
                ? ` (${orders.filter((o) => o.status === tab).length})`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-400 mt-3">جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#f97316" />}
        >
          {filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-5xl mb-4">📋</Text>
              <Text className="text-gray-400 text-lg">لا توجد طلبات</Text>
            </View>
          ) : (
            filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <View key={order.id} className="bg-gray-800 rounded-2xl mb-4 overflow-hidden border border-gray-700">
                  {/* Order Header */}
                  <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-700">
                    <View className="flex-row items-center gap-2">
                      <View className={`px-3 py-1 rounded-full ${cfg.bg}`}>
                        <Text className="text-white text-xs font-bold">{cfg.label}</Text>
                      </View>
                      <Text className="text-gray-400 text-xs">{timeAgo(order.created_at)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white font-bold">{order.client_name}</Text>
                      <Text className="text-gray-400 text-xs">{order.client_phone}</Text>
                    </View>
                  </View>

                  {/* Order Items */}
                  <View className="px-4 py-3">
                    {order.items?.map((item) => (
                      <View key={item.id} className="flex-row justify-between items-center py-1.5 border-b border-gray-700/50">
                        <Text className="text-orange-400 font-bold">{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-white text-right">{item.item_name}</Text>
                          <View className="bg-gray-700 w-7 h-7 rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">{item.quantity}×</Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {order.delivery_address ? (
                      <Text className="text-gray-400 text-xs text-right mt-2">📍 {order.delivery_address}</Text>
                    ) : null}
                    {order.client_note ? (
                      <Text className="text-yellow-400/80 text-xs text-right mt-1">📝 {order.client_note}</Text>
                    ) : null}
                  </View>

                  {/* Order Footer */}
                  <View className="flex-row justify-between items-center px-4 py-3 bg-gray-900/50">
                    <View>
                      {cfg.next ? (
                        <TouchableOpacity
                          onPress={() => updateStatus(order.id, cfg.next!)}
                          className="bg-orange-500 px-5 py-2.5 rounded-xl"
                        >
                          <Text className="text-white font-bold text-sm">{cfg.nextLabel}</Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="bg-gray-700 px-5 py-2.5 rounded-xl">
                          <Text className="text-gray-400 font-bold text-sm">✓ مكتمل</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-white text-lg font-bold">{order.total_amount.toLocaleString()} <Text className="text-gray-400 text-sm">د.ع</Text></Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
