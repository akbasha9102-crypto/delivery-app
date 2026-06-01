import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

interface Props {
  status: OrderStatus;
  dark: boolean;
}

/* ── Steam wisp ── */
function Steam({ delay, left }: { delay: number; left: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, -28] });
  const opacity    = a.interpolate({ inputRange: [0, 0.15, 0.65, 1], outputRange: [0, 0.9, 0.5, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left, top: 0,
      width: 5, height: 14, borderRadius: 3,
      backgroundColor: '#cbd5e1',
      opacity, transform: [{ translateY }],
    }} />
  );
}

/* ── Flame ── */
function Flame({ delay, left, h = 28, w = 16 }: { delay: number; left: number; h?: number; w?: number }) {
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(sc, { toValue: 0.72, duration: 170, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 1.12, duration: 280, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 0.88, duration: 150, useNativeDriver: true }),
        Animated.timing(sc, { toValue: 1,    duration: 230, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', left, bottom: 0, width: w, height: h, transform: [{ scale: sc }] }}>
      <View style={{ position: 'absolute', bottom: 0, width: w, height: h, borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: '#f97316' }} />
      <View style={{ position: 'absolute', bottom: 2, left: (w - w * 0.54) / 2, width: w * 0.54, height: h * 0.52, borderTopLeftRadius: w * 0.27, borderTopRightRadius: w * 0.27, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: '#fde047' }} />
    </Animated.View>
  );
}

/* ── Wheel ── */
function Wheel({ size, dark }: { size: number; dark: boolean }) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 650, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const tire = dark ? '#334155' : '#1f2937';
  const rim  = dark ? '#64748b' : '#4b5563';
  const spk  = dark ? '#94a3b8' : '#9ca3af';
  const inner = size - 12;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tire, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: rim }}>
      <Animated.View style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center', transform: [{ rotate }] }}>
        <View style={{ position: 'absolute', width: inner - 4, height: 2.5, backgroundColor: spk, borderRadius: 1 }} />
        <View style={{ position: 'absolute', width: inner - 4, height: 2.5, backgroundColor: spk, borderRadius: 1, transform: [{ rotate: '60deg' }] }} />
        <View style={{ position: 'absolute', width: inner - 4, height: 2.5, backgroundColor: spk, borderRadius: 1, transform: [{ rotate: '120deg' }] }} />
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: rim }} />
      </Animated.View>
    </View>
  );
}

/* ── Speed line ── */
function SpeedLine({ top, width, delay, left }: { top: number; width: number; delay: number; left: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 380, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(Math.max(0, 420 - delay)),
      ])
    ).start();
  }, []);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const opacity    = a.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.85, 0.6, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', top, left,
      width, height: 3, borderRadius: 1.5,
      backgroundColor: '#e67e22',
      opacity, transform: [{ translateX }],
    }} />
  );
}

