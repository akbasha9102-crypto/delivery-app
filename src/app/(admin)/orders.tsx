import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveOrdersScreen() {
  const [activeTab, setActiveTab] = useState('pending');
  const tabs = [
    { id: 'delivering', name: 'توصيل' },
    { id: 'preparing', name: 'تجهيز' },
    { id: 'pending', name: 'واردة' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-center items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <Text className="text-xl font-bold text-[#4f46e5]">الطلبات الحية</Text>
      </View>
      
      <View className="flex-row justify-center bg-white border-b border-gray-100">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.id ? 'border-[#4f46e5]' : 'border-transparent'}`}
          >
            <Text className={`font-bold ${activeTab === tab.id ? 'text-[#4f46e5]' : 'text-gray-500'}`}>{tab.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Placeholder order card */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-2">
            <Text className="font-bold text-[#f59e0b]">قيد الانتظار</Text>
            <Text className="text-gray-500">رقم: #12345</Text>
          </View>
          <Text className="font-bold text-lg text-right">أحمد محمد</Text>
          <Text className="text-gray-600 text-right mb-2">07700000000 - البصرة القديمة</Text>
          
          <View className="bg-gray-50 p-2 rounded-lg mb-3">
            <Text className="text-right">2x برغر كلاسيك</Text>
            <Text className="text-right">1x بيتزا مارغريتا</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <TouchableOpacity className="bg-[#4f46e5] px-4 py-2 rounded-lg">
              <Text className="text-white font-bold">تجهيز الطلب</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg text-green-600">20,000 د.ع</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
