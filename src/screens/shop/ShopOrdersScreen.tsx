import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:                { label: 'Новый',         color: colors.sky },
  pending_moderation: { label: 'На проверке',   color: colors.amber },
  paid:               { label: 'Оплачен',       color: colors.emerald },
  qr_generated:       { label: 'QR выдан',      color: colors.emerald },
  issued:             { label: 'Выдан',          color: '#6b7280' },
  cancelled:          { label: 'Отменён',        color: colors.rose },
  refunded:           { label: 'Возврат',        color: colors.rose },
};

interface ShopOrder {
  id: number; order_number: string; status: string; status_label: string;
  total_amount: number; delivery_type: string; created_at: string;
  shop: { id: number; name: string; logo: string | null } | null;
  items_count: number;
}

export default function ShopOrdersScreen({ navigation }: any) {
  const insets  = useSafeAreaInsets();
  const [orders, setOrders]       = useState<ShopOrder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/shop/orders');
      setOrders(data.data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: ShopOrder }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted };
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ShopOrderDetail', { id: item.id })}
        activeOpacity={0.85}
      >
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.orderNum}>{item.order_number}</Text>
            <Text style={s.shopName}>{item.shop?.name ?? ''} · {item.items_count} позиций</Text>
          </View>
          <View style={[s.statusBadge, { borderColor: st.color + '50', backgroundColor: st.color + '20' }]}>
            <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={s.cardBottom}>
          <Text style={s.deliveryType}>
            {item.delivery_type === 'pickup' ? '🏪 Самовывоз' : '🚚 Доставка'}
          </Text>
          <Text style={s.totalAmt}>{item.total_amount.toLocaleString('ru')} ₽</Text>
        </View>
        <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Заказы в магазинах</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.emerald} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🛍️</Text>
              <Text style={s.emptyText}>Заказов ещё нет</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Shop')}>
                <Text style={s.emptyBtnText}>Перейти в магазин</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:         { color: colors.emerald, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:         { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  orderNum:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  shopName:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:   { fontSize: 11, fontWeight: '600' },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  deliveryType: { fontSize: 13, color: colors.textSecondary },
  totalAmt:     { fontSize: 16, fontWeight: '700', color: colors.emerald },
  date:         { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyText:    { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginBottom: 20 },
  emptyBtn:     { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
