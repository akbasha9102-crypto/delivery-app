import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TextInput, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import { useDarkMode } from '@/context/ThemeContext';
import { StaggerItem } from '@/components/stagger-item';
import { OrderStatusIllustration } from '@/components/order-status-illustration';

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
  const { dark } = useDarkMode();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savedPhone, setSavedPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const c = {
    bg: dark ? '#0f172a' : '#fafafa',
    header: dark ? '#1e293b' : '#ffffff',
    card: dark ? '#1e293b' : '#ffffff',
    cardBorder: dark ? '#334155' : '#f1f5f9',
    text: dark ? '#f1f5f9' : '#111827',
    subtext: dark ? '#94a3b8' : '#6b7280',
    input: dark ? '#0f172a' : '#ffffff',
    inputBorder: dark ? '#334155' : '#e5e7eb',
    stepDone: '#e67e22',
    stepEmpty: dark ? '#334155' : '#f1f5f9',
    statusCard: dark ? '#1c1917' : '#fff7ed',
    detailRow: dark ? '#334155' : '#f1f5f9',
  };

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
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#e67e22" />
      </SafeAreaView>
    );
  }

  const current = order ? stepIndex(order.status) : -1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StaggerItem index={0}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: c.header, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#944a00', textAlign: 'center' }}>تتبع طلبك</Text>
        </View>
      </StaggerItem>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e67e22']} tintColor="#e67e22" />}
      >
        {notFound ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 6, textAlign: 'center' }}>لا يوجد طلب حالي</Text>
            <Text style={{ color: c.subtext, textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
              ابحث عن طلبك برقم هاتفك
            </Text>
            <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={inputPhone}
                onChangeText={setInputPhone}
                placeholder="ادخل رقم هاتفك"
                placeholderTextColor={dark ? '#64748b' : '#aaa'}
                keyboardType="phone-pad"
                textAlign="right"
                style={{ flex: 1, borderWidth: 1, borderColor: c.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, backgroundColor: c.input, color: c.text }}
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
          <>
            {/* Status card with animated illustration */}
            <StaggerItem index={1}>
            <View style={{ backgroundColor: c.card, borderRadius: 24, paddingTop: 22, paddingBottom: 20, paddingHorizontal: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: dark ? 0.3 : 0.07, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: c.cardBorder }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: c.text, textAlign: 'right', marginBottom: 18 }}>حالة الطلب</Text>

              {/* Big animated illustration */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <OrderStatusIllustration status={order.status} dark={dark} />
              </View>

              {/* Status label + description */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#e67e22', marginBottom: 4 }}>{STEPS[current]?.label}</Text>
                <Text style={{ fontSize: 13, color: c.subtext, textAlign: 'center' }}>{STEPS[current]?.desc}</Text>
              </View>

              {/* Step dots row */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {STEPS.map((step, idx) => {
                  const done   = idx <= current;
                  const active = idx === current;
                  return (
                    <React.Fragment key={step.key}>
                      <View style={{ alignItems: 'center' }}>
                        <View style={{
                          width: active ? 14 : 10,
                          height: active ? 14 : 10,
                          borderRadius: active ? 7 : 5,
                          backgroundColor: done ? '#e67e22' : c.stepEmpty,
                          borderWidth: active ? 2 : 0,
                          borderColor: '#944a00',
                        }} />
                        <Text style={{ fontSize: 9, color: done ? '#e67e22' : c.subtext, marginTop: 4, fontWeight: active ? 'bold' : 'normal', textAlign: 'center', width: 44 }}>
                          {step.label}
                        </Text>
                      </View>
                      {idx < STEPS.length - 1 && (
                        <View style={{ flex: 1, height: 3, borderRadius: 1.5, backgroundColor: idx < current ? '#e67e22' : c.stepEmpty, marginHorizontal: 3, marginBottom: 14 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
            </StaggerItem>

            {/* Order details */}
            <StaggerItem index={3}>
            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: dark ? 0.2 : 0.04, shadowRadius: 6, elevation: 1, borderWidth: 1, borderColor: c.cardBorder }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: c.text, textAlign: 'right', marginBottom: 14 }}>تفاصيل الطلب</Text>
              {[
                { label: 'الاسم', value: order.client_name },
                { label: 'العنوان', value: order.delivery_address || '—' },
                { label: 'الإجمالي', value: `${order.total_amount.toLocaleString()} د.ع` },
              ].map(row => (
                <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.detailRow }}>
                  <Text style={{ color: '#e67e22', fontWeight: '600', fontSize: 14 }}>{row.value}</Text>
                  <Text style={{ color: c.subtext, fontSize: 14 }}>{row.label}</Text>
                </View>
              ))}
            </View>
            </StaggerItem>

            {/* Search another order */}
            <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>البحث بطلب آخر</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={inputPhone}
                onChangeText={setInputPhone}
                placeholder="رقم هاتف آخر"
                placeholderTextColor={dark ? '#64748b' : '#aaa'}
                keyboardType="phone-pad"
                textAlign="right"
                style={{ flex: 1, borderWidth: 1, borderColor: c.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, backgroundColor: c.input, color: c.text }}
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
