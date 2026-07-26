import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const FILTERS = [
  { key: '',            label: 'Активные' },
  { key: 'in_work',    label: 'В работе' },
  { key: 'pending_review', label: 'На проверке' },
  { key: 'completed',  label: 'Выполнено' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_work:        { label: 'В работе',      color: colors.sky },
  accepted:       { label: 'Принят',        color: colors.sky },
  in_progress:    { label: 'Выполняется',   color: colors.sky },
  work_started:   { label: 'Начата работа', color: colors.sky },
  pending_review: { label: 'На проверке',   color: colors.amber },
  completed:      { label: 'Завершён',      color: colors.emerald },
};

interface Project {
  id: number; title: string; status: string; budget: number;
  client: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  created_at: string;
}

export default function IpProjectsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [status,     setStatus]     = useState('');
  const [items,      setItems]      = useState<Project[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, st = status, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/ip/projects', { params: { status: st, page: p } });
      setItems(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [status]);

  useEffect(() => { load(1, status); }, [status]);

  const renderItem = ({ item }: { item: Project }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status, color: colors.textMuted };
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        {item.category && <Text style={s.meta}>🔧 {item.category.name}</Text>}
        {item.client && <Text style={s.meta}>👤 {item.client.name}</Text>}
        <View style={s.cardBottom}>
          <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
          {item.budget > 0 && <Text style={s.budget}>{item.budget.toLocaleString('ru')} ₽</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Мои проекты</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, status === f.key && s.filterBtnActive]}
            onPress={() => setStatus(f.key)}
          >
            <Text style={[s.filterText, status === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, status, true); }} tintColor={colors.amber} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, status, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Проектов нет</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:           { color: colors.amber, fontSize: 16 },
  title:          { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  filterRow:      { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterBtnActive:{ backgroundColor: colors.amberDim ?? colors.amber + '20', borderColor: colors.amber },
  filterText:     { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterTextActive:{ color: colors.amber },
  card:           { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle:      { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  badge:          { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  meta:           { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  date:           { fontSize: 12, color: colors.textMuted },
  budget:         { fontSize: 14, fontWeight: '700', color: colors.amber },
});
