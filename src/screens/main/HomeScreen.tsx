import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, Order, OrdersResponse } from '../../api/orders';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:             { label: 'Новый',        color: colors.sky },
  in_work:         { label: 'В работе',     color: colors.emerald },
  pending_review:  { label: 'На проверке',  color: colors.amber },
  completed:       { label: 'Завершён',     color: '#6b7280' },
  canceled:        { label: 'Отменён',      color: colors.rose },
};

const CLIENT_FILTERS = [
  { key: '',           label: 'Все' },
  { key: 'new',        label: 'Новые' },
  { key: 'in_work',    label: 'В работе' },
  { key: 'pending_review', label: 'На проверке' },
  { key: 'completed',  label: 'Завершённые' },
];

const MASTER_FILTERS = [
  { key: '',        label: 'Все доступные' },
  { key: 'in_work', label: 'Мои в работе' },
  { key: 'completed', label: 'Выполненные' },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: colors.textMuted };
  return (
    <View style={{ backgroundColor: s.color + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: s.color + '50' }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';

  const filters = isMaster ? MASTER_FILTERS : CLIENT_FILTERS;
  const [activeFilter, setActiveFilter] = useState('');
  const [orders, setOrders]             = useState<Order[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeFilter) params.status = activeFilter;
      const { data } = await ordersApi.list(params);
      setOrders((data as OrdersResponse).data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [activeFilter]);

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Привет, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.sub}>{isMaster ? 'Доступные заказы' : 'Мои заказы'}</Text>
        </View>
        {!isMaster && (
          <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateOrder')}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Фильтры */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
        style={{ flexGrow: 0 }}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, activeFilter === f.key && s.filterBtnActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>{isMaster ? 'Заказов нет' : 'Заказов ещё нет'}</Text>
              {!isMaster && !activeFilter && <Text style={s.emptySub}>Нажмите + чтобы создать первый заказ</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.is_urgent && (
                  <View style={s.urgentBadge}>
                    <Text style={{ color: colors.rose, fontSize: 10, fontWeight: '700' }}>СРОЧНО</Text>
                  </View>
                )}
              </View>
              <Text style={s.cardMeta} numberOfLines={1}>
                {[item.category?.name, item.city?.name].filter(Boolean).join(' · ')}
              </Text>
              <View style={s.cardBottom}>
                <StatusBadge status={item.status} />
                {item.total_sum > 0 && (
                  <Text style={s.price}>{item.total_sum.toLocaleString('ru')} ₽</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  greeting:        { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  sub:             { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  fab:             { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  filters:         { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  filterText:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive:{ color: colors.emerald },
  card:            { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardTop:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  cardTitle:       { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary, lineHeight: 21 },
  urgentBadge:     { backgroundColor: colors.roseDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.rose + '40' },
  cardMeta:        { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  cardBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:           { fontSize: 15, fontWeight: '700', color: colors.emerald },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  emptySub:        { fontSize: 13, color: colors.textMuted, marginTop: 6 },
});