/* ════════════════════════════════════════
   COOKING POT  (preparing)
════════════════════════════════════════ */
function CookingPotAnimation({ dark }: { dark: boolean }) {
  const lidY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lidY, { toValue: -5, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(lidY, { toValue: 0,  duration: 300, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.delay(700),
      ])
    ).start();
  }, []);

  const potC  = dark ? '#475569' : '#64748b';
  const lidC  = dark ? '#334155' : '#475569';
  const baseC = dark ? '#1e293b' : '#334155';

  return (
    <View style={{ width: 152, height: 158 }}>
      {/* Steam (above lid, inside top 28px of container) */}
      <Steam delay={0}   left={53} />
      <Steam delay={500} left={71} />
      <Steam delay={250} left={90} />

      {/* Lid – bounces */}
      <Animated.View style={{ position: 'absolute', top: 30, left: 27, transform: [{ translateY: lidY }] }}>
        <View style={{ alignSelf: 'center', width: 16, height: 10, backgroundColor: lidC, borderRadius: 5, marginBottom: 1 }} />
        <View style={{ width: 98, height: 14, backgroundColor: lidC, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
      </Animated.View>

      {/* Pot body */}
      <View style={{ position: 'absolute', top: 54, left: 30, width: 92, height: 56, backgroundColor: potC, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        {/* Food colour visible at rim */}
        <View style={{ position: 'absolute', top: 0, left: 2, right: 2, height: 13, backgroundColor: '#f59e0b' }} />
        {/* Shine */}
        <View style={{ position: 'absolute', top: 15, left: 8, width: 22, height: 6, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 3 }} />
      </View>

      {/* Left handle */}
      <View style={{ position: 'absolute', top: 63, left: 13, width: 19, height: 22, backgroundColor: lidC, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 3, borderBottomRightRadius: 3 }} />
      {/* Right handle */}
      <View style={{ position: 'absolute', top: 63, right: 13, width: 19, height: 22, backgroundColor: lidC, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }} />

      {/* Stove grate */}
      <View style={{ position: 'absolute', top: 115, left: 20, right: 20, height: 8, backgroundColor: baseC, borderRadius: 4 }} />

      {/* Flames */}
      <View style={{ position: 'absolute', top: 89 }}>
        <Flame delay={0}   left={32}  h={26} w={15} />
        <Flame delay={160} left={60}  h={33} w={19} />
        <Flame delay={80}  left={92}  h={25} w={14} />
      </View>
    </View>
  );
}

/* ════════════════════════════════════════
   MOTORCYCLE  (ready / on the way)
════════════════════════════════════════ */
function MotorcycleAnimation({ dark }: { dark: boolean }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -3, duration: 230, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(bounce, { toValue: 0,  duration: 230, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      ])
    ).start();
  }, []);

  const bodyC   = dark ? '#334155' : '#475569';
  const seatC   = dark ? '#1e293b' : '#1f2937';
  const accentC = '#e67e22';
  const skinC   = '#fbbf24';
  const WH = 44;

  return (
    <View style={{ width: 168, height: 128 }}>
      {/* Speed lines */}
      <SpeedLine top={54} width={28} delay={0}   left={2} />
      <SpeedLine top={67} width={18} delay={180} left={0} />
      <SpeedLine top={80} width={32} delay={80}  left={4} />

      {/* Everything except speed lines bounces */}
      <Animated.View style={{ position: 'absolute', transform: [{ translateY: bounce }] }}>
        {/* Rider head */}
        <View style={{ position: 'absolute', top: 8,  left: 86, width: 22, height: 22, borderRadius: 11, backgroundColor: skinC }} />
        {/* Helmet visor */}
        <View style={{ position: 'absolute', top: 14, left: 87, width: 19, height: 9,  backgroundColor: '#1e293b', borderRadius: 4 }} />
        {/* Rider torso (leaning forward) */}
        <View style={{ position: 'absolute', top: 28, left: 77, width: 24, height: 28, backgroundColor: accentC, borderRadius: 6, transform: [{ rotate: '-18deg' }] }} />
        {/* Arm to handlebar */}
        <View style={{ position: 'absolute', top: 40, left: 98, width: 22, height: 7, backgroundColor: skinC, borderRadius: 3, transform: [{ rotate: '-15deg' }] }} />

        {/* Main body */}
        <View style={{ position: 'absolute', top: 62, left: 30, width: 96, height: 24, backgroundColor: bodyC, borderRadius: 10 }}>
          <View style={{ position: 'absolute', top: 7, left: 10, right: 10, height: 4, backgroundColor: accentC, borderRadius: 2 }} />
        </View>

        {/* Seat */}
        <View style={{ position: 'absolute', top: 54, left: 54, width: 50, height: 12, backgroundColor: seatC, borderRadius: 7 }} />

        {/* Front fairing + headlight */}
        <View style={{ position: 'absolute', top: 50, left: 110, width: 28, height: 38, backgroundColor: accentC, borderTopRightRadius: 14, borderBottomRightRadius: 6, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }}>
          <View style={{ position: 'absolute', top: 9, right: 5, width: 10, height: 7, backgroundColor: '#fde047', borderRadius: 3 }} />
        </View>

        {/* Exhaust pipe */}
        <View style={{ position: 'absolute', top: 84, left: 22, width: 30, height: 5, backgroundColor: dark ? '#64748b' : '#9ca3af', borderRadius: 3 }} />

        {/* Rear wheel */}
        <View style={{ position: 'absolute', top: 74, left: 8 }}>
          <Wheel size={WH} dark={dark} />
        </View>

        {/* Front wheel */}
        <View style={{ position: 'absolute', top: 74, left: 108 }}>
          <Wheel size={WH} dark={dark} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ════════════════════════════════════════
   PENDING  (order received, waiting)
════════════════════════════════════════ */
function PendingAnimation({ dark }: { dark: boolean }) {
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.delay(Math.max(0, 960 - delay)),
      ]);
    Animated.loop(Animated.parallel([make(d0, 0), make(d1, 220), make(d2, 440)])).start();
  }, []);

  const cardC   = dark ? '#1e293b' : '#fff7ed';
  const borderC = dark ? '#475569' : '#fed7aa';
  const lineC   = dark ? '#334155' : '#fde8c4';

  const dotStyle = (d: Animated.Value) => ({
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: '#e67e22' as const,
    transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.35] }) }],
    opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
  });

  return (
    <View style={{ width: 135, height: 135, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 82, height: 104, backgroundColor: cardC, borderRadius: 12, borderWidth: 2, borderColor: borderC, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
        {[78, 58, 70, 52, 65].map((w, i) => (
          <View key={i} style={{ width: `${w}%` as any, height: 5, backgroundColor: lineC, borderRadius: 3, marginTop: i === 0 ? 0 : 7 }} />
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Animated.View style={dotStyle(d0)} />
          <Animated.View style={dotStyle(d1)} />
          <Animated.View style={dotStyle(d2)} />
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════
   COMPLETED  (delivered)
════════════════════════════════════════ */
function CompletedAnimation() {
  const ring    = useRef(new Animated.Value(0.7)).current;
  const ringOp  = useRef(new Animated.Value(0.9)).current;
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring,   { toValue: 1.75, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(ringOp, { toValue: 0,    duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ring,   { toValue: 0.7, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOp, { toValue: 0.9, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(600),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 650, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1,    duration: 650, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 135, height: 135, alignItems: 'center', justifyContent: 'center' }}>
      {/* Expanding ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: '#22c55e',
        opacity: ringOp,
        transform: [{ scale: ring }],
      }} />

      {/* Green circle + checkmark */}
      <Animated.View style={{
        width: 82, height: 82, borderRadius: 41,
        backgroundColor: '#22c55e',
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: pulse }],
      }}>
        {/* Checkmark drawn as L-shape rotated 45° */}
        <View style={{
          width: 14, height: 27,
          borderBottomWidth: 5, borderRightWidth: 5,
          borderColor: 'white',
          borderBottomRightRadius: 3,
          transform: [{ rotate: '45deg' }],
          marginTop: -8,
        }} />
      </Animated.View>
    </View>
  );
}

/* ════════════════════════════════════════
   EXPORT
════════════════════════════════════════ */
export function OrderStatusIllustration({ status, dark }: Props) {
  switch (status) {
    case 'pending':   return <PendingAnimation dark={dark} />;
    case 'preparing': return <CookingPotAnimation dark={dark} />;
    case 'ready':     return <MotorcycleAnimation dark={dark} />;
    case 'completed': return <CompletedAnimation />;
  }
}
