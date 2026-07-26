import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { useCartStore } from '../../store/cartStore';

const { width: W } = Dimensions.get('window');

interface ItemDetail {
  id: number; title: string; description: string | null;
  price: number; sale_price: number | null; unit: string;
  stock_quantity: number; sku: string | null; brand: string | null;
  photos: string[]; image_url: string | null;
  shop: { id: number; name: string; logo: string | null; address: string | null; phone: string | null; description: string | null } | null;
}

export default function ShopItemScreen({ route, navigation }: any) {
  const { id } = route.params;
  const insets  = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.count)();

  const [item, setItem]       = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [qty, setQty]         = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/shop/items/${id}`);
        setItem(data.data);
      } catch { navigation.goBack(); }
      setLoading(false);
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    const error = addItem({
      material_id: item.id,
      title:       item.title,
      price:       item.price,
      sale_price:  item.sale_price,
      unit:        item.unit,
      image_url:   item.photos[0] ?? item.image_url,
      shop_id:     item.shop?.id ?? 0,
      shop_name:   item.shop?.name ?? '',
    });
    if (error) {
      Alert.alert('Другой магазин', error, [
        { text: 'Очистить корзину', style: 'destructive', onPress: () => { useCartStore.getState().clear(); handleAddToCart(); } },
        { text: 'Отмена', style: 'cancel' },
      ]);
    } else {
      Alert.alert('✓ Добавлено', `«${item.title}» в корзине`, [
        { text: 'В корзину', onPress: () => navigation.navigate('ShopCart') },
        { text: 'Продолжить', style: 'cancel' },
      ]);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={colors.emerald} size="large" /></View>;
  }
  if (!item) return null;

  const photos = item.photos.length > 0 ? item.photos : (item.image_url ? [item.image_url] : []);
  const effectivePrice = item.sale_price ?? item.price;

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cartBtn} onPress={() => navigation.navigate('ShopCart')}>
          <Text style={{ fontSize: 22 }}>🛒</Text>
          {cartCount > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Галерея */}
        {photos.length > 0 ? (
          <View>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            >
              {photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={{ width: W, height: 280 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={s.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[s.dot, photoIdx === i && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.imgPlaceholder}><Text style={{ fontSize: 60 }}>🛍️</Text></View>
        )}

        <View style={s.body}>
          {/* Название + цена */}
          <Text style={s.title}>{item.title}</Text>
          {item.sku && <Text style={s.sku}>Артикул: {item.sku}</Text>}
          {item.brand && <Text style={s.brand}>Бренд: {item.brand}</Text>}

          <View style={s.priceRow}>
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
            <Text style={s.stock}>Остаток: {item.stock_quantity} {item.unit}</Text>
          </View>

          {/* Счётчик количества */}
          <View style={s.qtyRow}>
            <Text style={s.qtyLabel}>Количество:</Text>
            <View style={s.qtyControl}>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                <Text style={s.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.qtyVal}>{qty} {item.unit}</Text>
              <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.min(item.stock_quantity, q + 1))}>
                <Text style={s.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Итого */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Итого:</Text>
            <Text style={s.totalAmount}>{(effectivePrice * qty).toLocaleString('ru')} ₽</Text>
          </View>

          {/* Описание */}
          {item.description ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ОПИСАНИЕ</Text>
              <Text style={s.desc}>{item.description}</Text>
            </View>
          ) : null}

          {/* Магазин-продавец */}
          {item.shop ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ПРОДАВЕЦ</Text>
              <TouchableOpacity style={s.shopRow} onPress={() => navigation.navigate('ShopStore', { id: item.shop!.id })} activeOpacity={0.8}>
                {item.shop.logo ? (
                  <Image source={{ uri: item.shop.logo }} style={s.shopLogo} />
                ) : (
                  <View style={[s.shopLogo, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.shopName}>{item.shop.name}</Text>
                  {item.shop.address && <Text style={s.shopAddr} numberOfLines={1}>{item.shop.address}</Text>}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Кнопка «В корзину» */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.addBtn} onPress={handleAddToCart}>
          <Text style={s.addBtnText}>🛒 В корзину — {(effectivePrice * qty).toLocaleString('ru')} ₽</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:       { padding: 4 },
  backText:      { color: colors.emerald, fontSize: 16 },
  cartBtn:       { position: 'relative', padding: 4 },
  badge:         { position: 'absolute', top: 0, right: 0, backgroundColor: colors.rose, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText:     { color: '#fff', fontSize: 9, fontWeight: '700' },
  imgPlaceholder:{ height: 280, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  dots:          { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -20, paddingBottom: 8 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:     { backgroundColor: '#fff', width: 18 },
  body:          { padding: 16, gap: 8 },
  title:         { fontSize: 20, fontWeight: '700', color: colors.textPrimary, lineHeight: 27 },
  sku:           { fontSize: 12, color: colors.textMuted },
  brand:         { fontSize: 12, color: colors.textMuted },
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  price:         { fontSize: 22, fontWeight: '700', color: colors.emerald },
  salePrice:     { fontSize: 22, fontWeight: '700', color: colors.rose },
  oldPrice:      { fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through' },
  stock:         { fontSize: 12, color: colors.textMuted },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderColor: colors.border, marginTop: 4 },
  qtyLabel:      { fontSize: 14, color: colors.textSecondary },
  qtyControl:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyBtnText:    { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  qtyVal:        { fontSize: 16, fontWeight: '700', color: colors.textPrimary, minWidth: 60, textAlign: 'center' },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderColor: colors.border },
  totalLabel:    { fontSize: 14, color: colors.textSecondary },
  totalAmount:   { fontSize: 20, fontWeight: '700', color: colors.emerald },
  section:       { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border },
  sectionLabel:  { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  desc:          { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  shopRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface2, borderRadius: 12, padding: 12 },
  shopLogo:      { width: 44, height: 44, borderRadius: 10 },
  shopName:      { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  shopAddr:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
  addBtn:        { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
});
