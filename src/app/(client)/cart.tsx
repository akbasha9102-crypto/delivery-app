import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const cartItems = [
    { id: '1', name: 'برغر كلاسيك', price: '5,000', quantity: 2 },
    { id: '2', name: 'بيتزا مارغريتا', price: '8,000', quantity: 1 },
  ];

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

        <TouchableOpacity className="w-full bg-[#e67e22] py-4 rounded-xl items-center mt-6">
          <Text className="text-white font-bold text-lg">تأكيد الطلب</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
