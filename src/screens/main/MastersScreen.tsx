import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { mastersApi, Master } from '../../api/masters';
import { api } from '../../api/client';

interface Category { id: number; name: string }
interface City     { id: number; name: string }

const RATINGS = [
  { label: 'Любой', value: 0 },
  { label: '4+',    value: 4 },
  { label: '4.5+',  value: 4.5 },
  { label: '5',     value: 5 },
];

function MasterCard({ item, onPress }: { item: Master; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.cardLeft}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.avatarLetter}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        {item.is_pro && (
          <View style={s.proBadge}>
            <Text style={{ color: colors.amber, fontSize: 9, fontWeight: '800' }}>PRO</Text>
          </View>
        )}
      </View>
      <View style={s.cardBody}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        {item.specialization ? (
          <Text style={s.spec} numberOfLines={1}>{item.specialization}</Text>
        ) : null}
        <View style={s.meta}>
          {item.city && <Text style={s.metaText}>{item.city.name}</Text>}
          {item.rating != null && (
            <Text style={s.rating}>⭐ {Number(item.rating).toFixed(1)}</Text>
          )}
          {item.reviews_count != null && item.reviews_count > 0 && (
            <Text style={s.metaText}>· {item.reviews_count} отз.</Text>
          )}
        </View>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

interface Filters {
  category_id?: number;
  city_id?: number;
  min_rating?: number;
}

export default function MastersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [masters,    setMasters]    = useState<Master[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [filters,    setFilters]    = useState<Filters>({});
  const [draftF,     setDraftF]     = useState<Filters>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories').then(r => setCategories(r.data.data ?? (r.data as any) ?? [])).catch(() => {});
    api.get<{ data: City[] }>('/cities').then(r => setCities(r.data.data ?? (r.data as any) ?? [])).catch(() => {});
  }, []);

  const activeCount = [filters.category_id, filters.city_id, filters.min_rating].filter(Boolean).length;

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoading(true);
    try {
      const { data } = await mastersApi.list({
        search:      search || undefined,
        category_id: filters.category_id,
        city_id:     filters.city_id,
        min_rating:  filters.min_rating || undefined,
        page:        p,
      });
      setMasters(reset ? data.data : (prev) => [...prev, ...data.data]);
      setLastPage(data.meta.last_page);
      setPage(p + 1);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [page, search, filters]);

  useEffect(() => {
    setPage(1);
    setMasters([]);
    load(true);
  }, [search, filters]);

  const openFilter = () => {
    setDraftF({ ...filters });
    setShowFilter(true);
  };

  const applyFilter = () => {
    setFilters({ ...draftF });
    setShowFilter(false);
  };

  const resetFilter = () => {
    setDraftF({});
    setFilters({});
    setShowFilter(false);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Мастера</Text>
        <TouchableOpacity style={[s.filterBtn, activeCount > 0 && s.filterBtnActive]} onPress={openFilter}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
          {activeCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск по имени или специализации..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t) => setSearch(t)}
          returnKeyType="search"
        />
      </View>

      {loading && masters.length === 0 ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={masters}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setPage(1); setMasters([]); load(true); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => { if (page <= lastPage) load(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔧</Text>
              <Text style={s.emptyText}>Мастера не найдены</Text>
              {activeCount > 0 && (
                <TouchableOpacity onPress={resetFilter} style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.emerald, fontWeight: '600' }}>Сбросить фильтры</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <MasterCard
              item={item}
              onPress={() => navigation.navigate('MasterDetail', { id: item.id })}
            />
          )}
        />
      )}

      {/* Модал фильтра */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setShowFilter(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Фильтры</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            {/* Категория */}
            <Text style={s.filterLabel}>Категория</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              <TouchableOpacity
                style={[s.chip, !draftF.category_id && s.chipActive]}
                onPress={() => setDraftF(d => ({ ...d, category_id: undefined }))}
              >
                <Text style={[s.chipText, !draftF.category_id && s.chipTextActive]}>Все</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, draftF.category_id === c.id && s.chipActive]}
                  onPress={() => setDraftF(d => ({ ...d, category_id: c.id }))}
                >
                  <Text style={[s.chipText, draftF.category_id === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Город */}
            <Text style={s.filterLabel}>Город</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              <TouchableOpacity
                style={[s.chip, !draftF.city_id && s.chipActive]}
                onPress={() => setDraftF(d => ({ ...d, city_id: undefined }))}
              >
                <Text style={[s.chipText, !draftF.city_id && s.chipTextActive]}>Все города</Text>
              </TouchableOpacity>
              {cities.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, draftF.city_id === c.id && s.chipActive]}
                  onPress={() => setDraftF(d => ({ ...d, city_id: c.id }))}
                >
                  <Text style={[s.chipText, draftF.city_id === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Рейтинг */}
            <Text style={s.filterLabel}>Минимальный рейтинг</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingBottom: 16 }}>
              {RATINGS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[s.chip, (draftF.min_rating ?? 0) === r.value && s.chipActive]}
                  onPress={() => setDraftF(d => ({ ...d, min_rating: r.value || undefined }))}
                >
                  <Text style={[s.chipText, (draftF.min_rating ?? 0) === r.value && s.chipTextActive]}>
                    {r.value > 0 ? `⭐ ${r.label}` : r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.sheetActions}>
            <TouchableOpacity style={s.resetBtn} onPress={resetFilter}>
              <Text style={s.resetText}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={applyFilter}>
              <Text style={s.applyText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  title:          { flex: 1, fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  filterBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterBtnActive:{ borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  filterBadge:    { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' },
  searchWrap:     { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput:    { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  card:           { backgroundColor: colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  cardLeft:       { position: 'relative' },
  avatar:         { width: 52, height: 52, borderRadius: 16 },
  avatarFallback: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:   { fontSize: 22, fontWeight: '700', color: colors.emerald },
  proBadge:       { position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.amberDim, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: colors.amber + '50' },
  cardBody:       { flex: 1, gap: 3 },
  name:           { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  spec:           { fontSize: 12, color: colors.textMuted },
  meta:           { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText:       { fontSize: 12, color: colors.textMuted },
  rating:         { fontSize: 12, color: colors.amber, fontWeight: '600' },
  empty:          { alignItems: 'center', paddingTop: 80 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  // Modal
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:          { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:     { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  filterLabel:    { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2 ?? colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:     { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  chipText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.emerald },
  sheetActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  resetBtn:       { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center' },
  resetText:      { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
  applyBtn:       { flex: 2, borderRadius: 14, backgroundColor: colors.emerald, paddingVertical: 14, alignItems: 'center' },
  applyText:      { color: '#fff', fontWeight: '800', fontSize: 15 },
});
