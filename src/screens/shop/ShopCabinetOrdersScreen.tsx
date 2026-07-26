import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const FILTERS = [
  { key: '',         label: 'Все' },
  { key: 'new',      label: 'Новые' },
  { key: 'paid',     label: 'Оплачены' },
  { key: 'qr_generated', label: 'QR выдан' },
  { key: 'issued',   label: 'Выдано' },
  { key: 'cancelled',label: 'Отменены' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:                { label: 'Новый',           color: colors.amber },
  pending_moderation: { label: 'Модерация',       color: colors.amber },
  paid:               { label: 'Оплачен',         color: colors.sky },
  qr_generated:       { label: 'QR выдан',        color: colors.sky },
  issued:             { label: 'Выдан',            color: colors.emerald },
  cancelled:          { label: 'Отменён',          color: colors.textMuted },
  refunded:           { label: 'Возврат',          color: colors.rose },
};

interface Order {
  id: number; order_number: string; status: string; status_label: string;
  total_amount: number; shop_payout: number; delivery_type: string;
  customer: { id: number; name: string; phone: string | null } | null;
  created_at: string;
}

export default function ShopCabinetOrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('');
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [page,         setPage]         = useState(1);
  const [lastPage,     setLastPage]     = useState(1);

  const load = useCallback(async (p = 1, sf = statusFilter, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/shop-cabinet/orders', { params: { status: sf, page: p } });
      setOrders(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  useEffect(() => { load(1, statusFilter); }, [statusFilter]);

  const handleIssue = (order: Order) => {
    Alert.alert(
      'Отметить как выданный?',
      `Заказ ${order.order_number} будет помечен как выданный клиенту.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выдан',
          onPress: async () => {
            try {
              await api.patch(`/shop-cabinet/orders/${order.id}/issue`, {});
              setOrders(prev => prev.map(o =>
                o.id === order.id ? { ...o, status: 'issued', status_label: 'Выдан' } : o
              ));
            } catch (e: any) {
              Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось обновить статус');
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted };
    const canIssue = item.status === 'paid' || item.status === 'qr_generated';

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.orderNum}>{item.order_number}</Text>
            {item.customer && (
              <Text style={s.meta}>👤 {item.customer.name}{item.customer.phone ? ` · ${item.customer.phone}` : ''}</Text>
            )}
            <Text style={s.meta}>
              {item.delivery_type === 'pickup' ? '🏪 Самовывоз' : '🚚 Доставка'}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <View style={s.cardBottom}>
          <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.total}>{item.total_amount.toLocaleString('ru')} ₽</Text>
            {item.shop_payout > 0 && item.shop_payout !== item.total_amount && (
              <Text style={s.payout}>выплата: {item.shop_payout.toLocaleString('ru')} ₽</Text>
            )}
          </View>
        </View>

        {canIssue && (
          <TouchableOpacity style={s.issueBtn} onPress={() => handleIssue(item)}>
            <Text style={s.issueBtnText}>✓ Отметить выданным</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Заказы магазина</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.filterWrap}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[s.filterBtn, statusFilter === f.key && s.filterBtnActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[s.filterText, statusFilter === f.key && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.sky} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, statusFilter, true); }} tintColor={colors.sky} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, statusFilter, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Заказов нет</Text>
            </View>
          }
          renderItem={renderOrder}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:           { color: colors.sky, fontSize: 16 },
  title:          { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  filterWrap:     { marginBottom: 8 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterBtnActive:{ backgroundColor: colors.skyDim ?? colors.sky + '15', borderColor: colors.sky },
  filterText:     { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterTextActive:{ color: colors.sky },
  card:           { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  orderNum:       { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta:           { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge:          { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  date:           { fontSize: 12, color: colors.textMuted },
  total:          { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  payout:         { fontSize: 11, color: colors.textMuted },
  issueBtn:       { marginTop: 10, backgroundColor: colors.skyDim ?? colors.sky + '15', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.sky + '40' },
  issueBtnText:   { color: colors.sky, fontWeight: '700', fontSize: 14 },
});
