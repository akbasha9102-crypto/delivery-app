import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { useDarkMode } from '../../context/ThemeContext';
import { StaggerItem } from '../../components/stagger-item';

const PHONE_STORAGE_KEY = 'deliveryPhone';

export default function CartScreen() {
  const { dark } = useDarkMode();
  const { items, removeItem, clearCart, total } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const c = {
    bg: dark ? '#0f172a' : '#f3f4f6',
    header: dark ? '#1e293b' : '#ffffff',
    card: dark ? '#1e293b' : '#ffffff',
    cardBorder: dark ? '#334155' : '#f1f5f9',
    text: dark ? '#f1f5f9' : '#111827',
    subtext: dark ? '#94a3b8' : '#6b7280',
    input: dark ? '#0f172a' : '#ffffff',
    inputBorder: dark ? '#334155' : '#e5e7eb',
    placeholder: dark ? '#64748b' : '#9ca3af',
    summary: dark ? '#1c1917' : '#fff7ed',
    modalBg: dark ? '#1e293b' : '#ffffff',
  };

  useEffect(() => {
    AsyncStorage.getItem(PHONE_STORAGE_KEY).then(v => { if (v) setPhone(v); });
  }, []);

  const submitOrder = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await AsyncStorage.setItem(PHONE_STORAGE_KEY, phone.trim());

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          client_name: name.trim(),
          client_phone: phone.trim(),
          delivery_address: address.trim() || null,
          client_note: note.trim() || null,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (error || !order) throw error;

      const orderItemsData = items.map(i => ({
        order_id: order.id,
        item_id: i.id,
        item_name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
      if (itemsError) throw itemsError;

      Alert.alert('✅ تم إرسال الطلب', 'سيتم التواصل معك قريباً');
      clearCart();
      setName(''); setAddress(''); setNote('');
    } catch {
      Alert.alert('حدث خطأ', 'تأكد من الاتصال بالإنترنت وحاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    if (items.length === 0) {
      Alert.alert('السلة فارغة');
      return;
    }
    setShowModal(true);
  };

  const inputStyle = {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, textAlign: 'right' as const,
    fontSize: 15, backgroundColor: c.input, color: c.text, marginBottom: 12,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Confirmation Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: c.modalBg, borderRadius: 22, padding: 28, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#944a00', marginBottom: 8 }}>تأكيد رقم الهاتف</Text>
            <Text style={{ textAlign: 'center', color: c.subtext, marginBottom: 20 }}>تأكد أن رقم هاتفك صحيح قبل إرسال الطلب</Text>

            <View style={{ backgroundColor: c.summary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, marginBottom: 24, borderWidth: 1.5, borderColor: '#e67e22', width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: c.subtext, marginBottom: 4 }}>رقم هاتفك</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#e67e22', letterSpacing: 2 }}>{phone.trim()}</Text>
            </View>

            <TouchableOpacity
              onPress={submitOrder}
              style={{ backgroundColor: '#e67e22', paddingVertical: 14, borderRadius: 14, alignItems: 'center', width: '100%', marginBottom: 10 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>نعم، الرقم صحيح — أرسل الطلب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{ paddingVertical: 13, borderRadius: 14, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: c.inputBorder }}
            >
              <Text style={{ color: c.subtext, fontWeight: '600', fontSize: 15 }}>تعديل الرقم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <StaggerItem index={0}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: c.header, borderBottomWidth: 1, borderBottomColor: c.cardBorder, elevation: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#944a00' }}>سلة المشتريات</Text>
        </View>
      </StaggerItem>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <StaggerItem index={1}>
        {items.length === 0 ? (
          <Text style={{ textAlign: 'center', color: c.subtext, marginTop: 80, fontSize: 16 }}>السلة فارغة</Text>
        ) : (
          items.map(item => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: c.cardBorder }}>
              <TouchableOpacity
                style={{ backgroundColor: dark ? '#450a0a' : '#fee2e2', padding: 10, borderRadius: 50 }}
                onPress={() => removeItem(item.id)}
              >
                <Text>🗑️</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'right', color: c.text }}>{item.name}</Text>
                  <Text style={{ color: '#e67e22', textAlign: 'right' }}>{item.price.toLocaleString()} د.ع</Text>
                </View>
                <View style={{ backgroundColor: dark ? '#334155' : '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: c.text }}>{item.quantity}x</Text>
                </View>
              </View>
            </View>
          ))
        )}
        </StaggerItem>

        <StaggerItem index={2}>
          <View style={{ backgroundColor: c.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: c.cardBorder, marginTop: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', textAlign: 'right', color: c.text, marginBottom: 12 }}>معلومات الطلب</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="الاسم"
              placeholderTextColor={c.placeholder} style={inputStyle}
            />
            <TextInput
              value={phone} onChangeText={setPhone} placeholder="رقم الهاتف"
              placeholderTextColor={c.placeholder} keyboardType="phone-pad" style={inputStyle}
            />
            <TextInput
              value={address} onChangeText={setAddress} placeholder="العنوان"
              placeholderTextColor={c.placeholder} style={inputStyle}
            />
            <TextInput
              value={note} onChangeText={setNote} placeholder="ملاحظات (اختياري)"
              placeholderTextColor={c.placeholder} style={{ ...inputStyle, marginBottom: 0 }}
            />
          </View>
        </StaggerItem>

        <StaggerItem index={3}>
          <View style={{ backgroundColor: c.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: c.cardBorder, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.cardBorder, paddingTop: 8, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#e67e22' }}>{total.toLocaleString()} د.ع</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: c.text }}>الإجمالي</Text>
            </View>
          </View>

          <Pressable
            onPress={handleConfirmOrder}
            disabled={loading}
            style={({ pressed }) => ({
              width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
              marginTop: 20, marginBottom: 8,
              backgroundColor: loading ? '#9ca3af' : '#e67e22',
              transform: [{ scale: pressed && !loading ? 0.97 : 1 }],
            })}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>
              {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
            </Text>
          </Pressable>
        </StaggerItem>
      </ScrollView>
    </SafeAreaView>
  );
}
