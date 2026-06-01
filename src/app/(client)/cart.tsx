import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';

const PHONE_STORAGE_KEY = 'deliveryPhone';

export default function CartScreen() {
  const { items, removeItem, clearCart, total } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHONE_STORAGE_KEY).then(v => {
      if (v) { setPhone(v); setPhoneConfirm(v); }
    });
  }, []);

  const submitOrder = async () => {
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
      setName(''); setAddress(''); setNote(''); setPhoneConfirm('');
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
    if (phone.trim() !== phoneConfirm.trim()) {
      Alert.alert('رقم الهاتف غير متطابق', 'تأكد من إدخال نفس الرقم في حقل التأكيد');
      return;
    }
    if (items.length === 0) {
      Alert.alert('السلة فارغة');
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`هل رقم هاتفك صحيح؟\n\n${phone.trim()}`)) {
        submitOrder();
      }
    } else {
      Alert.alert(
        'تأكيد رقم الهاتف',
        `هل رقم هاتفك صحيح؟\n\n${phone.trim()}`,
        [
          { text: 'تعديل', style: 'cancel' },
          { text: 'نعم، أرسل الطلب', onPress: submitOrder },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
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
            value={phoneConfirm}
            onChangeText={setPhoneConfirm}
            placeholder="تأكيد رقم الهاتف"
            keyboardType="phone-pad"
            className={`border rounded-xl px-4 py-3 text-right mb-3 ${
              phoneConfirm && phone !== phoneConfirm ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
          />
          {phoneConfirm.length > 0 && phone !== phoneConfirm && (
            <Text className="text-red-500 text-right text-sm -mt-2 mb-3">الرقم غير متطابق</Text>
          )}
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
          className={`w-full py-4 rounded-xl items-center mt-6 ${loading ? 'bg-gray-400' : 'bg-[#e67e22]'}`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
