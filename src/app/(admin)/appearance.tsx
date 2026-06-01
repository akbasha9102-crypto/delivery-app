import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../context/ThemeContext';
import { AnimatedButton } from '../../components/animated-button';
import { StaggerItem } from '../../components/stagger-item';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const PRESET_COLORS = [
  '#e67e22', '#e74c3c', '#3498db', '#2ecc71',
  '#9b59b6', '#1abc9c', '#f39c12', '#2c3e50',
];

type Settings = {
  id: string;
  restaurant_name: string;
  primary_color: string;
  logo_url: string | null;
};

export default function AppearanceScreen() {
  const { dark } = useDarkMode();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#e67e22');
  const [customColor, setCustomColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const c = {
    bg: dark ? '#111827' : '#f9fafb',
    surface: dark ? '#1f2937' : '#ffffff',
    border: dark ? '#374151' : '#e5e7eb',
    text: dark ? '#f9fafb' : '#111827',
    subtext: dark ? '#9ca3af' : '#6b7280',
    inputBg: dark ? '#111827' : '#f9fafb',
    label: dark ? '#d1d5db' : '#374151',
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .limit(1)
      .single();
    if (error) {
      Alert.alert('خطأ', 'تعذّر تحميل الإعدادات');
    } else if (data) {
      setSettings(data);
      setName(data.restaurant_name);
      setColor(data.primary_color);
      setCustomColor(data.primary_color);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchSettings(); }, []));

  const save = async () => {
    const finalColor = customColor.startsWith('#') && customColor.length >= 4
      ? customColor
      : color;

    if (!name.trim()) {
      Alert.alert('تنبيه', 'اسم المطعم مطلوب');
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      restaurant_name: name.trim(),
      primary_color: finalColor,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (settings?.id) {
      ({ error } = await supabase
        .from('restaurant_settings')
        .update(payload)
        .eq('id', settings.id));
    } else {
      ({ error } = await supabase
        .from('restaurant_settings')
        .insert(payload));
    }

    if (error) {
      setMessage({ text: 'حدث خطأ أثناء الحفظ', ok: false });
    } else {
      setMessage({ text: '✓ تم حفظ الإعدادات', ok: true });
      await fetchSettings();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={color} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

        {/* Header */}
        <StaggerItem index={0}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: c.text, textAlign: 'right' }}>
            إعدادات المظهر
          </Text>
          <Text style={{ fontSize: 13, color: c.subtext, textAlign: 'right', marginTop: 4 }}>
            تحكّم في اسم المطعم ولونه الأساسي
          </Text>
        </StaggerItem>

        {/* Restaurant Name */}
        <StaggerItem index={1}>
          <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.label, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 8 }}>
              اسم المطعم
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="مثال: CulinaShare"
              placeholderTextColor={c.subtext}
              style={{
                backgroundColor: c.inputBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: c.border,
                padding: 12,
                color: c.text,
                fontSize: 15,
                textAlign: 'right',
              }}
            />
          </View>
        </StaggerItem>

        {/* Color Picker */}
        <StaggerItem index={2}>
          <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.label, fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 12 }}>
              اللون الأساسي
            </Text>

            {/* Preset colors */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', marginBottom: 14 }}>
              {PRESET_COLORS.map(pc => (
                <Pressable
                  key={pc}
                  onPress={() => { setColor(pc); setCustomColor(pc); }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: pc,
                    borderWidth: color === pc ? 3 : 1.5,
                    borderColor: color === pc ? c.text : 'transparent',
                  }}
                />
              ))}
            </View>

            {/* Preview */}
            <View style={{
              backgroundColor: customColor.startsWith('#') && customColor.length >= 4 ? customColor : color,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                معاينة اللون
              </Text>
            </View>

            {/* Custom hex input */}
            <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'right', marginBottom: 6 }}>
              أو أدخل كود لون مخصص (HEX)
            </Text>
            <TextInput
              value={customColor}
              onChangeText={v => { setCustomColor(v); if (v.startsWith('#') && v.length >= 4) setColor(v); }}
              placeholder="#e67e22"
              placeholderTextColor={c.subtext}
              autoCapitalize="none"
              style={{
                backgroundColor: c.inputBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: c.border,
                padding: 12,
                color: c.text,
                fontSize: 15,
                textAlign: 'right',
              }}
            />
          </View>
        </StaggerItem>

        {/* Message */}
        {message && (
          <StaggerItem index={3}>
            <View style={{
              backgroundColor: message.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: message.ok ? '#22c55e' : '#ef4444',
            }}>
              <Text style={{ color: message.ok ? '#22c55e' : '#ef4444', textAlign: 'center', fontWeight: '600' }}>
                {message.text}
              </Text>
            </View>
          </StaggerItem>
        )}

        {/* Save Button */}
        <StaggerItem index={4}>
          <AnimatedButton onPress={save} disabled={saving}>
            <View style={{
              backgroundColor: color,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Text>
            </View>
          </AnimatedButton>
        </StaggerItem>

      </ScrollView>
    </SafeAreaView>
  );
}
