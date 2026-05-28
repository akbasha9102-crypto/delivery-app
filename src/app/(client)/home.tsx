import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: '1', name: 'وجبات سريعة' },
    { id: '2', name: 'مشروبات' },
  ];

  const meals = [
    { id: '1', name: 'برغر كلاسيك', price: '5,000', desc: 'شريحة لحم مع جبن وخس', image: 'https://via.placeholder.com/150' },
    { id: '2', name: 'بيتزا مارغريتا', price: '8,000', desc: 'صلصة طماطم وجبن موزاريلا', image: 'https://via.placeholder.com/150' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm z-10">
        <Text className="text-xl font-bold text-[#944a00]">CulinaShare</Text>
        <TouchableOpacity className="bg-gray-100 p-2 rounded-full">
          <Text>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-3xl font-bold text-gray-900 mb-6 text-right">استكشف النكهات</Text>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" style={{ flexDirection: 'row-reverse' }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full mr-3 border border-gray-200 ${
                activeCategory === cat.id ? 'bg-[#e67e22]' : 'bg-gray-50'
              }`}
            >
              <Text className={`font-bold ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals Grid */}
        <View className="flex-row flex-wrap justify-between">
          {meals.map((meal) => (
            <View key={meal.id} className="w-[48%] bg-white rounded-xl mb-4 overflow-hidden shadow-sm border border-gray-100">
              <Image source={{ uri: meal.image }} className="w-full h-32" />
              <View className="p-3">
                <Text className="font-bold text-lg text-right">{meal.name}</Text>
                <Text className="text-[#e67e22] font-bold text-left mb-1">{meal.price} د.ع</Text>
                <Text className="text-gray-500 text-xs text-right mb-3" numberOfLines={2}>
                  {meal.desc}
                </Text>
                <TouchableOpacity className="w-full border border-[#e67e22] py-2 rounded-lg items-center">
                  <Text className="text-[#e67e22] font-bold">أضف للسلة</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
