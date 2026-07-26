import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fleaApi, FleaItem, conditionLabel } from '../../api/flea';
import { api } from '../../api/client';

interface Category { id: number; name: string }

const CONDITIONS = [
  { key: '',     label: 'Все' },
  { key: 'new',  label: 'Новое' },
  { key: 'good', label: 'Хорошее' },
  { key: 'fair', label: 'Б/у' },
];

const CONDITION_COLORS: Record<string, string> = {
  new:  colors.emerald,
  good: colors.sky,
  fair: colors.amber,
};

function FleaCard({ item, onPress }: { item: FleaItem; onPress: () => void }) {
  const photo = item.photos?.[0]?.url;
  const condColor = CONDITION_COLORS[item.condition] ?? colors.textMuted;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      {photo ? (
        <Image source={{ uri: photo }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbFallback]}>
          <Text style={{ fontSize: 28 }}>🏷️</Text>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.cardMeta}>
          {item.category && <Text style={s.metaText}>{item.category.name}</Text>}
          {item.city && <Text style={s.metaText}>{item.city.name}</Text>}
        </View>
        <View style={s.cardBottom}>
          <Text style={s.price}>{item.price.toLocaleString('ru')} ₽</Text>
          <View style={[s.condBadge, { borderColor: condColor + '50', backgroundColor: condColor + '15' }]}>
            <Text style={[s.condText, { color: condColor }]}>{conditionLabel(item.condition)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FleaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [items,      setItems]      = useState<FleaItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [condition,  setCondition]  = useState('');
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const [showFilter, setShowFilter] = useState(false);
  const [catId,      setCatId]      = useState<number | undefined>();
  const [draftCat,   setDraftCat]   = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories').then(r => setCategories(r.data.data ?? (r.data as any) ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset && p > lastPage) return;
    if (!reset) setLoading(true);
    try {
      const { data } = await fleaApi.list({
        search:      search || undefined,
        condition:   condition || undefined,
        category_id: catId,
        page:        p,
      });
      setItems(reset ? data.data : prev => [...prev, ...data.data]);
      setLastPage(data.last_page);
      setPage(p + 1);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [page, search, condition, catId, lastPage]);

  useEffect(() => {
    setPage(1);
    setItems([]);
    load(true);
  }, [search, condition, catId]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Барахолка</Text>
        </View>
        <TouchableOpacity
          style={[s.filterBtn, catId != null && s.filterBtnActive]}
          onPress={() => { setDraftCat(catId); setShowFilter(true); }}
        >
          <Text style={{ fontSize: 16 }}>🗂️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('FleaCreate')}>
          <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Поиск */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск товаров..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Состояние-фильтры */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.condFilters} style={{ flexGrow: 0 }}>
        {CONDITIONS.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[s.condChip, condition === c.key && s.condChipActive]}
            onPress={() => setCondition(c.key)}
          >
            <Text style={[s.condChipText, condition === c.key && s.condChipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setPage(1); setItems([]); load(true); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => { if (page <= lastPage) load(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏷️</Text>
              <Text style={s.emptyText}>Товаров нет</Text>
              <Text style={s.emptySub}>Будьте первым — добавьте объявление</Text>
            </View>
          }
          renderItem={({ item }) => (
            <FleaCard item={item} onPress={() => navigation.navigate('FleaItem', { id: item.id })} />
          )}
        />
      )}

      {/* Модал выбора категории */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setShowFilter(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Категория</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 }}>
              <TouchableOpacity
                style={[s.chip, draftCat == null && s.chipActive]}
                onPress={() => setDraftCat(undefined)}
              >
                <Text style={[s.chipText, draftCat == null && s.chipTextActive]}>Все</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, draftCat === c.id && s.chipActive]}
                  onPress={() => setDraftCat(c.id)}
                >
                  <Text style={[s.chipText, draftCat === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={s.sheetActions}>
            <TouchableOpacity style={s.resetBtn} onPress={() => { setCatId(undefined); setShowFilter(false); }}>
              <Text style={s.resetText}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={() => { setCatId(draftCat); setShowFilter(false); }}>
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
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  title:          { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  filterBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive:{ borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  addBtn:         { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  searchWrap:     { paddingHorizontal: 16, paddingBottom: 6 },
  searchInput:    { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  condFilters:    { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  condChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  condChipActive: { backgroundColor: colors.amberDim ?? colors.surface, borderColor: colors.amber },
  condChipText:   { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  condChipTextActive: { color: colors.amber },
  card:           { backgroundColor: colors.surface, borderRadius: 16, flexDirection: 'row', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  thumb:          { width: 100, height: 100 },
  thumbFallback:  { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  cardBody:       { flex: 1, padding: 12, gap: 4 },
  cardTitle:      { fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  cardMeta:       { flexDirection: 'row', gap: 6 },
  metaText:       { fontSize: 11, color: colors.textMuted },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price:          { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  condBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  condText:       { fontSize: 11, fontWeight: '600' },
  empty:          { alignItems: 'center', paddingTop: 80 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  emptySub:       { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:          { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:     { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:     { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  chipText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.emerald },
  sheetActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  resetBtn:       { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center' },
  resetText:      { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
  applyBtn:       { flex: 2, borderRadius: 14, backgroundColor: colors.emerald, paddingVertical: 14, alignItems: 'center' },
  applyText:      { color: '#fff', fontWeight: '800', fontSize: 15 },
});
