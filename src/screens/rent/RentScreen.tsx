import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface RentTool {
  id: number; name: string; condition: string;
  rate_per_day: number | null; rate_per_hour: number | null;
  deposit_required: boolean; deposit_amount: number | null;
  delivery_available: boolean; image_url: string | null;
  category: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
}
interface Category { id: number; name: string; slug: string; }

export default function RentScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [tools, setTools]           = useState<RentTool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catId, setCatId]           = useState<number | null>(null);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/rent/categories');
      setCategories(data.data ?? []);
    } catch {}
  };

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/rent/tools', {
        params: { page: p, category_id: catId || undefined, search: search || undefined },
      });
      setTools(p === 1 ? data.data : (prev: RentTool[]) => [...prev, ...data.data]);
      setLastPage(data.meta.last_page);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [catId, search]);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { load(1); }, [load]);

  const onEndReached = () => { if (page < lastPage) load(page + 1, true); };

  const renderTool = ({ item }: { item: RentTool }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('RentItem', { id: item.id })}
      activeOpacity={0.85}
    >
      <View style={[s.img, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 36 }}>🔧</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.name}</Text>
        {item.condition && <Text style={s.cardCond}>Состояние: {item.condition}</Text>}
        <View style={s.rateRow}>
          {item.rate_per_day && (
            <View style={s.rateChip}>
              <Text style={s.rateText}>{item.rate_per_day.toLocaleString('ru')} ₽/сут</Text>
            </View>
          )}
          {item.rate_per_hour && (
            <View style={s.rateChip}>
              <Text style={s.rateText}>{item.rate_per_hour.toLocaleString('ru')} ₽/ч</Text>
            </View>
          )}
        </View>
        <View style={s.cardMeta}>
          {item.deposit_required && (
            <Text style={s.metaTag}>💰 Залог {item.deposit_amount?.toLocaleString('ru')} ₽</Text>
          )}
          {item.delivery_available && <Text style={s.metaTag}>🚚 Доставка</Text>}
        </View>
        {item.category && <Text style={s.catLabel}>{item.category.name}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Аренда 🔧</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyRentals')}>
          <Text style={s.myRentals}>Мои аренды</Text>
        </TouchableOpacity>
      </View>

      {/* Поиск */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск инструментов..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Категории */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.cats}
          style={{ flexGrow: 0 }}
        >
          <TouchableOpacity
            style={[s.catChip, !catId && s.catChipActive]}
            onPress={() => setCatId(null)}
          >
            <Text style={[s.catChipText, !catId && s.catChipTextActive]}>Все</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.catChip, catId === c.id && s.catChipActive]}
              onPress={() => setCatId(c.id === catId ? null : c.id)}
            >
              <Text style={[s.catChipText, catId === c.id && s.catChipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading && page === 1 ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={tools}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={colors.emerald} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔧</Text>
              <Text style={s.emptyText}>Инструментов не найдено</Text>
            </View>
          }
          renderItem={renderTool}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  title:           { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  myRentals:       { color: colors.emerald, fontSize: 14, fontWeight: '600' },
  searchWrap:      { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput:     { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.textPrimary, fontSize: 14 },
  cats:            { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  catChip:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catChipActive:   { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  catChipText:     { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  catChipTextActive:{ color: colors.emerald },
  card:            { flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  img:             { width: 90, height: 90 },
  cardBody:        { flex: 1, padding: 12, gap: 4 },
  cardTitle:       { fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 19 },
  cardCond:        { fontSize: 11, color: colors.textMuted },
  rateRow:         { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  rateChip:        { backgroundColor: colors.emeraldDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rateText:        { fontSize: 12, color: colors.emerald, fontWeight: '700' },
  cardMeta:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaTag:         { fontSize: 11, color: colors.textMuted },
  catLabel:        { fontSize: 11, color: colors.sky },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyText:       { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
