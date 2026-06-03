import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const STATUS = {
  pending:   { label: 'واردة',        color: '#f59e0b', bg: '#fef3c7', next: 'preparing' as const, nextLabel: 'ابدأ التجهيز',  nextColor: '#3b82f6' },
  preparing: { label: 'قيد التجهيز', color: '#3b82f6', bg: '#dbeafe', next: 'ready'     as const, nextLabel: 'جاهز للتسليم', nextColor: '#22c55e' },
  ready:     { label: 'جاهز',        color: '#22c55e', bg: '#dcfce7', next: 'completed'  as const, nextLabel: 'تم التسليم',   nextColor: '#6b7280' },
  completed: { label: 'مكتمل',       color: '#9ca3af', bg: '#f3f4f6', next: null,                  nextLabel: '',             nextColor: '#9ca3af' },
};

const TABS = [
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

export default function OrdersScreen() {
  const [tab, setTab] = useState<'pending' | 'preparing' | 'ready' | 'completed'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);

  const initialLoadDone = useRef(false);

  const fetchOrders = useCallback(async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!ordersData) { setLoading(false); return; }

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
    if (!loading) initialLoadDone.current = true;
  }, [loading]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        if (initialLoadDone.current) {
          setNewOrderFlash(true);
          setTimeout(() => setNewOrderFlash(false), 4000);
        }
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const advanceStatus = async (order: Order) => {
    const next = STATUS[order.status].next;
    if (!next) return;
    await supabase.from('orders').update({ status: next }).eq('id', order.id);
    fetchOrders();
  };

  const filtered = orders.filter(o => o.status === tab);
  const counts = { pending: 0, preparing: 0, ready: 0, completed: 0 };
  orders.forEach(o => counts[o.status]++);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>

      {/* New order flash */}
      {newOrderFlash && (
        <View style={{ backgroundColor: '#16a34a', paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>طلب جديد وصل!</Text>
        </View>
      )}

      {/* Status tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const count = counts[t.id];
          const cfg = STATUS[t.id];
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                flex: 1,
                paddingVertical: 14,
                alignItems: 'center',
                borderBottomWidth: 3,
                borderBottomColor: active ? cfg.color : 'transparent',
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 14, color: active ? cfg.color : '#94a3b8' }}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={{
                  backgroundColor: active ? cfg.color : '#e2e8f0',
                  borderRadius: 10,
                  minWidth: 22,
                  height: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                  paddingHorizontal: 6,
                }}>
                  <Text style={{ color: active ? '#fff' : '#64748b', fontSize: 12, fontWeight: 'bold' }}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#f97316" colors={['#f97316']} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: '#94a3b8', fontSize: 16 }}>لا توجد طلبات</Text>
            </View>
          ) : (
            filtered.map(order => {
              const cfg = STATUS[order.status];
              return (
                <View key={order.id} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>

                  {/* Colored top bar */}
                  <View style={{ height: 5, backgroundColor: cfg.color }} />

                  {/* Client info + price */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#22c55e' }}>
                      {order.total_amount.toLocaleString()} <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 'normal' }}>د.ع</Text>
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#0f172a' }}>{order.client_name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(order.created_at)}</Text>
                        <Text style={{ fontSize: 13, color: '#64748b' }}>{order.client_phone}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={{ marginHorizontal: 16, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    {(order.items || []).map(item => (
                      <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 }}>
                        <Text style={{ fontSize: 13, color: '#f97316', fontWeight: '600' }}>{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14, color: '#1e293b', textAlign: 'right' }}>{item.item_name}</Text>
                          <View style={{ backgroundColor: '#e2e8f0', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569' }}>{item.quantity}×</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Address & note */}
                  {(order.delivery_address || order.client_note) && (
                    <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
                      {order.delivery_address ? (
                        <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'right' }}>📍 {order.delivery_address}</Text>
                      ) : null}
                      {order.client_note ? (
                        <Text style={{ color: '#d97706', fontSize: 13, textAlign: 'right', marginTop: 4 }}>📝 {order.client_note}</Text>
                      ) : null}
                    </View>
                  )}

                  {/* Action button */}
                  {cfg.next ? (
                    <TouchableOpacity
                      onPress={() => advanceStatus(order)}
                      style={{ margin: 12, marginTop: 4, backgroundColor: cfg.nextColor, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{cfg.nextLabel}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ margin: 12, marginTop: 4, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                      <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 15 }}>✓ مكتمل</Text>
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
