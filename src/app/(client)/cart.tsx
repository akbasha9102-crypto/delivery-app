import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PHONE_STORAGE_KEY = 'deliveryPhone';

export default function CartScreen() {
  const [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  const cartItems = [
    { id: '1', name: 'برغر كلاسيك', price: '5,000', quantity: 2 },
    { id: '2', name: 'بيتزا مارغريتا', price: '8,000', quantity: 1 },
  ];

  useEffect(() => {
    const loadPhone = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem(PHONE_STORAGE_KEY);
        if (storedPhone) {
          setPhone(storedPhone);
        }
      } catch (error) {
        console.warn('Failed to load saved phone number:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadPhone();
  }, []);

  const handlePhoneChange = async (value) => {
    setPhone(value);
    try {
      await AsyncStorage.setItem(PHONE_STORAGE_KEY, value);
    } catch (error) {
      console.warn('Failed to save phone number:', error);
    }
  };

  const handleConfirmOrder = () => {
    if (!phone.trim()) {
      Alert.alert('الرجاء إدخال رقم الهاتف قبل تأكيد الطلب');
      return;
    }

    Alert.alert('تم حفظ الرقم', 'رقم الهاتف تم حفظه وسيظهر تلقائياً في الزيارات القادمة.');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm z-10 border-b border-gray-100">
        <Text className="text-xl font-bold text-[#944a00]">سلة المشتريات</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-4">
        {cartItems.map(item => (
          <View key={item.id} className="flex-row justify-between items-center bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100">
            <TouchableOpacity className="bg-red-100 p-2 rounded-full">
              <Text>🗑️</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
              <View>
                <Text className="font-bold text-lg text-right">{item.name}</Text>
                <Text className="text-[#e67e22] text-right">{item.price} د.ع</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-lg ml-2">
                <Text className="font-bold">{item.quantity}x</Text>
              </View>
            </View>
          </View>
        ))}

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4 mb-4">
          <Text className="font-bold text-right mb-2">معلومات الطلب</Text>
          <TextInput
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="رقم الهاتف"
            keyboardType="phone-pad"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right"
          />
          <Text className="text-gray-500 text-sm mt-3 text-right">
            سيتم حفظ رقمك في جهازك بحيث لا تحتاج لإدخاله مرة أخرى عند فتح الموقع.
          </Text>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="font-bold">18,000 د.ع</Text>
            <Text className="text-gray-500">المجموع الفرعي</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="font-bold">2,000 د.ع</Text>
            <Text className="text-gray-500">التوصيل</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-2">
            <Text className="font-bold text-lg text-[#e67e22]">20,000 د.ع</Text>
            <Text className="font-bold text-lg">الإجمالي</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleConfirmOrder} className="w-full bg-[#e67e22] py-4 rounded-xl items-center mt-6">
          <Text className="text-white font-bold text-lg">تأكيد الطلب</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
