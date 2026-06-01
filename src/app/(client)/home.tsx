import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  Animated, Pressable, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import { useCart } from '@/context/CartContext';

const db = createClient(
  'https://gbmwrvnmvobvieembxmf.supabase.co',
  'sb_publishable_DB8lKUjdnAah-jNbpFV22w_7Id2Eggr'
);

const PHONE_KEY = 'deliveryPhone';

type Category = { id: string; name: string };
type Item = { id: string; name: string; price: number; description: string; image_url: string | null; category_id: string; is_available: boolean };

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const { items: cartItems, addItem, decrementItem, removeItem, clearCart, total } = useCart();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const panelAnim = useRef(new Animated.Value(0)).current;
  const prevLen = useRef(0);

  useEffect(() => {
    if (cartItems.length > 0 && prevLen.current === 0) {
      Animated.spring(panelAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 }).start();
    } else if (cartItems.length === 0 && prevLen.current > 0) {
      Animated.spring(panelAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }).start();
    }
    prevLen.current = cartItems.length;
  }, [cartItems.length]);

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: meals }] = await Promise.all([
        db.from('categories').select('*').order('name'),
        db.from('items').select('*'),
      ]);
      setCategories(cats || []);
      setItems(meals || []);
      setLoading(false);
    }
    load();
    AsyncStorage.getItem(PHONE_KEY).then(v => { if (v) setPhone(v); });
  }, []);

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category_id === activeCategory);

  const handleSend = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    setSending(true);
    try {
      await AsyncStorage.setItem(PHONE_KEY, phone.trim());
      const { data: order, error } = await db
        .from('orders')
        .insert({
          client_name: name.trim(),
          client_phone: phone.trim(),
          delivery_address: address.trim() || null,
          client_note: note.trim() || null,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (error || !order) throw error;

      await db.from('order_items').insert(
        cartItems.map(i => ({
          order_id: order.id,
          item_id: i.id,
          item_name: i.name,
          quantity: i.quantity,
          price: i.price,
        }))
      );

      setShowModal(false);
      clearCart();
      setName(''); setAddress(''); setNote('');
      Alert.alert('✅ تم إرسال الطلب', 'سيتم التواصل معك قريباً');
    } catch {
      Alert.alert('حدث خطأ', 'تأكد من الاتصال بالإنترنت وحاول مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  const c = {
    bg: dark ? '#0f172a' : '#fafafa',
    header: dark ? '#1e293b' : '#ffffff',
    card: dark ? '#1e293b' : '#ffffff',
    cardBorder: dark ? '#334155' : '#f1f5f9',
    text: dark ? '#f1f5f9' : '#111827',
    subtext: dark ? '#94a3b8' : '#6b7280',
    panel: dark ? '#1e293b' : '#ffffff',
    panelBorder: dark ? '#334155' : '#e5e7eb',
    catBg: dark ? '#1e293b' : '#f1f5f9',
    catBorder: dark ? '#334155' : '#e5e7eb',
    input: dark ? '#0f172a' : '#ffffff',
    summary: dark ? '#1c1917' : '#fff7ed',
    qtyBg: dark ? '#0f172a' : '#fff7ed',
    minusBg: dark ? '#334155' : '#e5e7eb',
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#e67e22" />
      </SafeAreaView>
    );
  }

  const panelTranslateY = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [220, 0] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.header, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => setDark(d => !d)}
            style={({ pressed }) => ({
              backgroundColor: dark ? '#334155' : '#f1f5f9',
              borderRadius: 20, padding: 8,
              transform: [{ scale: pressed ? 0.88 : 1 }],
            })}
          >
            <Text style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</Text>
          </Pressable>
          {cartItems.length > 0 && (
            <View style={{ backgroundColor: '#e67e22', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{cartItems.reduce((s, i) => s + i.quantity, 0)}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#944a00' }}>CulinaShare</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: cartItems.length > 0 ? 230 : 24 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: c.text, marginBottom: 18, textAlign: 'right' }}>استكشف النكهات</Text>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ flexDirection: 'row-reverse' }}>
          {[{ id: 'all', name: 'الكل' }, ...categories].map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={({ pressed }) => ({
                paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginLeft: 10,
                backgroundColor: activeCategory === cat.id ? '#e67e22' : c.catBg,
                borderWidth: 1, borderColor: activeCategory === cat.id ? '#e67e22' : c.catBorder,
                transform: [{ scale: pressed ? 0.93 : 1 }],
              })}
            >
              <Text style={{ fontWeight: 'bold', color: activeCategory === cat.id ? 'white' : c.subtext }}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Items Grid */}
        {filtered.length === 0 ? (
          <Text style={{ textAlign: 'center', color: c.subtext, marginTop: 80 }}>لا توجد وجبات</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {filtered.map(meal => {
              const qty = cartItems.find(i => i.id === meal.id)?.quantity || 0;
              return (
                <View key={meal.id} style={{ width: '48%', backgroundColor: c.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.cardBorder, shadowColor: '#000', shadowOpacity: dark ? 0.25 : 0.06, shadowRadius: 6, elevation: 2 }}>
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: meal.image_url || 'https://via.placeholder.com/150' }}
                      style={{ width: '100%', height: 120, opacity: meal.is_available ? 1 : 0.35 }}
                    />
                    {!meal.is_available && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(107,114,128,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12, backgroundColor: 'rgba(55,65,81,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>غير متوفر</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ padding: 12, opacity: meal.is_available ? 1 : 0.5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 14, textAlign: 'right', color: c.text, marginBottom: 2 }}>{meal.name}</Text>
                    <Text style={{ color: '#e67e22', fontWeight: 'bold', textAlign: 'left', marginBottom: 4, fontSize: 13 }}>{meal.price.toLocaleString()} د.ع</Text>
                    <Text style={{ color: c.subtext, fontSize: 11, textAlign: 'right', marginBottom: 10 }} numberOfLines={2}>{meal.description}</Text>

                    {qty > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.qtyBg, borderRadius: 10, padding: 4 }}>
                        <Pressable
                          onPress={() => addItem({ id: meal.id, name: meal.name, price: meal.price, image_url: meal.image_url })}
                          style={({ pressed }) => ({ backgroundColor: '#e67e22', width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.82 : 1 }] })}
                        >
                          <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', lineHeight: 26 }}>+</Text>
                        </Pressable>
                        <Text style={{ fontWeight: 'bold', fontSize: 17, color: c.text, minWidth: 24, textAlign: 'center' }}>{qty}</Text>
                        <Pressable
                          onPress={() => decrementItem(meal.id)}
                          style={({ pressed }) => ({ backgroundColor: c.minusBg, width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.82 : 1 }] })}
                        >
                          <Text style={{ color: c.text, fontSize: 22, fontWeight: 'bold', lineHeight: 26 }}>−</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        disabled={!meal.is_available}
                        onPress={() => meal.is_available && addItem({ id: meal.id, name: meal.name, price: meal.price, image_url: meal.image_url })}
                        style={({ pressed }) => ({
                          width: '100%', paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                          borderWidth: 1,
                          borderColor: meal.is_available ? '#e67e22' : c.catBorder,
                          backgroundColor: 'transparent',
                          transform: [{ scale: pressed && meal.is_available ? 0.94 : 1 }],
                        })}
                      >
                        <Text style={{ fontWeight: 'bold', color: meal.is_available ? '#e67e22' : c.subtext, fontSize: 13 }}>
                          {meal.is_available ? '+ أضف للسلة' : 'غير متوفر'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Animated Bottom Cart Panel */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: c.panel, borderTopWidth: 1, borderTopColor: c.panelBorder,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 12,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28,
        transform: [{ translateY: panelTranslateY }],
        display: cartItems.length > 0 ? 'flex' : 'none',
      }}>
        <View style={{ width: 40, height: 4, backgroundColor: c.catBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 10 }} />
        <ScrollView style={{ maxHeight: 110 }} showsVerticalScrollIndicator={false}>
          {cartItems.map(item => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={{ paddingHorizontal: 6 }}>
                <Text style={{ color: '#f87171', fontSize: 20 }}>×</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 8 }}>
                <Text style={{ color: '#e67e22', fontWeight: 'bold', fontSize: 13 }}>{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                <Text style={{ color: c.text, fontWeight: '500', fontSize: 13, textAlign: 'right' }}>{item.quantity}× {item.name}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: c.panelBorder, paddingTop: 12, marginTop: 6 }}>
          <Pressable
            onPress={() => setShowModal(true)}
            style={({ pressed }) => ({ backgroundColor: '#e67e22', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, transform: [{ scale: pressed ? 0.96 : 1 }] })}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>تاكيد الطلب</Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: c.subtext }}>الإجمالي</Text>
            <Text style={{ color: '#e67e22', fontWeight: 'bold', fontSize: 19 }}>{total.toLocaleString()} د.ع</Text>
          </View>
        </View>
      </Animated.View>

      {/* Order Info Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={{ backgroundColor: c.panel, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 }}>
            <View style={{ width: 44, height: 4, backgroundColor: c.catBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, color: c.text }}>تفاصيل الطلب</Text>

            <TextInput
              value={name} onChangeText={setName} placeholder="الاسم *"
              placeholderTextColor={dark ? '#64748b' : '#aaa'}
              style={{ borderWidth: 1, borderColor: c.panelBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', fontSize: 15, marginBottom: 12, backgroundColor: c.input, color: c.text }}
            />
            <TextInput
              value={phone} onChangeText={setPhone} placeholder="رقم الهاتف *"
              placeholderTextColor={dark ? '#64748b' : '#aaa'} keyboardType="phone-pad"
              style={{ borderWidth: 1, borderColor: c.panelBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', fontSize: 15, marginBottom: 12, backgroundColor: c.input, color: c.text }}
            />
            <TextInput
              value={address} onChangeText={setAddress} placeholder="العنوان"
              placeholderTextColor={dark ? '#64748b' : '#aaa'}
              style={{ borderWidth: 1, borderColor: c.panelBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', fontSize: 15, marginBottom: 12, backgroundColor: c.input, color: c.text }}
            />
            <TextInput
              value={note} onChangeText={setNote} placeholder="ملاحظات للمطبخ (اختياري)"
              placeholderTextColor={dark ? '#64748b' : '#aaa'} multiline numberOfLines={2}
              style={{ borderWidth: 1, borderColor: c.panelBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', fontSize: 15, marginBottom: 16, backgroundColor: c.input, color: c.text }}
            />

            <View style={{ backgroundColor: c.summary, borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <Text style={{ textAlign: 'right', fontWeight: 'bold', color: c.text, marginBottom: 6 }}>ملخص الطلب</Text>
              {cartItems.map(i => (
                <Text key={i.id} style={{ textAlign: 'right', color: c.subtext, fontSize: 13, marginBottom: 2 }}>{i.quantity}× {i.name}</Text>
              ))}
              <Text style={{ textAlign: 'right', fontWeight: 'bold', color: '#e67e22', marginTop: 6, fontSize: 15 }}>الإجمالي: {total.toLocaleString()} د.ع</Text>
            </View>

            <Pressable
              onPress={handleSend} disabled={sending}
              style={({ pressed }) => ({ width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: sending ? '#9ca3af' : '#e67e22', transform: [{ scale: pressed && !sending ? 0.97 : 1 }] })}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>{sending ? 'جاري الإرسال...' : 'ارسال الطلب'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
