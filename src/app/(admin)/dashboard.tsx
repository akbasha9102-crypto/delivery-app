import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AdminDashboardScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity onPress={handleLogout} className="px-3 py-1 bg-red-100 rounded-lg">
          <Text className="text-red-600 font-bold">تسجيل الخروج</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#2563eb]">dasha</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-white p-4 rounded-xl shadow-sm border-t-4 border-green-500 mb-4">
            <Text className="text-gray-500 text-xs font-bold text-right mb-1">المبيعات</Text>
            <Text className="text-xl font-bold text-gray-800 text-right">0 د.ع</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl shadow-sm border-t-4 border-blue-500 mb-4">
            <Text className="text-gray-500 text-xs font-bold text-right mb-1">طلبات مكتملة</Text>
            <Text className="text-xl font-bold text-gray-800 text-right">0</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl shadow-sm border-t-4 border-yellow-500">
            <Text className="text-gray-500 text-xs font-bold text-right mb-1">قيد التجهيز</Text>
            <Text className="text-xl font-bold text-gray-800 text-right">0</Text>
          </View>
          <View className="w-[48%] bg-white p-4 rounded-xl shadow-sm border-t-4 border-purple-500">
            <Text className="text-gray-500 text-xs font-bold text-right mb-1">سائقين متوفرين</Text>
            <Text className="text-xl font-bold text-gray-800 text-right">0</Text>
          </View>
        </View>

        <Text className="text-lg font-bold mb-4 text-right">الطلبات الواردة</Text>
        <View className="bg-white rounded-xl p-6 items-center shadow-sm border border-gray-100">
          <Text className="text-gray-400">لا توجد طلبات واردة حالياً</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}