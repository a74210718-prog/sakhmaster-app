import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface DashData {
  income_month:     number;
  income_year:      number;
  tax_year_est:     number;
  orders_completed: number;
  orders_active:    number;
  team_count:       number;
  recent_tx:        { id: number; amount: number; description: string; created_at: string }[];
}

function StatCard({ label, value, color, emoji }: { label: string; value: string; color: string; emoji: string }) {
  return (
    <View style={[st.statCard, { borderColor: color + '30' }]}>
      <Text style={st.statEmoji}>{emoji}</Text>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

export default function IpDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [data,       setData]       = useState<DashData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: res } = await api.get('/ip/dashboard');
      setData(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.amber} size="large" />
    </View>
  );

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.amber} />}
    >
      <View style={[st.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={st.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={st.title}>ИП кабинет</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Финансы */}
      <Text style={st.sectionTitle}>Финансы</Text>
      <View style={st.statsGrid}>
        <StatCard label="Доход за месяц" value={(data?.income_month ?? 0).toLocaleString('ru') + ' ₽'} color={colors.emerald} emoji="💰" />
        <StatCard label="Доход за год"   value={(data?.income_year ?? 0).toLocaleString('ru') + ' ₽'}  color={colors.emerald} emoji="📈" />
        <StatCard label="Налог (оценка)" value={(data?.tax_year_est ?? 0).toLocaleString('ru') + ' ₽'} color={colors.amber}   emoji="🏛️" />
      </View>

      {/* Проекты */}
      <Text style={st.sectionTitle}>Проекты</Text>
      <View style={st.statsGrid}>
        <StatCard label="В работе"    value={String(data?.orders_active ?? 0)}    color={colors.sky}    emoji="⚡" />
        <StatCard label="Выполнено"   value={String(data?.orders_completed ?? 0)} color={colors.emerald} emoji="✅" />
        <StatCard label="Команда СМЗ" value={String(data?.team_count ?? 0)}       color={colors.amber}   emoji="👥" />
      </View>

      {/* Быстрые ссылки */}
      <View style={st.menu}>
        <TouchableOpacity style={st.menuItem} onPress={() => navigation.navigate('IpFinance')}>
          <Text style={st.menuIcon}>📊</Text>
          <Text style={st.menuLabel}>Финансы и транзакции</Text>
          <Text style={st.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.menuItem} onPress={() => navigation.navigate('IpProjects')}>
          <Text style={st.menuIcon}>📋</Text>
          <Text style={st.menuLabel}>Мои проекты</Text>
          <Text style={st.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.menuItem} onPress={() => navigation.navigate('IpTeam')}>
          <Text style={st.menuIcon}>👥</Text>
          <Text style={st.menuLabel}>Команда СМЗ</Text>
          <Text style={st.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Последние транзакции */}
      {(data?.recent_tx?.length ?? 0) > 0 && (
        <>
          <Text style={st.sectionTitle}>Последние поступления</Text>
          <View style={st.txList}>
            {data!.recent_tx.map(tx => (
              <View key={tx.id} style={st.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={st.txDate}>{new Date(tx.created_at).toLocaleDateString('ru')}</Text>
                </View>
                <Text style={st.txAmt}>+{tx.amount.toLocaleString('ru')} ₽</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  back:         { color: colors.amber, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard:     { flex: 1, minWidth: '28%', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 4 },
  statEmoji:    { fontSize: 22 },
  statValue:    { fontSize: 18, fontWeight: '800' },
  statLabel:    { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  menu:         { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel:    { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuArrow:    { color: colors.textMuted, fontSize: 18 },
  txList:       { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  txRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  txDesc:       { fontSize: 14, color: colors.textPrimary },
  txDate:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmt:        { fontSize: 15, fontWeight: '700', color: colors.emerald },
});
