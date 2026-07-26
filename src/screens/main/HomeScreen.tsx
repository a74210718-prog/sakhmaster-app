import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, Order, OrdersResponse } from '../../api/orders';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:                { label: 'Новый',          color: colors.sky },
  pending_agreement:  { label: 'Ждёт оплаты',    color: colors.amber },
  in_work:            { label: 'В работе',        color: colors.emerald },
  pending_review:     { label: 'На проверке',     color: colors.amber },
  completed:          { label: 'Завершён',        color: '#6b7280' },
  canceled:           { label: 'Отменён',         color: colors.rose },
};

const CLIENT_FILTERS = [
  { key: '',                  label: 'Все' },
  { key: 'new',               label: 'Новые' },
  { key: 'pending_agreement', label: '💳 Оплата' },
  { key: 'in_work',           label: 'В работе' },
  { key: 'pending_review',    label: 'На проверке' },
  { key: 'completed',         label: 'Завершённые' },
];

const MASTER_FILTERS = [
  { key: '',             label: 'Доступные' },
  { key: 'in_work',      label: 'Мои в работе' },
  { key: 'pending_review', label: 'На проверке' },
  { key: 'completed',    label: 'Выполненные' },
];

interface Category { id: number; name: string; }

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: colors.textMuted };
  return (
    <View style={{ backgroundColor: s.color + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: s.color + '50' }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const insets    = useSafeAreaInsets();
  const user      = useAuthStore((s) => s.user);
  const isMaster  = user?.role === 'master_smz' || user?.role === 'ip_pro';
  const filters   = isMaster ? MASTER_FILTERS : CLIENT_FILTERS;

  const [activeFilter, setActiveFilter]   = useState('');
  const [categoryId, setCategoryId]       = useState<number | null>(null);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [takingId, setTakingId]           = useState<number | null>(null);
  const [page, setPage]                   = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [pendingPayCount, setPendingPayCount] = useState(0);

  const isAvailableFeed = isMaster && (!activeFilter || activeFilter === 'new');

  const loadCategories = async () => {
    try {
      const { data } = await api.get<{ data: Category[] }>('/categories');
      setCategories(data.data ?? []);
    } catch {}
  };

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const params: Record<string, any> = { page: p };
      if (activeFilter) params.status = activeFilter;
      if (isAvailableFeed && categoryId) params.category_id = categoryId;
      const { data } = await ordersApi.list(params);
      const result = (data as OrdersResponse).data ?? [];
      const meta   = (data as OrdersResponse).meta;
      setOrders(reset ? result : (prev) => [...prev, ...result]);
      setLastPage(meta?.last_page ?? 1);
      setPage(p + 1);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [page, activeFilter, categoryId, isAvailableFeed]);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setLastPage(1);
    load(true);
  }, [activeFilter, categoryId]);

  useEffect(() => {
    if (!isMaster) {
      ordersApi.list({ status: 'pending_agreement', page: 1 })
        .then(r => setPendingPayCount((r.data as OrdersResponse).meta?.total ?? 0))
        .catch(() => {});
    }
  }, [isMaster]);

  const handleTakeOrder = async (order: Order) => {
    Alert.alert(
      'Взять заказ',
      `Взять заказ «${order.title}»?\n\nПосле этого вы станете исполнителем.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Взять',
          onPress: async () => {
            setTakingId(order.id);
            try {
              await ordersApi.takeOrder(order.id);
              load(true);
              navigation.navigate('OrderDetail', { id: order.id });
            } catch (e: any) {
              Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось взять заказ');
            } finally {
              setTakingId(null);
            }
          },
        },
      ]
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
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

      {/* Описание (только в доступной ленте мастера) */}
      {isAvailableFeed && item.description ? (
        <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <Text style={s.cardMeta} numberOfLines={1}>
        {[item.category?.name, item.city?.name].filter(Boolean).join(' · ')}
      </Text>

      <View style={s.cardBottom}>
        <StatusBadge status={item.status} />
        <View style={s.cardRight}>
          {item.total_sum > 0 && (
            <Text style={s.price}>{item.total_sum.toLocaleString('ru')} ₽</Text>
          )}
        </View>
      </View>

      {/* Кнопка «Взять заказ» только для доступных */}
      {isAvailableFeed && (
        <TouchableOpacity
          style={s.takeBtn}
          onPress={() => handleTakeOrder(item)}
          disabled={takingId === item.id}
        >
          {takingId === item.id
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.takeBtnText}>✓ Взять заказ</Text>}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Привет, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.sub}>{isMaster ? 'Лента заказов' : 'Мои заказы'}</Text>
        </View>
        {!isMaster && (
          <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateOrder')}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Баннер «ждут оплаты» — только клиентам */}
      {!isMaster && pendingPayCount > 0 && activeFilter !== 'pending_agreement' && (
        <TouchableOpacity
          style={s.payBanner}
          onPress={() => setActiveFilter('pending_agreement')}
          activeOpacity={0.85}
        >
          <Text style={s.payBannerText}>
            💳  {pendingPayCount} {pendingPayCount === 1 ? 'заказ ждёт' : 'заказа ждут'} оплаты
          </Text>
          <Text style={s.payBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Фильтры статуса */}
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
            onPress={() => { setActiveFilter(f.key); setCategoryId(null); }}
          >
            <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Фильтр по категории (только для доступной ленты мастера) */}
      {isAvailableFeed && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.filters, { paddingTop: 0 }]}
          style={{ flexGrow: 0 }}
        >
          <TouchableOpacity
            style={[s.catBtn, !categoryId && s.catBtnActive]}
            onPress={() => setCategoryId(null)}
          >
            <Text style={[s.catText, !categoryId && s.catTextActive]}>Все категории</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.catBtn, categoryId === c.id && s.catBtnActive]}
              onPress={() => setCategoryId(c.id === categoryId ? null : c.id)}
            >
              <Text style={[s.catText, categoryId === c.id && s.catTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setOrders([]); setPage(1); load(true); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => { if (!loadingMore && page <= lastPage) load(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.emerald} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>{isAvailableFeed ? '🔍' : '📋'}</Text>
              <Text style={s.emptyText}>
                {isAvailableFeed ? 'Нет доступных заказов' : 'Заказов нет'}
              </Text>
              {isAvailableFeed && (
                <Text style={s.emptySub}>Попробуйте другую категорию или зайдите позже</Text>
              )}
              {!isMaster && !activeFilter && (
                <Text style={s.emptySub}>Нажмите + чтобы создать первый заказ</Text>
              )}
            </View>
          }
          renderItem={renderOrderCard}
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
  filters:         { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4, gap: 8 },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  filterText:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive:{ color: colors.emerald },
  catBtn:          { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catBtnActive:    { backgroundColor: colors.skyDim, borderColor: colors.sky },
  catText:         { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  catTextActive:   { color: colors.sky },
  card:            { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardTop:         { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  cardTitle:       { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary, lineHeight: 21 },
  urgentBadge:     { backgroundColor: colors.roseDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.rose + '40' },
  cardDesc:        { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardMeta:        { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  cardBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRight:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price:           { fontSize: 15, fontWeight: '700', color: colors.emerald },
  takeBtn:         { marginTop: 12, backgroundColor: colors.emerald, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  takeBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  emptySub:        { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },
  payBanner:       { marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.amberDim, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.amber + '50' },
  payBannerText:   { fontSize: 14, fontWeight: '700', color: colors.amber },
  payBannerArrow:  { fontSize: 20, color: colors.amber },
});
