import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDarkMode } from '@/context/ThemeContext';
import { AnimatedTabBarButton } from '@/components/animated-tab-bar-button';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

function makeBellWavUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sr = 22050;
    const dur = 0.9;
    const n = (sr * dur) | 0;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true);
    ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const hz = t < 0.42 ? 880 : 587;
      const env = t < 0.42 ? Math.exp(-t * 4) : Math.exp(-(t - 0.42) * 4);
      v.setInt16(44 + i * 2, (Math.sin(2 * Math.PI * hz * t) * env * 0.4 * 32767) | 0, true);
    }
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  } catch { return null; }
}

export default function AdminLayout() {
  const { dark, loaded } = useDarkMode();

  const bellRef = useRef<HTMLAudioElement | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = makeBellWavUrl();
    if (!url) return;
    bellRef.current = new Audio(url);
    bellRef.current.volume = 0.8;
    const unlock = () => {
      if (!bellRef.current) return;
      bellRef.current.play().then(() => {
        bellRef.current!.pause();
        bellRef.current!.currentTime = 0;
      }).catch(() => {});
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    // mark initial load done after short delay so first fetch doesn't trigger sound
    const t = setTimeout(() => { initialLoadDone.current = true; }, 3000);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-layout-orders-sound')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        if (!initialLoadDone.current) return;
        if (bellRef.current) {
          bellRef.current.currentTime = 0;
          bellRef.current.play().catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const bg = dark ? '#0f172a' : '#f1f5f9';
  const tabBarBg = dark ? '#1a1a1a' : '#ffffff';
  const borderColor = dark ? '#2a2a2a' : '#e5e7eb';
  const inactiveColor = dark ? '#888888' : '#8e8e93';

  if (!loaded) return <View style={{ flex: 1, backgroundColor: bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#f97316',
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
          sceneStyle: { backgroundColor: bg },
        }}
      >
        <Tabs.Screen
          name="orders"
          options={{
            title: 'الطلبات',
            tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'الإحصاء',
            tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'المنيو',
            tabBarIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appearance"
          options={{
            title: 'المظهر',
            tabBarIcon: ({ color }) => <MaterialIcons name="palette" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
