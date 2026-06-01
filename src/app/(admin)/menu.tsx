import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x200.png?text=Food';

type Category = { id: string; name: string };
type Item = { id: string; category_id: string; name: string; description: string; price: number; image_url: string; is_available: boolean };
type Extra = { id: string; item_id: string; name: string; price: number };

function InputField({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <View className="mb-3">
      {label && <Text className="text-gray-400 text-xs text-right mb-1">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        keyboardType={keyboardType}
        className="bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-right text-white"
      />
    </View>
  );
}

export default function AdminMenuScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
  const [form, setForm] = useState({ category_id: '', name: '', description: '', price: '', image_url: '' });
  const [newCategory, setNewCategory] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({ category_id: '', name: '', description: '', price: '', image_url: '' });

  const [extras, setExtras] = useState<Extra[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [savingExtra, setSavingExtra] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    const { data: catsData } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (!catsData || catsData.length === 0) {
      await supabase.from('categories').insert([{ name: 'وجبات سريعة' }, { name: 'مشروبات' }, { name: 'حلويات' }]);
      await fetchMenu();
      return;
    }
    setCategories(catsData);
    const { data: itemsData } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    setItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => { fetchMenu(); }, []);

  const showMsg = (text: string, success = true) => {
    setMessage({ text, success });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) { Alert.alert('أدخل اسم القسم'); return; }
    setSaving(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategory.trim() }]);
    if (error) showMsg('تعذّر إضافة القسم', false);
    else { setNewCategory(''); await fetchMenu(); showMsg('✓ تم إضافة القسم'); }
    setSaving(false);
  };

  const handleAddItem = async () => {
    if (!form.category_id || !form.name.trim() || !form.price.trim()) {
      Alert.alert('الرجاء ملء اسم الطبق والسعر واختيار القسم'); return;
    }
    const parsedPrice = parseFloat(form.price.replace(',', '.'));
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) { Alert.alert('الرجاء إدخال سعر صالح'); return; }
    setSaving(true);
    const { error } = await supabase.from('items').insert([{
      category_id: form.category_id, name: form.name.trim(),
      description: form.description.trim(), price: parsedPrice,
      image_url: form.image_url.trim() || DEFAULT_IMAGE, is_available: true,
    }]);
    if (error) showMsg('تعذّر إضافة الطبق', false);
    else { setForm({ category_id: '', name: '', description: '', price: '', image_url: '' }); await fetchMenu(); showMsg('✓ تم إضافة الطبق'); }
    setSaving(false);
  };

  const openEdit = async (item: Item) => {
    setEditingItem(item);
    setEditForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      image_url: item.image_url || '',
    });
    setNewExtraName('');
    setNewExtraPrice('');
    await openEditExtras(item.id);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editForm.name.trim() || !editForm.price.trim()) {
      Alert.alert('الرجاء ملء الاسم والسعر'); return;
    }
    const parsedPrice = parseFloat(editForm.price.replace(',', '.'));
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) { Alert.alert('سعر غير صالح'); return; }
    setSaving(true);
    const { error } = await supabase.from('items').update({
      category_id: editForm.category_id || editingItem.category_id,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      price: parsedPrice,
      image_url: editForm.image_url.trim() || DEFAULT_IMAGE,
    }).eq('id', editingItem.id);
    if (error) showMsg('تعذّر حفظ التعديل', false);
    else { await fetchMenu(); setEditingItem(null); showMsg('✓ تم حفظ التعديلات'); }
    setSaving(false);
  };

  const handleAddExtra = async () => {
    if (!editingItem || !newExtraName.trim()) return;
    setSavingExtra(true);
    const price = parseFloat(newExtraPrice.replace(',', '.')) || 0;
    const { data, error } = await supabase
      .from('item_extras')
      .insert({ item_id: editingItem.id, name: newExtraName.trim(), price })
      .select()
      .single();
    if (error) {
      Alert.alert('خطأ في حفظ الإضافة', error.message);
    } else if (data) {
      setExtras(prev => [...prev, data]);
      setNewExtraName('');
      setNewExtraPrice('');
    } else {
      Alert.alert('خطأ', 'لم يتم الحفظ، حاول مرة ثانية');
    }
    setSavingExtra(false);
  };

  const openEditExtras = async (itemId: string) => {
    const { data, error } = await supabase.from('item_extras').select('*').eq('item_id', itemId).order('created_at');
    if (error) Alert.alert('خطأ في تحميل الإضافات', error.message);
    setExtras(data || []);
  };

  const handleDeleteExtra = async (id: string) => {
    await supabase.from('item_extras').delete().eq('id', id);
    setExtras(prev => prev.filter(e => e.id !== id));
  };

  const toggleAvailable = async (item: Item) => {
    await supabase.from('items').update({ is_available: !item.is_available }).eq('id', item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    showMsg(item.is_available ? 'تم إخفاء الطبق' : '✓ تم إتاحة الطبق');
  };

  const deleteItem = async (id: string) => {
    Alert.alert('حذف الطبق', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await supabase.from('items').delete().eq('id', id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        showMsg('✓ تم الحذف');
      }},
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">

      {/* Edit Modal */}
      <Modal visible={!!editingItem} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-gray-800 rounded-t-3xl" style={{ maxHeight: '92%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-700">
              <TouchableOpacity onPress={() => setEditingItem(null)} className="bg-gray-700 px-4 py-2 rounded-xl">
                <Text className="text-gray-300 font-bold">إلغاء</Text>
              </TouchableOpacity>
              <Text className="text-white font-bold text-lg">✏️ تعديل الطبق</Text>
              <TouchableOpacity onPress={handleSaveEdit} disabled={saving} className="bg-orange-500 px-4 py-2 rounded-xl">
                <Text className="text-white font-bold">{saving ? '...' : 'حفظ'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text className="text-gray-400 text-xs text-right mb-2">القسم</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexDirection: 'row-reverse' }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setEditForm((p) => ({ ...p, category_id: cat.id }))}
                    className={`px-4 py-2 rounded-full mr-2 border ${editForm.category_id === cat.id ? 'bg-orange-500 border-orange-500' : 'bg-gray-700 border-gray-600'}`}
                  >
                    <Text className={`font-bold text-sm ${editForm.category_id === cat.id ? 'text-white' : 'text-gray-300'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <InputField label="اسم الطبق" value={editForm.name} onChangeText={(v: string) => setEditForm((p) => ({ ...p, name: v }))} placeholder="اسم الطبق" />
              <InputField label="الوصف" value={editForm.description} onChangeText={(v: string) => setEditForm((p) => ({ ...p, description: v }))} placeholder="وصف الطبق" />
              <InputField label="السعر (د.ع)" value={editForm.price} onChangeText={(v: string) => setEditForm((p) => ({ ...p, price: v }))} placeholder="السعر" keyboardType="decimal-pad" />
              <InputField label="رابط الصورة" value={editForm.image_url} onChangeText={(v: string) => setEditForm((p) => ({ ...p, image_url: v }))} placeholder="رابط الصورة (اختياري)" />

              {/* ── Extras Section ── */}
              <View className="mt-2 mb-3 border-t border-gray-700 pt-4">
                <Text className="text-white font-bold text-right text-base mb-3">🧂 الإضافات المقترحة</Text>

                {/* Current extras */}
                {extras.length === 0 ? (
                  <Text className="text-gray-500 text-right text-sm mb-3">لا توجد إضافات بعد</Text>
                ) : (
                  <View className="mb-3">
                    {extras.map(e => (
                      <View key={e.id} className="flex-row justify-between items-center bg-gray-900 rounded-xl px-4 py-3 mb-2 border border-gray-700">
                        <TouchableOpacity onPress={() => handleDeleteExtra(e.id)} className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
                          <Text className="text-red-400 text-xs font-bold">حذف</Text>
                        </TouchableOpacity>
                        <View className="items-end flex-1 mr-3">
                          <Text className="text-white font-bold text-sm">{e.name}</Text>
                          {e.price > 0 && <Text className="text-orange-400 text-xs mt-0.5">+{e.price.toLocaleString()} د.ع</Text>}
                          {e.price === 0 && <Text className="text-gray-500 text-xs mt-0.5">مجاني</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add new extra */}
                <View className="bg-gray-900 rounded-xl p-3 border border-gray-700 border-dashed">
                  <Text className="text-gray-400 text-xs text-right mb-2">إضافة جديدة</Text>
                  <TextInput
                    value={newExtraName}
                    onChangeText={setNewExtraName}
                    placeholder="اسم الإضافة (مثال: صوص، ببسي...)"
                    placeholderTextColor="#6b7280"
                    className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-right text-white mb-2"
                  />
                  <View className="flex-row gap-2">
                    <TextInput
                      value={newExtraPrice}
                      onChangeText={setNewExtraPrice}
                      placeholder="السعر (0 = مجاني)"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                      className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-right text-white flex-1"
                    />
                    <TouchableOpacity
                      onPress={handleAddExtra}
                      disabled={savingExtra || !newExtraName.trim()}
                      className={`px-5 rounded-xl items-center justify-center ${newExtraName.trim() ? 'bg-orange-500' : 'bg-gray-700'}`}
                    >
                      <Text className="text-white font-bold text-lg">{savingExtra ? '...' : '+'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.push('/(admin)/dashboard')} className="bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
          <Text className="text-gray-300 font-bold">← رجوع</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">🍴 تعديل المنيو</Text>
        <View className="w-20" />
      </View>

      {/* Toast */}
      {message && (
        <View className={`mx-4 mt-3 px-4 py-3 rounded-xl border ${message.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <Text className={`text-center font-bold ${message.success ? 'text-green-400' : 'text-red-400'}`}>{message.text}</Text>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row mx-4 mt-4 mb-4 bg-gray-800 rounded-2xl p-1">
        <TouchableOpacity onPress={() => setActiveTab('add')} className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'add' ? 'bg-orange-500' : ''}`}>
          <Text className={`font-bold ${activeTab === 'add' ? 'text-white' : 'text-gray-400'}`}>إضافة</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('list')} className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'list' ? 'bg-orange-500' : ''}`}>
          <Text className={`font-bold ${activeTab === 'list' ? 'text-white' : 'text-gray-400'}`}>القائمة ({items.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : activeTab === 'add' ? (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="bg-gray-800 rounded-2xl p-4 mb-4 border border-gray-700">
            <Text className="text-white font-bold text-right mb-3 text-base">➕ قسم جديد</Text>
            <InputField value={newCategory} onChangeText={setNewCategory} placeholder="اسم القسم" />
            <TouchableOpacity onPress={handleAddCategory} disabled={saving} className="bg-orange-500 py-3 rounded-xl items-center mt-1">
              <Text className="text-white font-bold">{saving ? 'جاري الحفظ...' : 'إضافة القسم'}</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <Text className="text-white font-bold text-right mb-4 text-base">🍽️ طبق جديد</Text>
            <Text className="text-gray-400 text-right mb-2 text-sm">اختر القسم</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexDirection: 'row-reverse' }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setForm((p) => ({ ...p, category_id: cat.id }))}
                  className={`px-4 py-2 rounded-full mr-2 border ${form.category_id === cat.id ? 'bg-orange-500 border-orange-500' : 'bg-gray-700 border-gray-600'}`}
                >
                  <Text className={`font-bold text-sm ${form.category_id === cat.id ? 'text-white' : 'text-gray-300'}`}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <InputField value={form.name} onChangeText={(v: string) => setForm((p) => ({ ...p, name: v }))} placeholder="اسم الطبق *" />
            <InputField value={form.description} onChangeText={(v: string) => setForm((p) => ({ ...p, description: v }))} placeholder="وصف الطبق" />
            <InputField value={form.price} onChangeText={(v: string) => setForm((p) => ({ ...p, price: v }))} placeholder="السعر * (د.ع)" keyboardType="decimal-pad" />
            <InputField value={form.image_url} onChangeText={(v: string) => setForm((p) => ({ ...p, image_url: v }))} placeholder="رابط الصورة (اختياري)" />
            <TouchableOpacity onPress={handleAddItem} disabled={saving} className="bg-orange-500 py-3.5 rounded-xl items-center mt-2">
              <Text className="text-white font-bold text-base">{saving ? 'جاري الحفظ...' : 'إضافة الطبق'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <View key={cat.id} className="mb-5">
                <View className="flex-row items-center justify-end mb-3">
                  <Text className="text-white font-bold text-lg">{cat.name}</Text>
                  <View className="bg-orange-500/20 border border-orange-500/30 px-2.5 py-0.5 rounded-full ml-2">
                    <Text className="text-orange-400 text-xs font-bold">{catItems.length}</Text>
                  </View>
                </View>

                {catItems.length === 0 ? (
                  <View className="bg-gray-800 rounded-xl p-4 border border-gray-700 border-dashed items-center">
                    <Text className="text-gray-500">لا توجد أطباق في هذا القسم</Text>
                  </View>
                ) : (
                  catItems.map((item) => (
                    <View key={item.id} className={`rounded-2xl mb-3 border overflow-hidden ${item.is_available ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/60 border-gray-700/50'}`}>
                      <View className="flex-row justify-between items-center p-4">
                        <View className="flex-row gap-2">
                          <TouchableOpacity onPress={() => deleteItem(item.id)} className="bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-lg">
                            <Text className="text-red-400 text-xs font-bold">حذف</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openEdit(item)} className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg">
                            <Text className="text-blue-400 text-xs font-bold">✏️ تعديل</Text>
                          </TouchableOpacity>
                        </View>
                        <View className="items-end flex-1 mr-3">
                          <Text className={`font-bold text-base ${item.is_available ? 'text-white' : 'text-gray-500'}`}>{item.name}</Text>
                          {item.description ? <Text className="text-gray-400 text-xs mt-0.5 text-right" numberOfLines={1}>{item.description}</Text> : null}
                          <Text className={`font-bold mt-1 ${item.is_available ? 'text-orange-400' : 'text-gray-500'}`}>{item.price.toLocaleString()} د.ع</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleAvailable(item)}
                        className={`mx-4 mb-4 py-2.5 rounded-xl items-center border ${item.is_available ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-700 border-gray-600'}`}
                      >
                        <Text className={`font-bold text-sm ${item.is_available ? 'text-green-400' : 'text-gray-400'}`}>
                          {item.is_available ? '● متاح للزبائن — اضغط للإخفاء' : '○ مخفي عن الزبائن — اضغط للإتاحة'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
