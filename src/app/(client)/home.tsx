import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
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
  const { items: cartItems, addItem, removeItem, clearCart, total } = useCart();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#e67e22" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm z-10">
        <Text className="text-xl font-bold text-[#944a00]">CulinaShare</Text>
        {cartItems.length > 0 && (
          <View className="bg-[#e67e22] w-6 h-6 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">{cartItems.reduce((s, i) => s + i.quantity, 0)}</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 200 : 24 }}>
        <Text className="text-3xl font-bold text-gray-900 mb-6 text-right">استكشف النكهات</Text>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" style={{ flexDirection: 'row-reverse' }}>
          <TouchableOpacity
            onPress={() => setActiveCategory('all')}
            className={`px-6 py-2 rounded-full mr-3 border border-gray-200 ${activeCategory === 'all' ? 'bg-[#e67e22]' : 'bg-gray-50'}`}
          >
            <Text className={`font-bold ${activeCategory === 'all' ? 'text-white' : 'text-gray-600'}`}>الكل</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full mr-3 border border-gray-200 ${activeCategory === cat.id ? 'bg-[#e67e22]' : 'bg-gray-50'}`}
            >
              <Text className={`font-bold ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items Grid */}
        {filtered.length === 0 ? (
          <Text className="text-center text-gray-400 mt-20">لا توجد وجبات</Text>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {filtered.map(meal => (
              <View key={meal.id} className="w-[48%] bg-white rounded-xl mb-4 overflow-hidden shadow-sm border border-gray-100">
                <View className="relative">
                  <Image
                    source={{ uri: meal.image_url || 'https://via.placeholder.com/150' }}
                    className="w-full h-32"
                    style={{ opacity: meal.is_available ? 1 : 0.35 }}
                  />
                  {!meal.is_available && (
                    <View className="absolute inset-0 bg-gray-400/60 items-center justify-center">
                      <Text className="text-white font-bold text-xs bg-gray-700/80 px-2 py-1 rounded-full">غير متوفر</Text>
                    </View>
                  )}
                </View>
                <View className={`p-3 ${!meal.is_available ? 'opacity-50' : ''}`}>
                  <Text className="font-bold text-lg text-right">{meal.name}</Text>
                  <Text className="text-[#e67e22] font-bold text-left mb-1">{meal.price.toLocaleString()} د.ع</Text>
                  <Text className="text-gray-500 text-xs text-right mb-3" numberOfLines={2}>{meal.description}</Text>
                  <TouchableOpacity
                    disabled={!meal.is_available}
                    className={`w-full py-2 rounded-lg items-center border ${meal.is_available ? 'border-[#e67e22]' : 'border-gray-300 bg-gray-100'}`}
                    onPress={() => meal.is_available && addItem({ id: meal.id, name: meal.name, price: meal.price, image_url: meal.image_url })}
                  >
                    <Text className={`font-bold ${meal.is_available ? 'text-[#e67e22]' : 'text-gray-400'}`}>
                      {meal.is_available ? 'أضف للسلة' : 'غير متوفر'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Cart Panel */}
      {cartItems.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl px-4 pt-4 pb-6">
          {/* Items list */}
          <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false} className="mb-3">
            {cartItems.map(item => (
              <View key={item.id} className="flex-row justify-between items-center py-1">
                <TouchableOpacity onPress={() => removeItem(item.id)} className="px-2">
                  <Text className="text-red-400 text-lg">×</Text>
                </TouchableOpacity>
                <View className="flex-1 flex-row justify-between items-center mx-2">
                  <Text className="text-[#e67e22] font-bold text-sm">{(item.price * item.quantity).toLocaleString()} د.ع</Text>
                  <Text className="text-gray-800 font-medium text-sm text-right">{item.quantity}× {item.name}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Total + Confirm button */}
          <View className="flex-row justify-between items-center border-t border-gray-100 pt-3">
            <TouchableOpacity
              className="bg-[#e67e22] px-8 py-3 rounded-xl"
              onPress={() => setShowModal(true)}
            >
              <Text className="text-white font-bold text-base">تاكيد الطلب</Text>
            </TouchableOpacity>
            <View className="items-end">
              <Text className="text-xs text-gray-500">الإجمالي</Text>
              <Text className="text-[#e67e22] font-bold text-lg">{total.toLocaleString()} د.ع</Text>
            </View>
          </View>
        </View>
      )}

      {/* Order Info Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={() => setShowModal(false)} />
          <View className="bg-white rounded-t-2xl px-5 pt-5 pb-8">
            {/* Handle */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-xl font-bold text-right mb-4 text-gray-800">تفاصيل الطلب</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="الاسم *"
              placeholderTextColor="#aaa"
              className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3 text-base"
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="رقم الهاتف *"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3 text-base"
            />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="العنوان"
              placeholderTextColor="#aaa"
              className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3 text-base"
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="ملاحظات للمطبخ (اختياري)"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={2}
              className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-5 text-base"
            />

            {/* Summary */}
            <View className="bg-orange-50 rounded-xl p-3 mb-5">
              <Text className="text-right font-bold text-gray-700 mb-1">ملخص الطلب</Text>
              {cartItems.map(i => (
                <Text key={i.id} className="text-right text-gray-600 text-sm">{i.quantity}× {i.name}</Text>
              ))}
              <Text className="text-right font-bold text-[#e67e22] mt-1">الإجمالي: {total.toLocaleString()} د.ع</Text>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              className={`w-full py-4 rounded-xl items-center ${sending ? 'bg-gray-400' : 'bg-[#e67e22]'}`}
            >
              <Text className="text-white font-bold text-lg">{sending ? 'جاري الإرسال...' : 'ارسال الطلب'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
