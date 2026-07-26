import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface AdminOrder {
  id: number;
  title: string;
  status: string;
  total_sum: number;
  is_urgent: boolean;
  created_at: string;
  customer?: { name: string } | null;
  category?: string | null;
  city?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  new:             'Новый',
  in_work:         'В работе',
  pending_review:  'Приёмка',
  completed:       'Завершён',
  canceled:        'Отменён',
  pending_agreement: 'Согласование',
};
const STATUS_COLOR: Record<string, string> = {
  new:               colors.sky,
  in_work:           colors.emerald,
  pending_review:    colors.amber,
  pending_agreement: colors.amber,
  completed:         colors.textMuted,
  canceled:          colors.rose,
};
const STATUSES = ['', 'new', 'in_work', 'pending_review', 'pending_agreement', 'completed', 'canceled'];

export default function AdminOrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders]       = useState<AdminOrder[]>([]);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]  = useState(false);

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: AdminOrder[]; meta: any }>('/admin/orders', {
        params: { page: p, search: search || undefined, status: status || undefined },
      });
      setOrders(append ? (prev) => [...prev, ...res.data.data] : res.data.data);
      setLastPage(res.data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [search, status]);

  useEffect(() => { load(1); }, [load]);

  const renderItem = ({ item: o }: { item: AdminOrder }) => (
    <TouchableOpacity
      style={s.row}
      onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {o.is_urgent && <Text style={{ fontSize: 12 }}>🔥</Text>}
          <Text style={s.rowTitle} numberOfLines={1}>{o.title}</Text>
        </View>
        <Text style={s.rowSub} numberOfLines={1}>
          #{o.id} · {o.customer?.name ?? '—'}
          {o.category ? ` · ${o.category}` : ''}
          {o.city ? ` · ${o.city}` : ''}
        </Text>
        <Text style={s.rowDate}>{o.created_at}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {o.total_sum > 0 && (
          <Text style={s.rowSum}>{o.total_sum.toLocaleString('ru')} ₽</Text>
        )}
        <View style={[s.statusBadge, {
          backgroundColor: (STATUS_COLOR[o.status] ?? colors.textMuted) + '20',
          borderColor:      (STATUS_COLOR[o.status] ?? colors.textMuted) + '50',
        }]}>
          <Text style={[s.statusText, { color: STATUS_COLOR[o.status] ?? colors.textMuted }]}>
            {STATUS_LABEL[o.status] ?? o.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Заказы</Text>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск по названию или ID..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => load(1)}
        />
      </View>

      <FlatList
        data={STATUSES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(r) => r}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 10 }}
        renderItem={({ item: st }) => (
          <TouchableOpacity
            style={[s.chip, status === st && s.chipActive, st !== '' && {
              borderColor: (STATUS_COLOR[st] ?? colors.border) + '60',
            }]}
            onPress={() => setStatus(st)}
          >
            <Text style={[s.chipText, status === st && s.chipTextActive, st !== '' && {
              color: STATUS_COLOR[st] ?? colors.textSecondary,
            }]}>
              {st === '' ? 'Все' : STATUS_LABEL[st]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => {
            if (page < lastPage && !loadingMore) load(page + 1, true);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.emerald} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={s.emptyText}>Заказы не найдены</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 30, color: colors.textSecondary, lineHeight: 34 },
  title:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary },

  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    color: colors.textPrimary, fontSize: 14,
  },

  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.emerald + '20', borderColor: colors.emerald },
  chipText:   { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.emerald },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  rowSub:   { fontSize: 12, color: colors.textSecondary },
  rowDate:  { fontSize: 11, color: colors.textMuted },
  rowSum:   { fontSize: 14, fontWeight: '700', color: colors.emerald },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  empty:     { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 15, color: colors.textMuted },
});
