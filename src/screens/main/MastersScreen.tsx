import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { colors } from '../../theme/colors';
import { mastersApi, Master } from '../../api/masters';

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

export default function MastersScreen({ navigation }: any) {
  const [masters, setMasters]     = useState<Master[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (!reset) setLoading(true);
    try {
      const { data } = await mastersApi.list({
        search: search || undefined,
        page:   p,
      });
      setMasters(reset ? data.data : (prev) => [...prev, ...data.data]);
      setLastPage(data.meta.last_page);
      setPage(p + 1);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [page, search]);

  useEffect(() => {
    setPage(1);
    setMasters([]);
    load(true);
  }, [search]);

  useEffect(() => { load(true); }, []);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Мастера</Text>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск по имени или специализации..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t) => { setSearch(t); }}
          returnKeyType="search"
        />
      </View>

      {loading && masters.length === 0 ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={masters}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
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
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title:        { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  searchWrap:   { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput:  { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  card:         { backgroundColor: colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  cardLeft:     { position: 'relative' },
  avatar:       { width: 52, height: 52, borderRadius: 16 },
  avatarFallback: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '700', color: colors.emerald },
  proBadge:     { position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.amberDim, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: colors.amber + '50' },
  cardBody:     { flex: 1, gap: 3 },
  name:         { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  spec:         { fontSize: 12, color: colors.textMuted },
  meta:         { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText:     { fontSize: 12, color: colors.textMuted },
  rating:       { fontSize: 12, color: colors.amber, fontWeight: '600' },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
