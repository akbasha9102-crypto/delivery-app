import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  Animated, Pressable, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/CartContext';

const db = createClient(
  'https://gbmwrvnmvobvieembxmf.supabase.co',
  'sb_publishable_DB8lKUjdnAah-jNbpFV22w_7Id2Eggr'
);

const PHONE_KEY = 'deliveryPhone';

type Category = { id: string; name: string };
type Item = { id: string; name: string; price: number; description: string; image_url: string | null; category_id: string; is_available: boolean };

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const { items: cartItems, addItem, decrementItem, removeItem, clearCart, total } = useCart();

  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [availableExtras, setAvailableExtras] = useState<{ id: string; item_id: string; name: string; price: number; item_name: string }[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
  const [loadingExtras, setLoadingExtras] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const extrasTotal = availableExtras
    .filter(e => selectedExtraIds.has(e.id))
    .reduce((sum, e) => sum + e.price, 0);

  const BASRA_AREAS = [
    'العشار', 'المعقل', 'أبو الخصيب', 'الزبير', 'القرنة', 'الهارثة',
    'البصرة القديمة', 'الجزائر', 'الأصمعي', 'البريهة', 'المدينة',
    'كرمة علي', 'الدير', 'التنومة', 'السيبة', 'الفاو',
    'خور الزبير', 'أم قصر', 'الشعيبة', 'شط العرب', 'الجنينة',
  ];

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

  const handleConfirmCart = async () => {
    setLoadingExtras(true);
    try {
      const itemIds = cartItems.map(i => i.id);
      const { data } = await db.from('item_extras').select('*').in('item_id', itemIds);
      if (data && data.length > 0) {
        setAvailableExtras(data.map(e => ({
          ...e,
          item_name: cartItems.find(i => i.id === e.item_id)?.name || '',
        })));
        setSelectedExtraIds(new Set());
        setShowExtrasModal(true);
      } else {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    } finally {
      setLoadingExtras(false);
    }
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    if (!area) {
      Alert.alert('الرجاء اختيار منطقتك');
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
          delivery_address: area + (locationDesc.trim() ? ' - ' + locationDesc.trim() : ''),
          client_note: note.trim() || null,
          total_amount: total + extrasTotal,
          status: 'pending',
        })
        .select()
        .single();

      if (error || !order) throw error;

      await db.from('order_items').insert(
        cartItems.map(i => {
          const itemExtras = availableExtras
            .filter(e => e.item_id === i.id && selectedExtraIds.has(e.id))
            .map(e => e.name).join('، ');
          return {
            order_id: order.id,
            item_id: i.id,
            item_name: i.name,
            quantity: i.quantity,
            price: i.price,
            extras: itemExtras || null,
          };
        })
      );

      setShowModal(false);
      setShowExtrasModal(false);
      setSelectedExtraIds(new Set());
      setAvailableExtras([]);
      clearCart();
      setName(''); setArea(''); setLocationDesc(''); setNote('');
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#944a00' }}>CulinaShare</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: dark ? '#334155' : '#f1f5f9',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
              transform: [{ scale: pressed ? 0.88 : 1 }],
            })}
          >
            <Text style={{ fontSize: 18, color: dark ? '#f1f5f9' : '#374151' }}>→</Text>
          </Pressable>
        </View>
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
            onPress={handleConfirmCart}
            disabled={loadingExtras}
            style={({ pressed }) => ({ backgroundColor: '#e67e22', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, transform: [{ scale: pressed ? 0.96 : 1 }], opacity: loadingExtras ? 0.7 : 1 })}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{loadingExtras ? '...' : 'تاكيد الطلب'}</Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: c.subtext }}>الإجمالي</Text>
            <Text style={{ color: '#e67e22', fontWeight: 'bold', fontSize: 19 }}>{total.toLocaleString()} د.ع</Text>
          </View>
        </View>
      </Animated.View>

      {/* Extras Selection Modal */}
      <Modal visible={showExtrasModal} transparent animationType="slide" onRequestClose={() => setShowExtrasModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={() => setShowExtrasModal(false)} />
          <View style={{ backgroundColor: c.panel, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: '75%' }}>
            <View style={{ width: 44, height: 4, backgroundColor: c.catBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: c.subtext, fontSize: 13 }}>اختياري</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.text }}>أضف للطلب 🧂</Text>
            </View>
            <Text style={{ color: c.subtext, fontSize: 13, textAlign: 'right', marginBottom: 16 }}>اختر الإضافات التي تريدها مع طلبك</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {/* Group by item */}
              {cartItems.map(cartItem => {
                const itemExtras = availableExtras.filter(e => e.item_id === cartItem.id);
                if (itemExtras.length === 0) return null;
                return (
                  <View key={cartItem.id} style={{ marginBottom: 16 }}>
                    <Text style={{ color: '#e67e22', fontWeight: 'bold', textAlign: 'right', fontSize: 14, marginBottom: 8 }}>
                      {cartItem.name}
                    </Text>
                    {itemExtras.map(extra => {
                      const selected = selectedExtraIds.has(extra.id);
                      return (
                        <Pressable
                          key={extra.id}
                          onPress={() => toggleExtra(extra.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: selected ? (dark ? '#1c3a2a' : '#fff7ed') : (dark ? '#0f172a' : '#f8fafc'),
                            borderWidth: 1.5, borderColor: selected ? '#e67e22' : c.panelBorder,
                            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                            marginBottom: 8, transform: [{ scale: pressed ? 0.97 : 1 }],
                          })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: selected ? '#e67e22' : c.subtext, backgroundColor: selected ? '#e67e22' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                              {selected && <Text style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>✓</Text>}
                            </View>
                            {extra.price > 0
                              ? <Text style={{ color: '#e67e22', fontWeight: 'bold', fontSize: 13 }}>+{extra.price.toLocaleString()} د.ع</Text>
                              : <Text style={{ color: c.subtext, fontSize: 13 }}>مجاني</Text>
                            }
                          </View>
                          <Text style={{ color: c.text, fontWeight: selected ? 'bold' : 'normal', fontSize: 15, textAlign: 'right' }}>{extra.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>

            {/* Extras total + buttons */}
            {extrasTotal > 0 && (
              <View style={{ backgroundColor: c.qtyBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#e67e22', fontWeight: 'bold' }}>{extrasTotal.toLocaleString()} د.ع</Text>
                <Text style={{ color: c.text, fontWeight: 'bold' }}>تكلفة الإضافات</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => { setShowExtrasModal(false); setShowModal(true); }}
                style={({ pressed }) => ({ flex: 1, backgroundColor: dark ? '#334155' : '#f1f5f9', paddingVertical: 14, borderRadius: 14, alignItems: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}
              >
                <Text style={{ color: c.subtext, fontWeight: 'bold', fontSize: 15 }}>تخطي</Text>
              </Pressable>
              <Pressable
                onPress={() => { setShowExtrasModal(false); setShowModal(true); }}
                style={({ pressed }) => ({ flex: 2, backgroundColor: '#e67e22', paddingVertical: 14, borderRadius: 14, alignItems: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>متابعة ←</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Order Info Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={{ backgroundColor: c.panel, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 }}>
            <View style={{ width: 44, height: 4, backgroundColor: c.catBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.text }}>تفاصيل الطلب</Text>
              <Pressable
                onPress={() => setShowModal(false)}
                style={({ pressed }) => ({
                  backgroundColor: dark ? '#334155' : '#f1f5f9',
                  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                })}
              >
                <Text style={{ color: dark ? '#f1f5f9' : '#374151', fontSize: 15, fontWeight: '600' }}>المنيو</Text>
                <Text style={{ color: dark ? '#f1f5f9' : '#374151', fontSize: 16 }}>←</Text>
              </Pressable>
            </View>

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
            {/* Area Dropdown */}
            <Pressable
              onPress={() => setShowAreaPicker(p => !p)}
              style={({ pressed }) => ({
                borderWidth: 1, borderColor: area ? '#e67e22' : c.panelBorder,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
                backgroundColor: c.input, marginBottom: showAreaPicker ? 0 : 12,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ fontSize: 16, color: dark ? '#94a3b8' : '#aaa' }}>{showAreaPicker ? '▲' : '▼'}</Text>
              <Text style={{ fontSize: 15, color: area ? c.text : (dark ? '#64748b' : '#aaa'), textAlign: 'right' }}>
                {area || 'اختر منطقتك في البصرة *'}
              </Text>
            </Pressable>

            {showAreaPicker && (
              <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: '#e67e22', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: c.input, marginBottom: 12, maxHeight: 200, overflow: 'hidden' }}>
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {BASRA_AREAS.map((a, idx) => (
                    <Pressable
                      key={a}
                      onPress={() => { setArea(a); setShowAreaPicker(false); }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16, paddingVertical: 12,
                        backgroundColor: area === a ? (dark ? '#1c3a2a' : '#fff7ed') : (pressed ? (dark ? '#334155' : '#f8fafc') : 'transparent'),
                        borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: c.panelBorder,
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      })}
                    >
                      {area === a && <Text style={{ color: '#e67e22', fontSize: 16 }}>✓</Text>}
                      <Text style={{ color: area === a ? '#e67e22' : c.text, fontWeight: area === a ? 'bold' : 'normal', fontSize: 14, textAlign: 'right', flex: 1 }}>{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Location Description */}
            <TextInput
              value={locationDesc} onChangeText={setLocationDesc}
              placeholder="وصف الموقع (مثال: بجانب المدرسة، شارع...)"
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
              {extrasTotal > 0 && (
                <Text style={{ textAlign: 'right', color: c.subtext, fontSize: 13, marginTop: 4 }}>
                  إضافات: +{extrasTotal.toLocaleString()} د.ع
                </Text>
              )}
              <Text style={{ textAlign: 'right', fontWeight: 'bold', color: '#e67e22', marginTop: 6, fontSize: 15 }}>الإجمالي: {(total + extrasTotal).toLocaleString()} د.ع</Text>
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
