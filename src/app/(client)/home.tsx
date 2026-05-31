import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/CartContext';

type Category = { id: string; name: string };
type Item = { id: string; name: string; price: number; description: string; image_url: string | null; category_id: string; is_available: boolean };

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: meals }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('items').select('*').eq('is_available', true),
      ]);
      setCategories(cats || []);
      setItems(meals || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category_id === activeCategory);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#e67e22" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm z-10">
        <Text className="text-xl font-bold text-[#944a00]">CulinaShare</Text>
        <TouchableOpacity className="bg-gray-100 p-2 rounded-full" onPress={() => router.push('/cart')}>
          <Text>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-3xl font-bold text-gray-900 mb-6 text-right">استكشف النكهات</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" style={{ flexDirection: 'row-reverse' }}>
          <TouchableOpacity
            onPress={() => setActiveCategory('all')}
            className={`px-6 py-2 rounded-full mr-3 border border-gray-200 ${activeCategory === 'all' ? 'bg-[#e67e22]' : 'bg-gray-50'}`}
          >
            <Text className={`font-bold ${activeCategory === 'all' ? 'text-white' : 'text-gray-600'}`}>الكل</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full mr-3 border border-gray-200 ${activeCategory === cat.id ? 'bg-[#e67e22]' : 'bg-gray-50'}`}
            >
              <Text className={`font-bold ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <Text className="text-center text-gray-400 mt-20">لا توجد وجبات متاحة</Text>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {filtered.map((meal) => (
              <View key={meal.id} className="w-[48%] bg-white rounded-xl mb-4 overflow-hidden shadow-sm border border-gray-100">
                <Image
                  source={{ uri: meal.image_url || 'https://via.placeholder.com/150' }}
                  className="w-full h-32"
                />
                <View className="p-3">
                  <Text className="font-bold text-lg text-right">{meal.name}</Text>
                  <Text className="text-[#e67e22] font-bold text-left mb-1">{meal.price.toLocaleString()} د.ع</Text>
                  <Text className="text-gray-500 text-xs text-right mb-3" numberOfLines={2}>{meal.description}</Text>
                  <TouchableOpacity
                    className="w-full border border-[#e67e22] py-2 rounded-lg items-center"
                    onPress={() => addItem({ id: meal.id, name: meal.name, price: meal.price, image_url: meal.image_url })}
                  >
                    <Text className="text-[#e67e22] font-bold">أضف للسلة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
