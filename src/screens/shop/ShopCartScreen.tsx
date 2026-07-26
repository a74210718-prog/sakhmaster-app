import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useCartStore, CartItem } from '../../store/cartStore';

export default function ShopCartScreen({ navigation }: any) {
  const insets    = useSafeAreaInsets();
  const { items, shopName, removeItem, updateQty, clear, total, count } = useCartStore();
  const totalAmt  = total();
  const totalCnt  = count();

  const handleClear = () => {
    Alert.alert('Очистить корзину', 'Удалить все товары?', [
      { text: 'Удалить', style: 'destructive', onPress: clear },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={s.card}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.img} resizeMode="cover" />
      ) : (
        <View style={[s.img, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 22 }}>📦</Text>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.cardPrice}>{(item.sale_price ?? item.price).toLocaleString('ru')} ₽/{item.unit}</Text>
        <View style={s.qtyRow}>
          <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.material_id, item.quantity - 1)}>
            <Text style={s.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.material_id, item.quantity + 1)}>
            <Text style={s.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={s.subtotal}>{((item.sale_price ?? item.price) * item.quantity).toLocaleString('ru')} ₽</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.material_id)} style={s.delBtn}>
        <Text style={{ color: colors.rose, fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Корзина</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={{ color: colors.rose, fontSize: 14 }}>Очистить</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
          <Text style={s.emptyText}>Корзина пуста</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Shop')}>
            <Text style={s.emptyBtnText}>Перейти в магазин</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {shopName && <Text style={s.shopLabel}>🏪 {shopName}</Text>}
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.material_id)}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
            renderItem={renderItem}
          />
          {/* Итого + кнопка */}
          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={s.footerRow}>
              <Text style={s.footerLabel}>Итого ({totalCnt} поз.):</Text>
              <Text style={s.footerTotal}>{totalAmt.toLocaleString('ru')} ₽</Text>
            </View>
            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={() => navigation.navigate('ShopCheckout')}
            >
              <Text style={s.checkoutBtnText}>Оформить заказ →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:          { color: colors.emerald, fontSize: 16 },
  title:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  shopLabel:     { fontSize: 13, color: colors.textMuted, paddingHorizontal: 16, marginBottom: 4 },
  card:          { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  img:           { width: 70, height: 70, borderRadius: 10 },
  cardBody:      { flex: 1 },
  cardTitle:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 18, marginBottom: 4 },
  cardPrice:     { fontSize: 13, color: colors.emerald, fontWeight: '600', marginBottom: 6 },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:        { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyBtnText:    { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  qtyVal:        { fontSize: 14, fontWeight: '700', color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  subtotal:      { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginLeft: 4 },
  delBtn:        { padding: 4, alignSelf: 'flex-start' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:     { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginBottom: 20 },
  emptyBtn:      { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 14 },
  footerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  footerLabel:   { fontSize: 14, color: colors.textSecondary },
  footerTotal:   { fontSize: 20, fontWeight: '700', color: colors.emerald },
  checkoutBtn:   { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  checkoutBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
