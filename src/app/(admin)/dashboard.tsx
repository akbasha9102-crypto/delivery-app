import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboardScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity onPress={handleLogout} className="px-3 py-1 bg-red-100 rounded-lg">
          <Text className="text-red-600 font-bold">تسجيل الخروج</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-orange-500">dasha</Text>
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

        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold mb-3 text-right">تعديل المنيو</Text>
          <Text className="text-gray-500 text-right mb-4">أضف أطباق جديدة لكل قسم أو أضف قسم جديد للقائمة.</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/menu')} className="bg-[#e67e22] py-3 rounded-xl items-center">
            <Text className="text-white font-bold">فتح محرر المنيو</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-bold mb-4 text-right">الطلبات الواردة</Text>
        <View className="bg-white rounded-xl p-6 items-center shadow-sm border border-gray-100">
          <Text className="text-gray-400">لا توجد طلبات واردة حالياً</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}