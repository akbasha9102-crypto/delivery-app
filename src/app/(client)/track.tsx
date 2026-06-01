import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TextInput, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  'https://gbmwrvnmvobvieembxmf.supabase.co',
  'sb_publishable_DB8lKUjdnAah-jNbpFV22w_7Id2Eggr'
);

const ORDER_ID_KEY = 'lastOrderId';
const PHONE_KEY = 'deliveryPhone';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

type Order = {
  id: string;
  client_name: string;
  client_phone: string;
  delivery_address: string | null;
  client_note: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
};

const STEPS: { key: OrderStatus; label: string; icon: string; desc: string }[] = [
  { key: 'pending',   label: 'استلام الطلب',  icon: '📋', desc: 'وصل طلبك وسيتم مراجعته' },
  { key: 'preparing', label: 'قيد التجهيز',   icon: '👨‍🍳', desc: 'يتم الآن تجهيز طلبك' },
  { key: 'ready',     label: 'جاهز',          icon: '✅', desc: 'طلبك جاهز للتسليم' },
  { key: 'completed', label: 'تم التسليم',    icon: '🎉', desc: 'وصل طلبك بنجاح!' },
];

function stepIndex(status: OrderStatus) {
  return STEPS.findIndex(s => s.key === status);
}

export default function TrackScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savedPhone, setSavedPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async (phone: string) => {
    const savedId = await AsyncStorage.getItem(ORDER_ID_KEY);

    if (savedId) {
      const { data } = await db.from('orders').select('*').eq('id', savedId).single();
      if (data) { setOrder(data); setNotFound(false); return true; }
    }

    if (phone.trim()) {
      const { data } = await db
        .from('orders')
        .select('*')
        .eq('client_phone', phone.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) { setOrder(data); setNotFound(false); return true; }
    }

    setOrder(null);
    setNotFound(true);
    return false;
  }, []);

  useEffect(() => {
    async function init() {
      const phone = (await AsyncStorage.getItem(PHONE_KEY)) || '';
      setSavedPhone(phone);
      await fetchOrder(phone);
      setLoading(false);
    }
    init();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order) return;
    const channel = db
      .channel(`track-order-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${order.id}`,
      }, payload => {
        setOrder(prev => prev ? { ...prev, status: payload.new.status as OrderStatus } : prev);
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [order?.id]);

  const handleSearch = async () => {
    if (!inputPhone.trim()) return;
    setLoading(true);
    await AsyncStorage.removeItem(ORDER_ID_KEY);
    setSavedPhone(inputPhone.trim());
    await fetchOrder(inputPhone.trim());
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrder(savedPhone);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#e67e22" />
      </SafeAreaView>
    );
  }

  const current = order ? stepIndex(order.status) : -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#944a00', textAlign: 'center' }}>تتبع طلبك</Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} tintColor="#e67e22" />}
      >
        {notFound ? (
          /* ─── No order found ─── */
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6, textAlign: 'center' }}>لا يوجد طلب حالي</Text>
            <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
              ابحث عن طلبك برقم هاتفك
            </Text>
            <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={inputPhone}
                onChangeText={setInputPhone}
                placeholder="ادخل رقم هاتفك"
                keyboardType="phone-pad"
                textAlign="right"
                style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, backgroundColor: '#ffffff', color: '#111827' }}
              />
              <Pressable
                onPress={handleSearch}
                style={({ pressed }) => ({ backgroundColor: '#e67e22', paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>بحث</Text>
              </Pressable>
            </View>
          </View>
        ) : order ? (
          /* ─── Order found ─── */
          <>
            {/* Progress card */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 22, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', textAlign: 'right', marginBottom: 28 }}>حالة الطلب</Text>

              {/* Circles row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                {STEPS.map((step, idx) => {
                  const done = idx <= current;
                  const active = idx === current;
                  return (
                    <React.Fragment key={step.key}>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{
                          width: 46, height: 46, borderRadius: 23,
                          backgroundColor: done ? '#e67e22' : '#f1f5f9',
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: active ? 3 : 0,
                          borderColor: active ? '#944a00' : 'transparent',
                          shadowColor: '#e67e22',
                          shadowOpacity: done ? 0.35 : 0,
                          shadowRadius: 6, elevation: done ? 4 : 0,
                        }}>
                          <Text style={{ fontSize: 18 }}>{step.icon}</Text>
                        </View>
                      </View>
                      {idx < STEPS.length - 1 && (
                        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: idx < current ? '#e67e22' : '#f1f5f9', marginHorizontal: 2 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Labels row */}
              <View style={{ flexDirection: 'row' }}>
                {STEPS.map((step, idx) => (
                  <React.Fragment key={step.key}>
                    <View style={{ alignItems: 'center', width: 46 }}>
                      <Text style={{ fontSize: 10, fontWeight: idx === current ? 'bold' : 'normal', color: idx <= current ? '#e67e22' : '#9ca3af', textAlign: 'center' }}>
                        {step.label}
                      </Text>
                    </View>
                    {idx < STEPS.length - 1 && <View style={{ flex: 1 }} />}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Status message */}
            <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, marginBottom: 14, borderWidth: 1.5, borderColor: '#e67e22', alignItems: 'center' }}>
              <Text style={{ fontSize: 30, marginBottom: 6 }}>{STEPS[current]?.icon}</Text>
              <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#e67e22', marginBottom: 4 }}>{STEPS[current]?.label}</Text>
              <Text style={{ fontSize: 13, color: '#6b7280' }}>{STEPS[current]?.desc}</Text>
            </View>

            {/* Order details */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', textAlign: 'right', marginBottom: 14 }}>تفاصيل الطلب</Text>
              {[
                { label: 'الاسم', value: order.client_name },
                { label: 'العنوان', value: order.delivery_address || '—' },
                { label: 'الإجمالي', value: `${order.total_amount.toLocaleString()} د.ع` },
              ].map(row => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <Text style={{ color: '#e67e22', fontWeight: '600', fontSize: 14 }}>{row.value}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 14 }}>{row.label}</Text>
                </View>
              ))}
            </View>

            {/* Search another order */}
            <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>البحث بطلب آخر</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={inputPhone}
                onChangeText={setInputPhone}
                placeholder="رقم هاتف آخر"
                keyboardType="phone-pad"
                textAlign="right"
                style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, backgroundColor: '#ffffff', color: '#111827' }}
              />
              <Pressable
                onPress={handleSearch}
                style={({ pressed }) => ({ backgroundColor: '#e67e22', paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>بحث</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
