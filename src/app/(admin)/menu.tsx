import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x200.png?text=Food';

export default function AdminMenuScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [newCategory, setNewCategory] = useState('');

  const fetchMenu = async () => {
    setLoading(true);
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (categoriesError) {
      setMessage('حدث خطأ أثناء جلب الأقسام');
      setLoading(false);
      return;
    }

    if (!categoriesData || categoriesData.length === 0) {
      const defaultCategories = [
        { name: 'وجبات سريعة' },
        { name: 'مشروبات' },
        { name: 'حلويات' },
      ];
      const { error: insertError } = await supabase.from('categories').insert(defaultCategories);
      if (insertError) {
        setMessage('تعذّر إنشاء الأقسام الافتراضية');
        setLoading(false);
        return;
      }
      await fetchMenu();
      return;
    }

    setCategories(categoriesData);

    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) {
      setMessage('حدث خطأ أثناء جلب الأطباق');
      setLoading(false);
      return;
    }

    setItems(itemsData || []);
    setLoading(false);
    setMessage('');
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('أدخل اسم القسم');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategory.trim() }]);
    if (error) {
      setMessage('تعذّر إضافة القسم');
    } else {
      setNewCategory('');
      await fetchMenu();
      setMessage('تم إضافة القسم بنجاح');
    }
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!form.category_id || !form.name.trim() || !form.price.trim()) {
      Alert.alert('الرجاء ملء اسم الطبق والسعر واختيار القسم');
      return;
    }

    const parsedPrice = parseFloat(form.price.replace(',', '.'));
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('الرجاء إدخال سعر صالح');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('items').insert([
      {
        category_id: form.category_id,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parsedPrice,
        image_url: form.image_url.trim() || DEFAULT_IMAGE,
      },
    ]);

    if (error) {
      setMessage('تعذّر إضافة الطبق');
    } else {
      setForm({ category_id: '', name: '', description: '', price: '', image_url: '' });
      await fetchMenu();
      setMessage('تم إضافة الطبق بنجاح');
    }
    setLoading(false);
  };

  const categoryMap = categories.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4 bg-white shadow-sm border-b border-gray-100">
        <TouchableOpacity onPress={() => router.push('/(admin)/dashboard')} className="px-3 py-1 bg-gray-100 rounded-lg">
          <Text className="text-gray-700">رجوع</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-orange-500">تعديل المنيو</Text>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-right mb-3">أضف قسم جديد</Text>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            placeholder="اسم القسم"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TouchableOpacity
            onPress={handleAddCategory}
            className="bg-[#e67e22] py-3 rounded-xl items-center"
            disabled={loading}
          >
            <Text className="text-white font-bold">إضافة القسم</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-right mb-3">أضف طبق جديد</Text>
          <View className="mb-3">
            <Text className="text-right text-gray-600 mb-2">اختر القسم</Text>
            <View className="border border-gray-200 rounded-xl overflow-hidden">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row-reverse' }} className="px-1 py-2">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setForm((prev) => ({ ...prev, category_id: category.id }))}
                    className={`px-4 py-2 rounded-full mr-2 ${form.category_id === category.id ? 'bg-[#e67e22]' : 'bg-gray-100'}`}
                  >
                    <Text className={`${form.category_id === category.id ? 'text-white' : 'text-gray-700'}`}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <TextInput
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            placeholder="اسم الطبق"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={form.description}
            onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="وصف الطبق"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={form.price}
            onChangeText={(value) => setForm((prev) => ({ ...prev, price: value }))}
            placeholder="السعر"
            keyboardType="decimal-pad"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-3"
          />
          <TextInput
            value={form.image_url}
            onChangeText={(value) => setForm((prev) => ({ ...prev, image_url: value }))}
            placeholder="رابط صورة (اختياري)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-right mb-4"
          />
          <TouchableOpacity onPress={handleAddItem} className="bg-[#10b981] py-3 rounded-xl items-center" disabled={loading}>
            <Text className="text-white font-bold">إضافة الطبق</Text>
          </TouchableOpacity>
        </View>

        {message ? (
          <View className="bg-yellow-100 border border-yellow-200 rounded-xl p-4 mb-6">
            <Text className="text-yellow-800 text-right">{message}</Text>
          </View>
        ) : null}

        <Text className="text-lg font-bold mb-4 text-right">الأقسام والأطباق</Text>
        {loading ? (
          <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-right">جاري التحميل...</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
              <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Text className="text-right text-lg font-bold">{category.name}</Text>
              </View>
              {items.filter((item) => item.category_id === category.id).length === 0 ? (
                <View className="p-4">
                  <Text className="text-gray-400 text-right">لا توجد أطباق في هذا القسم بعد.</Text>
                </View>
              ) : (
                items
                  .filter((item) => item.category_id === category.id)
                  .map((item) => (
                    <View key={item.id} className="px-4 py-4 border-b border-gray-100 last:border-b-0">
                      <Text className="font-bold text-right">{item.name}</Text>
                      <Text className="text-gray-500 text-sm text-right">{item.description || 'بدون وصف'}</Text>
                      <Text className="text-[#e67e22] font-bold text-right mt-2">{item.price} د.ع</Text>
                    </View>
                  ))
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
