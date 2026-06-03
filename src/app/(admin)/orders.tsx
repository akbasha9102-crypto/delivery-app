import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

function makeBellWavUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sr = 22050;
    const dur = 0.9;
    const n = (sr * dur) | 0;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true);
    ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const hz = t < 0.42 ? 880 : 587;
      const env = t < 0.42 ? Math.exp(-t * 4) : Math.exp(-(t - 0.42) * 4);
      v.setInt16(44 + i * 2, (Math.sin(2 * Math.PI * hz * t) * env * 0.4 * 32767) | 0, true);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  } catch { return null; }
}

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
  pending:   { label: 'واردة',         bg: 'bg-yellow-500', next: 'preparing' as const, nextLabel: 'ابدأ التجهيز' },
  preparing: { label: 'قيد التجهيز',   bg: 'bg-blue-500',   next: 'ready'    as const, nextLabel: 'جاهز للتسليم' },
  ready:     { label: 'جاهز',          bg: 'bg-green-500',  next: 'completed' as const, nextLabel: 'تم التسليم' },
  completed: { label: 'مكتمل',         bg: 'bg-gray-400',   next: null,                 nextLabel: '' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  return `منذ ${Math.floor(diff / 3600)} س`;
}

export default function LiveOrdersScreen() {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready' | 'completed'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);

  const bellRef = useRef<HTMLAudioElement | null>(null);
  const initialLoadDone = useRef(false);

  // Setup audio element and unlock on first click
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = makeBellWavUrl();
    if (!url) return;
    bellRef.current = new Audio(url);
    bellRef.current.volume = 0.8;

    const unlock = () => {
      if (!bellRef.current) return;
      // play+pause to unlock the audio element for future non-gesture calls
      bellRef.current.play().then(() => {
        bellRef.current!.pause();
        bellRef.current!.currentTime = 0;
      }).catch(() => {});
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  const tabs = [
    { id: 'pending'   as const, name: 'واردة' },
    { id: 'preparing' as const, name: 'تجهيز' },
    { id: 'ready'     as const, name: 'جاهز' },
    { id: 'completed' as const, name: 'مكتمل' },
  ];

  const fetchOrders = useCallback(async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!ordersData) { setLoading(false); return; }

    const withItems = await Promise.all(
      ordersData.map(async o => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', o.id);
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
          // Visual flash
          setNewOrderFlash(true);
          setTimeout(() => setNewOrderFlash(false), 3000);
          // Sound
          if (bellRef.current) {
            bellRef.current.currentTime = 0;
            bellRef.current.play().catch(() => {});
          }
        }
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const advanceStatus = async (order: Order) => {
    const cfg = STATUS_CONFIG[order.status];
    if (!cfg.next) return;
    await supabase.from('orders').update({ status: cfg.next }).eq('id', order.id);
    fetchOrders();
  };

  const filtered = orders.filter(o => o.status === activeTab);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-center items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <Text className="text-xl font-bold text-[#4f46e5]">الطلبات الحية</Text>
      </View>

      {/* New order flash banner */}
      {newOrderFlash && (
        <View className="bg-green-500 px-4 py-3 items-center">
          <Text className="text-white font-bold text-base">طلب جديد وصل!</Text>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row justify-center bg-white border-b border-gray-100">
        {tabs.map(tab => {
          const count = orders.filter(o => o.status === tab.id).length;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.id ? 'border-[#4f46e5]' : 'border-transparent'}`}
            >
              <Text className={`font-bold text-sm ${activeTab === tab.id ? 'text-[#4f46e5]' : 'text-gray-500'}`}>{tab.name}</Text>
              {count > 0 && (
                <View className={`w-5 h-5 rounded-full items-center justify-center mt-1 ${tab.id === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                  <Text className="text-white text-xs font-bold">{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
        >
          {filtered.length === 0 ? (
            <Text className="text-center text-gray-400 mt-20">لا توجد طلبات</Text>
          ) : (
            filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <View key={order.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
                  {/* Header */}
                  <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-2">
                    <View className={`px-3 py-1 rounded-full ${cfg.bg}`}>
                      <Text className="text-white text-xs font-bold">{cfg.label}</Text>
                    </View>
                    <Text className="text-gray-400 text-sm">{timeAgo(order.created_at)}</Text>
                  </View>

                  {/* Client info */}
                  <Text className="font-bold text-lg text-right">{order.client_name}</Text>
                  <Text className="text-gray-600 text-right mb-1">
                    {order.client_phone}{order.delivery_address ? ` — ${order.delivery_address}` : ''}
                  </Text>
                  {order.client_note && (
                    <Text className="text-orange-600 text-right text-sm mb-1">ملاحظة: {order.client_note}</Text>
                  )}

                  {/* Items */}
                  <View className="bg-gray-50 p-2 rounded-lg mb-3">
                    {(order.items || []).map(i => (
                      <Text key={i.id} className="text-right text-gray-700">{i.quantity}× {i.item_name}</Text>
                    ))}
                  </View>

                  {/* Footer */}
                  <View className="flex-row justify-between items-center">
                    {cfg.next ? (
                      <TouchableOpacity
                        className="bg-[#4f46e5] px-4 py-2 rounded-lg"
                        onPress={() => advanceStatus(order)}
                      >
                        <Text className="text-white font-bold">{cfg.nextLabel}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}
                    <Text className="font-bold text-lg text-green-600">{order.total_amount.toLocaleString()} د.ع</Text>
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
