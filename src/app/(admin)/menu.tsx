import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../context/ThemeContext';
import { AnimatedButton } from '../../components/animated-button';
import { StaggerItem } from '../../components/stagger-item';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x200.png?text=Food';

type Category = { id: string; name: string };
type Item = { id: string; category_id: string; name: string; description: string; price: number; image_url: string; is_available: boolean; extras_json?: string };
type Extra = { id: string; name: string; price: number };

export default function AdminMenuScreen() {
  const router = useRouter();
  const { dark } = useDarkMode();

  const c = {
    bg: dark ? '#111827' : '#f9fafb',
    surface: dark ? '#1f2937' : '#ffffff',
    surface2: dark ? '#374151' : '#f3f4f6',
    border: dark ? '#374151' : '#e5e7eb',
    border2: dark ? '#4b5563' : '#d1d5db',
    text: dark ? '#f9fafb' : '#111827',
    subtext: dark ? '#9ca3af' : '#6b7280',
    muted: dark ? '#6b7280' : '#9ca3af',
    inputBg: dark ? '#111827' : '#f9fafb',
    modalBg: dark ? '#1f2937' : '#ffffff',
    modalHeader: dark ? '#374151' : '#f3f4f6',
    placeholderColor: dark ? '#6b7280' : '#9ca3af',
  };

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
    try { setExtras(JSON.parse(item.extras_json || '[]')); } catch { setExtras([]); }
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

  const saveExtras = async (updated: Extra[]) => {
    if (!editingItem) return;
    const { error } = await supabase
      .from('items')
      .update({ extras_json: JSON.stringify(updated) })
      .eq('id', editingItem.id);
    if (error) Alert.alert('خطأ في الحفظ', error.message);
    else setExtras(updated);
  };

  const handleAddExtra = async () => {
    if (!editingItem || !newExtraName.trim()) return;
    setSavingExtra(true);
    const price = parseFloat(newExtraPrice.replace(',', '.')) || 0;
    const newExtra: Extra = { id: Date.now().toString(), name: newExtraName.trim(), price };
    await saveExtras([...extras, newExtra]);
    setNewExtraName('');
    setNewExtraPrice('');
    setSavingExtra(false);
  };

  const handleDeleteExtra = async (id: string) => {
    await saveExtras(extras.filter(e => e.id !== id));
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>

      {/* Edit Modal */}
      <Modal visible={!!editingItem} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.border }}>
              <AnimatedButton
                onPress={() => setEditingItem(null)}
                style={{ backgroundColor: c.surface2, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
              >
                <Text style={{ color: c.subtext, fontWeight: 'bold' }}>إلغاء</Text>
              </AnimatedButton>
              <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 17 }}>✏️ تعديل الطبق</Text>
              <AnimatedButton
                onPress={handleSaveEdit}
                disabled={saving}
                style={{ backgroundColor: '#f97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? '...' : 'حفظ'}</Text>
              </AnimatedButton>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'right', marginBottom: 8 }}>القسم</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexDirection: 'row-reverse' }}>
                {categories.map((cat) => (
                  <AnimatedButton
                    key={cat.id}
                    onPress={() => setEditForm((p) => ({ ...p, category_id: cat.id }))}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                      backgroundColor: editForm.category_id === cat.id ? '#f97316' : c.surface2,
                      borderWidth: 1, borderColor: editForm.category_id === cat.id ? '#f97316' : c.border2,
                    }}
                  >
                    <Text style={{ color: editForm.category_id === cat.id ? 'white' : c.subtext, fontWeight: 'bold', fontSize: 13 }}>{cat.name}</Text>
                  </AnimatedButton>
                ))}
              </ScrollView>

              <InputField dark={dark} c={c} label="اسم الطبق" value={editForm.name} onChangeText={(v: string) => setEditForm((p) => ({ ...p, name: v }))} placeholder="اسم الطبق" />
              <InputField dark={dark} c={c} label="الوصف" value={editForm.description} onChangeText={(v: string) => setEditForm((p) => ({ ...p, description: v }))} placeholder="وصف الطبق" />
              <InputField dark={dark} c={c} label="السعر (د.ع)" value={editForm.price} onChangeText={(v: string) => setEditForm((p) => ({ ...p, price: v }))} placeholder="السعر" keyboardType="decimal-pad" />
              <InputField dark={dark} c={c} label="رابط الصورة" value={editForm.image_url} onChangeText={(v: string) => setEditForm((p) => ({ ...p, image_url: v }))} placeholder="رابط الصورة (اختياري)" />

              {/* Extras */}
              <View style={{ marginTop: 8, marginBottom: 12, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 }}>
                <Text style={{ color: c.text, fontWeight: 'bold', textAlign: 'right', fontSize: 15, marginBottom: 12 }}>🧂 الإضافات المقترحة</Text>
                {extras.length === 0 ? (
                  <Text style={{ color: c.muted, textAlign: 'right', fontSize: 13, marginBottom: 12 }}>لا توجد إضافات بعد</Text>
                ) : (
                  <View style={{ marginBottom: 12 }}>
                    {extras.map(e => (
                      <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
                        <AnimatedButton
                          onPress={() => handleDeleteExtra(e.id)}
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>حذف</Text>
                        </AnimatedButton>
                        <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
                          <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 13 }}>{e.name}</Text>
                          {e.price > 0 && <Text style={{ color: '#f97316', fontSize: 12, marginTop: 2 }}>+{e.price.toLocaleString()} د.ع</Text>}
                          {e.price === 0 && <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>مجاني</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ backgroundColor: c.inputBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border2, borderStyle: 'dashed' }}>
                  <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'right', marginBottom: 8 }}>إضافة جديدة</Text>
                  <TextInput
                    value={newExtraName}
                    onChangeText={setNewExtraName}
                    placeholder="اسم الإضافة (مثال: صوص، ببسي...)"
                    placeholderTextColor={c.placeholderColor}
                    style={{ backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', color: c.text, marginBottom: 8 }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      value={newExtraPrice}
                      onChangeText={setNewExtraPrice}
                      placeholder="السعر (0 = مجاني)"
                      placeholderTextColor={c.placeholderColor}
                      keyboardType="decimal-pad"
                      style={{ backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', color: c.text, flex: 1 }}
                    />
                    <AnimatedButton
                      onPress={handleAddExtra}
                      disabled={savingExtra || !newExtraName.trim()}
                      style={{ paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: newExtraName.trim() ? '#f97316' : c.surface2 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{savingExtra ? '...' : '+'}</Text>
                    </AnimatedButton>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <StaggerItem index={0}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface }}>
        <AnimatedButton
          onPress={() => router.push('/(admin)/dashboard')}
          style={{ backgroundColor: c.surface2, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ color: c.subtext, fontWeight: 'bold' }}>← رجوع</Text>
        </AnimatedButton>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: 'bold' }}>🍴 تعديل المنيو</Text>
        <View style={{ width: 80 }} />
      </View>
      </StaggerItem>

      {/* Toast */}
      {message && (
        <View style={{ marginHorizontal: 16, marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: message.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderColor: message.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: message.success ? '#22c55e' : '#ef4444' }}>{message.text}</Text>
        </View>
      )}

      {/* Tabs */}
      <StaggerItem index={1}>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: c.surface2, borderRadius: 16, padding: 4 }}>
        <AnimatedButton onPress={() => setActiveTab('add')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: activeTab === 'add' ? '#f97316' : 'transparent' }}>
          <Text style={{ fontWeight: 'bold', color: activeTab === 'add' ? 'white' : c.subtext }}>إضافة</Text>
        </AnimatedButton>
        <AnimatedButton onPress={() => setActiveTab('list')} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: activeTab === 'list' ? '#f97316' : 'transparent' }}>
          <Text style={{ fontWeight: 'bold', color: activeTab === 'list' ? 'white' : c.subtext }}>القائمة ({items.length})</Text>
        </AnimatedButton>
      </View>
      </StaggerItem>

      <StaggerItem index={2} style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : activeTab === 'add' ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Add Category */}
          <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontWeight: 'bold', textAlign: 'right', marginBottom: 12, fontSize: 15 }}>➕ قسم جديد</Text>
            <InputField dark={dark} c={c} value={newCategory} onChangeText={setNewCategory} placeholder="اسم القسم" />
            <AnimatedButton
              onPress={handleAddCategory}
              disabled={saving}
              style={{ backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? 'جاري الحفظ...' : 'إضافة القسم'}</Text>
            </AnimatedButton>
          </View>

          {/* Add Item */}
          <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, fontSize: 15 }}>🍽️ طبق جديد</Text>
            <Text style={{ color: c.subtext, textAlign: 'right', marginBottom: 8, fontSize: 13 }}>اختر القسم</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexDirection: 'row-reverse' }}>
              {categories.map((cat) => (
                <AnimatedButton
                  key={cat.id}
                  onPress={() => setForm((p) => ({ ...p, category_id: cat.id }))}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                    backgroundColor: form.category_id === cat.id ? '#f97316' : c.surface2,
                    borderWidth: 1, borderColor: form.category_id === cat.id ? '#f97316' : c.border2,
                  }}
                >
                  <Text style={{ color: form.category_id === cat.id ? 'white' : c.subtext, fontWeight: 'bold', fontSize: 13 }}>{cat.name}</Text>
                </AnimatedButton>
              ))}
            </ScrollView>
            <InputField dark={dark} c={c} value={form.name} onChangeText={(v: string) => setForm((p) => ({ ...p, name: v }))} placeholder="اسم الطبق *" />
            <InputField dark={dark} c={c} value={form.description} onChangeText={(v: string) => setForm((p) => ({ ...p, description: v }))} placeholder="وصف الطبق" />
            <InputField dark={dark} c={c} value={form.price} onChangeText={(v: string) => setForm((p) => ({ ...p, price: v }))} placeholder="السعر * (د.ع)" keyboardType="decimal-pad" />
            <InputField dark={dark} c={c} value={form.image_url} onChangeText={(v: string) => setForm((p) => ({ ...p, image_url: v }))} placeholder="رابط الصورة (اختياري)" />
            <AnimatedButton
              onPress={handleAddItem}
              disabled={saving}
              style={{ backgroundColor: '#f97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{saving ? 'جاري الحفظ...' : 'إضافة الطبق'}</Text>
            </AnimatedButton>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <View key={cat.id} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <Text style={{ color: c.text, fontWeight: 'bold', fontSize: 17 }}>{cat.name}</Text>
                  <View style={{ backgroundColor: 'rgba(249,115,22,0.15)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, marginLeft: 8 }}>
                    <Text style={{ color: '#f97316', fontSize: 12, fontWeight: 'bold' }}>{catItems.length}</Text>
                  </View>
                </View>

                {catItems.length === 0 ? (
                  <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
                    <Text style={{ color: c.muted }}>لا توجد أطباق في هذا القسم</Text>
                  </View>
                ) : (
                  catItems.map((item) => (
                    <View key={item.id} style={{ borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden', backgroundColor: item.is_available ? c.surface : (dark ? 'rgba(31,41,55,0.6)' : 'rgba(249,250,251,0.6)'), borderColor: item.is_available ? c.border : c.border2 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <AnimatedButton
                            onPress={() => deleteItem(item.id)}
                            style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                          >
                            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>حذف</Text>
                          </AnimatedButton>
                          <AnimatedButton
                            onPress={() => openEdit(item)}
                            style={{ backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                          >
                            <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: 'bold' }}>✏️ تعديل</Text>
                          </AnimatedButton>
                        </View>
                        <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 15, color: item.is_available ? c.text : c.muted }}>{item.name}</Text>
                          {item.description ? <Text style={{ color: c.subtext, fontSize: 12, marginTop: 2, textAlign: 'right' }} numberOfLines={1}>{item.description}</Text> : null}
                          <Text style={{ fontWeight: 'bold', marginTop: 4, color: item.is_available ? '#f97316' : c.muted }}>{item.price.toLocaleString()} د.ع</Text>
                        </View>
                      </View>
                      <AnimatedButton
                        onPress={() => toggleAvailable(item)}
                        style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, backgroundColor: item.is_available ? 'rgba(34,197,94,0.1)' : c.surface2, borderColor: item.is_available ? 'rgba(34,197,94,0.3)' : c.border }}
                      >
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: item.is_available ? '#22c55e' : c.subtext }}>
                          {item.is_available ? '● متاح للزبائن — اضغط للإخفاء' : '○ مخفي عن الزبائن — اضغط للإتاحة'}
                        </Text>
                      </AnimatedButton>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
      </StaggerItem>
    </SafeAreaView>
  );
}

function InputField({ dark, c, label, value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label && <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.placeholderColor}
        keyboardType={keyboardType}
        style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right', color: c.text }}
      />
    </View>
  );
}
