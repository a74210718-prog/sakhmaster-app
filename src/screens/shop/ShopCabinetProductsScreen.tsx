import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface Product {
  id: number; name: string; price: number; stock: number;
  is_available: boolean; cover: string | null;
}

export default function ShopCabinetProductsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/shop-cabinet/products', { params: { page: p } });
      setProducts(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleToggle = async (product: Product) => {
    const newState = !product.is_available;
    try {
      await api.patch(`/shop-cabinet/products/${product.id}/toggle`, {});
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, is_available: newState } : p
      ));
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось изменить доступность');
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={s.card}>
      <View style={s.row}>
        {item.cover ? (
          <Image source={{ uri: item.cover }} style={s.thumb} />
        ) : (
          <View style={[s.thumb, s.thumbPlaceholder]}>
            <Text style={{ fontSize: 22 }}>🏷️</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          <Text style={s.price}>{item.price.toLocaleString('ru')} ₽</Text>
          <Text style={s.stock}>Остаток: {item.stock} шт.</Text>
        </View>
        <TouchableOpacity
          style={[s.toggleBtn, item.is_available ? s.toggleOn : s.toggleOff]}
          onPress={() => handleToggle(item)}
        >
          <Text style={[s.toggleText, { color: item.is_available ? colors.emerald : colors.textMuted }]}>
            {item.is_available ? '✓ Активен' : '✗ Скрыт'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Товары магазина</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.sky} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={colors.sky} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🏪</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Товаров нет</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                Добавляйте товары через личный кабинет на сайте
              </Text>
            </View>
          }
          renderItem={renderProduct}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:            { color: colors.sky, fontSize: 16 },
  title:           { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:            { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb:           { width: 60, height: 60, borderRadius: 10 },
  thumbPlaceholder:{ backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  name:            { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  price:           { fontSize: 14, fontWeight: '700', color: colors.sky, marginTop: 4 },
  stock:           { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  toggleBtn:       { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, alignItems: 'center' },
  toggleOn:        { backgroundColor: colors.emeraldDim, borderColor: colors.emerald + '50' },
  toggleOff:       { backgroundColor: colors.surface2, borderColor: colors.border },
  toggleText:      { fontSize: 12, fontWeight: '700' },
});
