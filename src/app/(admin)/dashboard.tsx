import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, View, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../context/ThemeContext';

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
  pending:   { label: 'واردة',        color: '#f59e0b', next: 'preparing' as const, nextLabel: 'ابدأ التجهيز',  nextColor: '#3b82f6' },
  preparing: { label: 'قيد التجهيز', color: '#3b82f6', next: 'ready'     as const, nextLabel: 'جاهز للتسليم', nextColor: '#22c55e' },
  ready:     { label: 'جاهز',        color: '#22c55e', next: 'completed'  as const, nextLabel: 'تم التسليم',   nextColor: '#6b7280' },
  completed: { label: 'مكتمل',       color: '#9ca3af', next: null,                  nextLabel: '',             nextColor: '#9ca3af' },
};

const FILTERS = [
  { id: 'all'       as const, label: 'الكل' },
  { id: 'pending'   as const, label: 'واردة' },
  { id: 'preparing' as const, label: 'تجهيز' },
  { id: 'ready'     as const, label: 'جاهز' },
  { id: 'completed' as const, label: 'مكتمل' },
];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} ث`;
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  return `${Math.floor(diff / 3600)} س`;
}

export default function DashboardScreen() {
  const { dark, toggleDark } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');

  const bg      = dark ? '#0f172a' : '#f8fafc';
  const surface = dark ? '#1e293b' : '#ffffff';
  const border  = dark ? '#334155' : '#e2e8f0';
  const text    = dark ? '#f1f5f9' : '#0f172a';
  const sub     = dark ? '#94a3b8' : '#64748b';
  const muted   = dark ? '#475569' : '#e2e8f0';

  const fetchOrders = useCallback(async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!ordersData) { setLoading(false); setRefreshing(false); return; }

    const withItems = await Promise.all(
      ordersData.map(async o => {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);
        return { ...o, items: items || [] };
      })
    );
    setOrders(withItems);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const counts = { pending: 0, preparing: 0, ready: 0, completed: 0 };
  orders.forEach(o => counts[o.status]++);
  const todayTotal = orders
    .filter(o => o.status === 'completed' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total_amount, 0);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surface, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14 }}>خروج</Text>
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 17, fontWeight: 'bold' }}>الإحصاء</Text>
        <Pressable onPress={toggleDark} style={{ backgroundColor: muted, borderRadius: 20, padding: 8 }}>
          <Text style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', padding: 14, gap: 10 }}>
        {[
          { value: counts.pending,   label: 'واردة',    color: '#f59e0b', bg: dark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)' },
          { value: counts.preparing, label: 'تجهيز',    color: '#3b82f6', bg: dark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)' },
          { value: counts.ready,     label: 'جاهزة',    color: '#22c55e', bg: dark ? 'rgba(34,197,94,0.12)'  : 'rgba(34,197,94,0.08)'  },
          { value: todayTotal,       label: 'إيراد اليوم', color: '#f97316', bg: dark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)', small: true },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: `${s.color}30` }}>
            <Text style={{ color: s.color, fontSize: s.small ? 14 : 24, fontWeight: 'bold' }}>
              {s.small ? s.value.toLocaleString() : s.value}
            </Text>
            <Text style={{ color: s.color, fontSize: 11, marginTop: 3, opacity: 0.8 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingHorizontal: 14, marginBottom: 12 }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          const count = f.id !== 'all' ? counts[f.id] : null;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.7}
              style={{
                marginRight: 8,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 22,
                backgroundColor: active ? '#f97316' : surface,
                borderWidth: 1,
                borderColor: active ? '#f97316' : border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: active ? '#fff' : sub }}>
                {f.label}
              </Text>
              {count !== null && count > 0 && (
                <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.3)' : muted, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                  <Text style={{ color: active ? '#fff' : sub, fontSize: 11, fontWeight: 'bold' }}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Orders list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#f97316" colors={['#f97316']} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: sub, fontSize: 16 }}>لا توجد طلبات</Text>
            </View>
          ) : (
            filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <View key={order.id} style={{ backgroundColor: surface, borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: border }}>

                  {/* Colored top bar */}
                  <View style={{ height: 5, backgroundColor: cfg.color }} />

                  {/* Client + price */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ alignItems: 'flex-start' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cfg.color }} />
                        <Text style={{ color: cfg.color, fontWeight: 'bold', fontSize: 13 }}>{cfg.label}</Text>
                        <Text style={{ color: sub, fontSize: 12 }}>{timeAgo(order.created_at)}</Text>
                      </View>
                      <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 17, marginTop: 4 }}>
                        {order.total_amount.toLocaleString()} <Text style={{ fontSize: 12, color: sub, fontWeight: 'normal' }}>د.ع</Text>
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: text, fontWeight: 'bold', fontSize: 16 }}>{order.client_name}</Text>
                      <Text style={{ color: sub, fontSize: 13, marginTop: 2 }}>{order.client_phone}</Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                    {order.items?.map(item => (
                      <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: muted }}>
                        <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 13 }}>{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ color: text, fontSize: 14 }}>{item.item_name}</Text>
                          <View style={{ backgroundColor: muted, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: sub, fontSize: 12, fontWeight: 'bold' }}>{item.quantity}×</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                    {order.delivery_address ? (
                      <Text style={{ color: sub, fontSize: 12, textAlign: 'right', marginTop: 8 }}>📍 {order.delivery_address}</Text>
                    ) : null}
                    {order.client_note ? (
                      <Text style={{ color: '#d97706', fontSize: 12, textAlign: 'right', marginTop: 4 }}>📝 {order.client_note}</Text>
                    ) : null}
                  </View>

                  {/* Action button */}
                  {cfg.next ? (
                    <TouchableOpacity
                      onPress={() => updateStatus(order.id, cfg.next!)}
                      activeOpacity={0.8}
                      style={{ margin: 12, marginTop: 4, backgroundColor: cfg.nextColor, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{cfg.nextLabel}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ margin: 12, marginTop: 4, backgroundColor: muted, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                      <Text style={{ color: sub, fontWeight: 'bold', fontSize: 14 }}>✓ مكتمل</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
