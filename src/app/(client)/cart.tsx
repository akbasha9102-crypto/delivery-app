import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';

const PHONE_STORAGE_KEY = 'deliveryPhone';

export default function CartScreen() {
  const { items, removeItem, clearCart, total } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHONE_STORAGE_KEY).then(v => {
      if (v) setPhone(v);
    });
  }, []);

  const submitOrder = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await AsyncStorage.setItem(PHONE_STORAGE_KEY, phone.trim());

      const { data: order, error } = await supabase
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

      const orderItemsData = items.map(i => ({
        order_id: order.id,
        item_id: i.id,
        item_name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      await supabase.from('order_items').insert(orderItemsData);

      Alert.alert('✅ تم إرسال الطلب', 'سيتم التواصل معك قريباً');
      clearCart();
      setName(''); setAddress(''); setNote('');
    } catch {
      Alert.alert('حدث خطأ', 'تأكد من الاتصال بالإنترنت وحاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    if (items.length === 0) {
      Alert.alert('السلة فارغة');
      return;
    }
    setShowModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Confirmation Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-2xl mx-6 p-6 w-full max-w-sm shadow-xl">
            <Text className="text-xl font-bold text-center text-[#944a00] mb-2">تأكيد رقم الهاتف</Text>
            <Text className="text-center text-gray-500 mb-5">تأكد أن رقم هاتفك صحيح قبل إرسال الطلب</Text>

            <View className="bg-orange-50 border border-[#e67e22] rounded-xl px-4 py-4 mb-6 items-center">
              <Text className="text-sm text-gray-500 mb-1">رقم هاتفك</Text>
              <Text className="text-2xl font-bold text-[#e67e22] tracking-widest">{phone.trim()}</Text>
            </View>

            <TouchableOpacity
              onPress={submitOrder}
              className="bg-[#e67e22] py-3 rounded-xl items-center mb-3"
            >
              <Text className="text-white font-bold text-lg">نعم، الرقم صحيح — أرسل الطلب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="py-3 rounded-xl items-center border border-gray-200"
            >
              <Text className="text-gray-600 font-semibold">تعديل الرقم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm z-10 border-b border-gray-100">
        <Text className="text-xl font-bold text-[#944a00]">سلة المشتريات</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {items.length === 0 ? (
          <Text className="text-center text-gray-400 mt-20">السلة فارغة</Text>
        ) : (
          items.map(item => (
            <View key={item.id} className="flex-row justify-between items-center bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
              <TouchableOpacity className="bg-red-100 p-2 rounded-full" onPress={() => removeItem(item.id)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
              <View className="flex-row items-center gap-3">
                <View>
                  <Text className="font-bold text-lg text-right">{item.name}</Text>
                  <Text className="text-[#e67e22] text-right">{item.price.toLocaleString()} د.ع</Text>
                </View>
                <View className="bg-gray-100 px-3 py-1 rounded-lg ml-2">
                  <Text className="font-bold">{item.quantity}x</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4 mb-4">
          <Text className="font-bold text-right mb-3">معلومات الطلب</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="الاسم"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="رقم الهاتف"
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="العنوان"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="ملاحظات (اختياري)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right"
          />
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
          <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-2">
            <Text className="font-bold text-lg text-[#e67e22]">{total.toLocaleString()} د.ع</Text>
            <Text className="font-bold text-lg">الإجمالي</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleConfirmOrder}
          disabled={loading}
          className={`w-full py-4 rounded-xl items-center mt-6 mb-6 ${loading ? 'bg-gray-400' : 'bg-[#e67e22]'}`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
