import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('خطأ', error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <View className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Text className="text-3xl font-bold text-primary mb-2 text-center">CulinaShare</Text>
        <Text className="text-gray-500 text-center mb-8">تسجيل الدخول لإدارة أو طلب الوجبات</Text>
        
        <View className="mb-4">
          <Text className="text-gray-700 font-bold mb-2">البريد الإلكتروني</Text>
          <TextInput
            className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-right"
            placeholder="admin@admin.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-bold mb-2">كلمة المرور</Text>
          <TextInput
            className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-right"
            placeholder="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-primary py-4 rounded-xl items-center justify-center"
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">تسجيل الدخول</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
