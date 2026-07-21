import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface Stats {
  users_total: number;
  orders_total: number;
  orders_new: number;
  orders_in_work: number;
  payout_pending: number;
  payout_pending_sum: number;
  platform_balance: number;
}

interface RecentOrder {
  id: number;
  title: string;
  status: string;
  total_sum: number;
  customer?: { name: string } | null;
}

interface PayoutRequest {
  id: number;
  amount: number;
  status: string;
  user?: { name: string } | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  new:            colors.sky,
  in_work:        colors.emerald,
  pending_review: colors.amber,
  completed:      '#6b7280',
  canceled:       colors.rose,
};

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <View style={sc.statCard}>
      <Text style={sc.statValue} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={[sc.statSub, { color: color ?? colors.emerald }]}>{sub}</Text> : null}
      <Text style={sc.statLabel}>{label}</Text>
    </View>
  );
}

export default function AdminScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [stats, setStats]       = useState<Stats | null>(null);
  const [orders, setOrders]     = useState<RecentOrder[]>([]);
  const [payouts, setPayouts]   = useState<PayoutRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sRes, oRes, pRes] = await Promise.all([
        api.get<Stats>('/admin/stats'),
        api.get<{ data: RecentOrder[] }>('/admin/orders/recent'),
        api.get<{ data: PayoutRequest[] }>('/admin/payouts/pending'),
      ]);
      setStats(sRes.data);
      setOrders(oRes.data.data ?? []);
      setPayouts(pRes.data.data ?? []);
    } catch {
      // API может не иметь этих endpoint — показываем заглушку
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView
      style={sc.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
    >
      <View style={[sc.header, { paddingTop: insets.top + 12 }]}>
        <Text style={sc.title}>Админ-панель</Text>
        <View style={sc.badge}><Text style={{ color: colors.rose, fontSize: 11, fontWeight: '800' }}>ADMIN</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <>
          {/* Быстрые ссылки */}
          <View style={sc.quickRow}>
            {[
              { icon: '👥', label: 'Пользователи', screen: 'AdminUsers' },
              { icon: '📋', label: 'Заказы',       screen: 'AdminOrders' },
              { icon: '💸', label: 'Выплаты',      screen: 'AdminPayouts' },
              { icon: '⚙️', label: 'Настройки',    screen: 'AdminSettings' },
            ].map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={sc.quickBtn}
                onPress={() => Alert.alert(item.label, 'Раздел в разработке')}
              >
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                <Text style={sc.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Статистика */}
          {stats ? (
            <>
              <Text style={sc.sectionTitle}>Сводка</Text>
              <View style={sc.statsGrid}>
                <StatCard label="Пользователей" value={stats.users_total} />
                <StatCard label="Всего заказов" value={stats.orders_total} />
                <StatCard label="Новых заказов" value={stats.orders_new} color={colors.sky} sub="новые" />
                <StatCard label="В работе" value={stats.orders_in_work} color={colors.emerald} sub="активных" />
                <StatCard label="Заявки на вывод" value={stats.payout_pending} color={colors.amber} sub={`${(stats.payout_pending_sum ?? 0).toLocaleString('ru')} ₽`} />
                <StatCard label="Баланс платформы" value={`${(stats.platform_balance ?? 0).toLocaleString('ru')} ₽`} color={colors.emerald} />
              </View>
            </>
          ) : (
            <View style={sc.noApi}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔧</Text>
              <Text style={sc.noApiText}>Нужны admin API endpoints</Text>
              <Text style={sc.noApiSub}>/admin/stats, /admin/orders/recent, /admin/payouts/pending</Text>
            </View>
          )}

          {/* Последние заказы */}
          {orders.length > 0 && (
            <>
              <Text style={sc.sectionTitle}>Последние заказы</Text>
              {orders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={sc.row}
                  onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={sc.rowTitle} numberOfLines={1}>{o.title}</Text>
                    <Text style={sc.rowSub}>{o.customer?.name ?? '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {o.total_sum > 0 && <Text style={{ color: colors.emerald, fontSize: 13, fontWeight: '700' }}>{o.total_sum.toLocaleString('ru')} ₽</Text>}
                    <View style={[sc.statusDot, { backgroundColor: (STATUS_COLOR[o.status] ?? colors.textMuted) + '25', borderColor: (STATUS_COLOR[o.status] ?? colors.textMuted) + '60' }]}>
                      <Text style={[sc.statusText, { color: STATUS_COLOR[o.status] ?? colors.textMuted }]}>{o.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Заявки на вывод */}
          {payouts.length > 0 && (
            <>
              <Text style={sc.sectionTitle}>Ожидают выплаты</Text>
              {payouts.map((p) => (
                <View key={p.id} style={sc.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={sc.rowTitle}>{p.user?.name ?? 'Мастер'}</Text>
                    <Text style={sc.rowSub}>{new Date(p.created_at).toLocaleDateString('ru')}</Text>
                  </View>
                  <Text style={{ color: colors.amber, fontWeight: '800', fontSize: 16 }}>
                    {p.amount.toLocaleString('ru')} ₽
                  </Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const sc = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  title:        { fontSize: 26, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  badge:        { backgroundColor: colors.rose + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.rose + '40' },
  quickRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  quickBtn:     { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  quickLabel:   { fontSize: 11, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  statCard:     { width: '47%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statValue:    { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  statSub:      { fontSize: 12, fontWeight: '600' },
  statLabel:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noApi:        { alignItems: 'center', padding: 32, margin: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  noApiText:    { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  noApiSub:     { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  rowTitle:     { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowSub:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusDot:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusText:   { fontSize: 10, fontWeight: '700' },
});
