import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface DashData {
  tools_total:        number;
  tools_active:       number;
  bookings_active:    number;
  bookings_completed: number;
  revenue_month:      number;
}

function StatCard({ label, value, color, emoji }: { label: string; value: string; color: string; emoji: string }) {
  return (
    <View style={[s.statCard, { borderColor: color + '30' }]}>
      <Text style={s.statEmoji}>{emoji}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function RentCabinetDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [data,       setData]       = useState<DashData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: res } = await api.get('/rent-cabinet/dashboard');
      setData(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.emerald} size="large" />
    </View>
  );

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.emerald} />}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Кабинет аренды</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Доход */}
      <View style={s.revenueCard}>
        <Text style={s.revLabel}>Доход за месяц</Text>
        <Text style={s.revValue}>{(data?.revenue_month ?? 0).toLocaleString('ru')} ₽</Text>
      </View>

      {/* Инструменты */}
      <Text style={s.sectionTitle}>Инструменты</Text>
      <View style={s.statsGrid}>
        <StatCard label="Активных" value={String(data?.tools_active ?? 0)}  color={colors.emerald} emoji="✅" />
        <StatCard label="Всего"    value={String(data?.tools_total ?? 0)}   color={colors.textSecondary} emoji="🔩" />
      </View>

      {/* Аренды */}
      <Text style={s.sectionTitle}>Бронирования</Text>
      <View style={s.statsGrid}>
        <StatCard label="Активных"  value={String(data?.bookings_active ?? 0)}    color={colors.amber}   emoji="⚡" />
        <StatCard label="Завершено" value={String(data?.bookings_completed ?? 0)} color={colors.emerald} emoji="✓" />
      </View>

      {/* Навигация */}
      <View style={s.menu}>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('RentCabinetBookings')}>
          <Text style={s.menuIcon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuLabel}>Бронирования</Text>
            {(data?.bookings_active ?? 0) > 0 && (
              <Text style={{ fontSize: 12, color: colors.amber }}>Активных: {data!.bookings_active}</Text>
            )}
          </View>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('RentCabinetTools')}>
          <Text style={s.menuIcon}>🔩</Text>
          <Text style={s.menuLabel}>Мои инструменты</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  back:         { color: colors.emerald, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  revenueCard:  { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.emeraldDim, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.emerald + '30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revLabel:     { fontSize: 13, color: colors.textSecondary },
  revValue:     { fontSize: 22, fontWeight: '800', color: colors.emerald },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsGrid:    { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  statCard:     { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statEmoji:    { fontSize: 22 },
  statValue:    { fontSize: 18, fontWeight: '800' },
  statLabel:    { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  menu:         { marginHorizontal: 16, marginTop: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel:    { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuArrow:    { color: colors.textMuted, fontSize: 18 },
});
