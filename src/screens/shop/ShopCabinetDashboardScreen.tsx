import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface DashData {
  shop:             { id: number; name: string; logo: string | null; status: string };
  orders_total:     number;
  orders_new:       number;
  orders_today:     number;
  orders_paid:      number;
  products_total:   number;
  products_active:  number;
  revenue_month:    number;
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

export default function ShopCabinetDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [data,       setData]       = useState<DashData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: res } = await api.get('/shop-cabinet/dashboard');
      setData(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.sky} size="large" />
    </View>
  );

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.sky} />}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{data?.shop.name ?? 'Магазин'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Логотип + статус */}
      <View style={s.shopCard}>
        {data?.shop.logo ? (
          <Image source={{ uri: data.shop.logo }} style={s.shopLogo} />
        ) : (
          <View style={[s.shopLogo, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 28 }}>🏪</Text>
          </View>
        )}
        <View>
          <Text style={s.shopName}>{data?.shop.name}</Text>
          <View style={[s.statusBadge, { backgroundColor: data?.shop.status === 'approved' ? colors.emeraldDim : colors.amberDim ?? colors.amber + '20' }]}>
            <Text style={[s.statusText, { color: data?.shop.status === 'approved' ? colors.emerald : colors.amber }]}>
              {data?.shop.status === 'approved' ? '✓ Одобрен' : data?.shop.status ?? 'Статус неизвестен'}
            </Text>
          </View>
        </View>
      </View>

      {/* Заказы */}
      <Text style={s.sectionTitle}>Заказы</Text>
      <View style={s.statsGrid}>
        <StatCard label="Новых"    value={String(data?.orders_new ?? 0)}    color={colors.amber}   emoji="🆕" />
        <StatCard label="Оплачено" value={String(data?.orders_paid ?? 0)}   color={colors.sky}     emoji="💳" />
        <StatCard label="Сегодня"  value={String(data?.orders_today ?? 0)}  color={colors.sky}     emoji="📅" />
        <StatCard label="Всего"    value={String(data?.orders_total ?? 0)}  color={colors.textSecondary} emoji="📦" />
      </View>

      {/* Доход */}
      <View style={s.revenueCard}>
        <Text style={s.revLabel}>Доход за месяц (выплата магазину)</Text>
        <Text style={s.revValue}>{(data?.revenue_month ?? 0).toLocaleString('ru')} ₽</Text>
      </View>

      {/* Товары */}
      <Text style={s.sectionTitle}>Товары</Text>
      <View style={s.statsGrid}>
        <StatCard label="Активных" value={String(data?.products_active ?? 0)} color={colors.emerald} emoji="✅" />
        <StatCard label="Всего"    value={String(data?.products_total ?? 0)}  color={colors.textSecondary} emoji="🏷️" />
      </View>

      {/* Быстрые ссылки */}
      <View style={s.menu}>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('ShopCabinetOrders')}>
          <Text style={s.menuIcon}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuLabel}>Управление заказами</Text>
            {(data?.orders_new ?? 0) > 0 && (
              <Text style={{ fontSize: 12, color: colors.amber }}>Новых: {data!.orders_new}</Text>
            )}
          </View>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('ShopCabinetProducts')}>
          <Text style={s.menuIcon}>🏷️</Text>
          <Text style={s.menuLabel}>Товары</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  back:         { color: colors.sky, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary, maxWidth: '60%' },
  shopCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  shopLogo:     { width: 56, height: 56, borderRadius: 14 },
  shopName:     { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  statusBadge:  { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText:   { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard:     { flex: 1, minWidth: '20%', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  statEmoji:    { fontSize: 20 },
  statValue:    { fontSize: 16, fontWeight: '800' },
  statLabel:    { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  revenueCard:  { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.skyDim ?? colors.sky + '15', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.sky + '30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revLabel:     { fontSize: 13, color: colors.textSecondary, flex: 1 },
  revValue:     { fontSize: 20, fontWeight: '800', color: colors.sky },
  menu:         { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel:    { flex: 1, fontSize: 15, color: colors.textPrimary },
  menuArrow:    { color: colors.textMuted, fontSize: 18 },
});
