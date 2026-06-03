import { useEffect, useState, useCallback } from 'react';
import { Text, View, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../context/ThemeContext';

type Order = {
  id: string;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
};

export default function DashboardScreen() {
  const { dark, toggleDark } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);

  const bg      = dark ? '#0f172a' : '#f8fafc';
  const surface = dark ? '#1e293b' : '#ffffff';
  const border  = dark ? '#334155' : '#e2e8f0';
  const text    = dark ? '#f1f5f9' : '#0f172a';
  const muted   = dark ? '#475569' : '#e2e8f0';

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('id, total_amount, status, created_at');
    if (data) setOrders(data);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const today = new Date().toDateString();
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const todayTotal = orders
    .filter(o => o.status === 'completed' && new Date(o.created_at).toDateString() === today)
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surface, borderBottomWidth: 1, borderBottomColor: border }}>
        <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14 }}>خروج</Text>
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 17, fontWeight: 'bold' }}>الإحصاء</Text>
        <Pressable onPress={toggleDark} style={{ backgroundColor: muted, borderRadius: 20, padding: 8 }}>
          <Text style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', padding: 14, gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: dark ? 'rgba(156,163,175,0.12)' : 'rgba(156,163,175,0.08)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#9ca3af30' }}>
          <Text style={{ color: '#9ca3af', fontSize: 28, fontWeight: 'bold' }}>{completedCount}</Text>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4, opacity: 0.8 }}>مكتمل</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: dark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f9731630' }}>
          <Text style={{ color: '#f97316', fontSize: 20, fontWeight: 'bold' }}>{todayTotal.toLocaleString()}</Text>
          <Text style={{ color: '#f97316', fontSize: 13, marginTop: 4, opacity: 0.8 }}>إيراد اليوم</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}
