import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { useCartStore } from '../../store/cartStore';

interface ShopItem {
  id: number; title: string; price: number; sale_price: number | null;
  unit: string; stock_quantity: number; image_url: string | null;
  shop: { id: number; name: string } | null;
}

export default function ShopScreen({ navigation }: any) {
  const insets  = useSafeAreaInsets();
  const count   = useCartStore((s) => s.count)();

  const [items, setItems]         = useState<ShopItem[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/shop/items', { params: { page: p, search: search || undefined } });
      setItems(p === 1 ? data.data : (prev: ShopItem[]) => [...prev, ...data.data]);
      setLastPage(data.meta.last_page);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  useEffect(() => { load(1); }, [search]);

  const onEndReached = () => { if (page < lastPage) load(page + 1, true); };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('ShopItem', { id: item.id })}
      activeOpacity={0.85}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.img} resizeMode="cover" />
      ) : (
        <View style={[s.img, s.imgPlaceholder]}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
      )}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.cardShop} numberOfLines={1}>{item.shop?.name ?? ''}</Text>
        <View style={s.cardBottom}>
          <View>
            {item.sale_price ? (
              <>
                <Text style={s.salePrice}>{item.sale_price.toLocaleString('ru')} ₽/{item.unit}</Text>
                <Text style={s.oldPrice}>{item.price.toLocaleString('ru')} ₽</Text>
              </>
            ) : (
              <Text style={s.price}>{item.price.toLocaleString('ru')} ₽/{item.unit}</Text>
            )}
          </View>
          <Text style={s.stock}>Ост: {item.stock_quantity} {item.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>Магазин 🛍️</Text>
        <TouchableOpacity style={s.cartBtn} onPress={() => navigation.navigate('ShopCart')}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
          {count > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{count > 9 ? '9+' : count}</Text></View>
          )}
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

      {loading && page === 1 ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: insets.bottom + 20, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={colors.emerald} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🛍️</Text>
              <Text style={s.emptyText}>Товаров не найдено</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  title:         { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  cartBtn:       { position: 'relative', padding: 4 },
  badge:         { position: 'absolute', top: 0, right: 0, backgroundColor: colors.rose, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText:     { color: '#fff', fontSize: 9, fontWeight: '700' },
  searchWrap:    { paddingHorizontal: 16, paddingBottom: 10 },
  searchInput:   { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.textPrimary, fontSize: 14 },
  card:          { flex: 1, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  img:           { width: '100%', height: 130 },
  imgPlaceholder:{ backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  cardBody:      { padding: 10 },
  cardTitle:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 18, marginBottom: 3 },
  cardShop:      { fontSize: 11, color: colors.textMuted, marginBottom: 6 },
  cardBottom:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price:         { fontSize: 14, fontWeight: '700', color: colors.emerald },
  salePrice:     { fontSize: 14, fontWeight: '700', color: colors.rose },
  oldPrice:      { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  stock:         { fontSize: 10, color: colors.textMuted },
  empty:         { alignItems: 'center', paddingTop: 80 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
