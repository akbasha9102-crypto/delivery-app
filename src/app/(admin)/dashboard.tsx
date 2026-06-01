import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, View, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../context/ThemeContext';
import { AnimatedButton } from '../../components/animated-button';
import { StaggerItem } from '../../components/stagger-item';

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
  pending:   { label: 'جديد',        next: 'preparing', nextLabel: 'ابدأ التجهيز',  dotColor: '#eab308' },
  preparing: { label: 'قيد التجهيز', next: 'ready',    nextLabel: 'جاهز للتسليم', dotColor: '#3b82f6' },
  ready:     { label: 'جاهز',        next: 'completed', nextLabel: 'تم التسليم',    dotColor: '#22c55e' },
  completed: { label: 'مكتمل',       next: null,        nextLabel: '',              dotColor: '#9ca3af' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  return `منذ ${Math.floor(diff / 3600)} س`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { dark, toggleDark } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');

  const c = {
    bg: dark ? '#0f172a' : '#f1f5f9',
    header: dark ? '#1e293b' : '#ffffff',
    headerBorder: dark ? '#334155' : '#e2e8f0',
    card: dark ? '#1e293b' : '#ffffff',
    cardBorder: dark ? '#334155' : '#e2e8f0',
    cardFooter: dark ? 'rgba(15,23,42,0.5)' : 'rgba(241,245,249,0.8)',
    itemBorder: dark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
    text: dark ? '#f1f5f9' : '#111827',
    subtext: dark ? '#94a3b8' : '#6b7280',
    tabActive: dark ? '#f97316' : '#f97316',
    tabInactive: dark ? '#1e293b' : '#ffffff',
    tabInactiveBorder: dark ? '#334155' : '#e2e8f0',
    tabInactiveText: dark ? '#94a3b8' : '#6b7280',
    statCard1: dark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
    statCard2: dark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
    statCard3: dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
    statCard4: dark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.08)',
  };

  const fetchOrders = useCallback(async () => {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !ordersData) { setLoading(false); setRefreshing(false); return; }

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
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.header, borderBottomWidth: 1, borderBottomColor: c.headerBorder }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={toggleDark}
            style={({ pressed }) => ({
              backgroundColor: dark ? '#334155' : '#f1f5f9',
              borderRadius: 20, padding: 8,
              transform: [{ scale: pressed ? 0.88 : 1 }],
            })}
          >
            <Text style={{ fontSize: 16 }}>{dark ? '☀️' : '🌙'}</Text>
          </Pressable>
          <AnimatedButton
            onPress={handleLogout}
            style={{ backgroundColor: dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13 }}>خروج</Text>
          </AnimatedButton>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: 'bold' }}>🍽️ لوحة الكاشير</Text>
          <Text style={{ color: c.subtext, fontSize: 11, marginTop: 2 }}>تحديث فوري</Text>
        </View>
        <AnimatedButton
          onPress={() => router.push('/(admin)/menu')}
          style={{ backgroundColor: dark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)' }}
        >
          <Text style={{ color: '#f97316', fontWeight: 'bold', fontSize: 13 }}>المنيو</Text>
        </AnimatedButton>
      </View>

      {/* Stats */}
      <StaggerItem index={0}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: c.statCard1, borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)', borderRadius: 16, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: '#eab308', fontSize: 22, fontWeight: 'bold' }}>{pending}</Text>
            <Text style={{ color: dark ? 'rgba(234,179,8,0.7)' : '#a16207', fontSize: 10, marginTop: 2, textAlign: 'center' }}>جديدة</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.statCard2, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', borderRadius: 16, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: '#3b82f6', fontSize: 22, fontWeight: 'bold' }}>{preparing}</Text>
            <Text style={{ color: dark ? 'rgba(59,130,246,0.7)' : '#1d4ed8', fontSize: 10, marginTop: 2, textAlign: 'center' }}>تجهيز</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.statCard3, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 16, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: '#22c55e', fontSize: 22, fontWeight: 'bold' }}>{ready}</Text>
            <Text style={{ color: dark ? 'rgba(34,197,94,0.7)' : '#15803d', fontSize: 10, marginTop: 2, textAlign: 'center' }}>جاهزة</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: c.statCard4, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)', borderRadius: 16, padding: 10, alignItems: 'center' }}>
            <Text style={{ color: '#f97316', fontSize: 15, fontWeight: 'bold' }}>{todayTotal.toLocaleString()}</Text>
            <Text style={{ color: dark ? 'rgba(249,115,22,0.7)' : '#c2410c', fontSize: 10, marginTop: 2, textAlign: 'center' }}>إيراد اليوم</Text>
          </View>
        </View>
      </StaggerItem>

      {/* Filter Tabs */}
      <StaggerItem index={1}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 10, flexGrow: 0 }}>
        {(['all', 'pending', 'preparing', 'ready', 'completed'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <AnimatedButton
              key={tab}
              onPress={() => setFilter(tab)}
              style={{
                marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: active ? '#f97316' : c.tabInactive,
                borderWidth: 1, borderColor: active ? '#f97316' : c.tabInactiveBorder,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: active ? '#ffffff' : c.tabInactiveText }}>
                {tab === 'all' ? 'الكل' : STATUS_CONFIG[tab].label}
                {tab !== 'all' && tab !== 'completed' && orders.filter((o) => o.status === tab).length > 0
                  ? ` (${orders.filter((o) => o.status === tab).length})`
                  : ''}
              </Text>
            </AnimatedButton>
          );
        })}
      </ScrollView>
      </StaggerItem>

      {/* Orders */}
      <StaggerItem index={2} style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={{ color: c.subtext, marginTop: 12 }}>جاري تحميل الطلبات...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
              <Text style={{ color: c.subtext, fontSize: 16 }}>لا توجد طلبات</Text>
            </View>
          ) : (
            filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <View key={order.id} style={{ backgroundColor: c.card, borderRadius: 18, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: c.cardBorder }}>
                  {/* Status bar */}
                  <View style={{ height: 4, backgroundColor: cfg.dotColor }} />

                  {/* Order Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.itemBorder }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cfg.dotColor }} />
                      <Text style={{ color: cfg.dotColor, fontWeight: 'bold', fontSize: 13 }}>{cfg.label}</Text>
                      <Text style={{ color: c.subtext, fontSize: 11 }}>{timeAgo(order.created_at)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 15 }}>{order.client_name}</Text>
                      <Text style={{ color: c.subtext, fontSize: 12 }}>{order.client_phone}</Text>
                    </View>
                  </View>

                  {/* Order Items */}
                  <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                    {order.items?.map((item) => (
                      <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.itemBorder }}>
                        <Text style={{ color: '#f97316', fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ color: c.text, textAlign: 'right' }}>{item.item_name}</Text>
                          <View style={{ backgroundColor: dark ? '#334155' : '#f1f5f9', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: c.text, fontSize: 12, fontWeight: 'bold' }}>{item.quantity}×</Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {order.delivery_address ? (
                      <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'right', marginTop: 8 }}>📍 {order.delivery_address}</Text>
                    ) : null}
                    {order.client_note ? (
                      <Text style={{ color: '#fbbf24', fontSize: 12, textAlign: 'right', marginTop: 4 }}>📝 {order.client_note}</Text>
                    ) : null}
                  </View>

                  {/* Order Footer */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.cardFooter, borderTopWidth: 1, borderTopColor: c.itemBorder }}>
                    <View>
                      {cfg.next ? (
                        <AnimatedButton
                          onPress={() => updateStatus(order.id, cfg.next!)}
                          style={{ backgroundColor: '#f97316', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
                        >
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{cfg.nextLabel}</Text>
                        </AnimatedButton>
                      ) : (
                        <View style={{ backgroundColor: dark ? '#334155' : '#f1f5f9', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}>
                          <Text style={{ color: c.subtext, fontWeight: 'bold', fontSize: 13 }}>✓ مكتمل</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: c.text, fontSize: 17, fontWeight: 'bold' }}>
                      {order.total_amount.toLocaleString()} <Text style={{ color: c.subtext, fontSize: 12 }}>د.ع</Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      </StaggerItem>
    </SafeAreaView>
  );
}
