import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { useCartStore } from '../../store/cartStore';

const DELIVERY_OPTS = [
  { key: 'pickup',        label: '🏪 Самовывоз из магазина',    hint: 'Вы заберёте заказ самостоятельно' },
  { key: 'shop_delivery', label: '🚚 Доставка от магазина',     hint: 'Магазин доставит по вашему адресу' },
];

export default function ShopCheckoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, shopId, shopName, total, clear } = useCartStore();
  const totalAmt = total();

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'shop_delivery'>('pickup');
  const [address, setAddress]           = useState('');
  const [comment, setComment]           = useState('');
  const [loading, setLoading]           = useState(false);

  const handleCheckout = async () => {
    if (deliveryType === 'shop_delivery' && !address.trim()) {
      Alert.alert('Укажите адрес', 'Введите адрес доставки для продолжения');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/shop/checkout', {
        shop_id:          shopId,
        items:            items.map((i) => ({ material_id: i.material_id, quantity: i.quantity })),
        delivery_type:    deliveryType,
        delivery_address: deliveryType !== 'pickup' ? address.trim() : null,
        comment:          comment.trim() || null,
      });

      const result = await WebBrowser.openAuthSessionAsync(data.payment_url, 'sakhmaster://');

      if (result.type === 'success' && result.url.includes('shop/order-success')) {
        clear();
        Alert.alert('✓ Заказ оформлен!', `Заказ ${data.order_number} успешно оплачен`, [
          { text: 'Мои заказы', onPress: () => navigation.navigate('ShopOrders') },
          { text: 'ОК' },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось создать заказ');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>Корзина пуста</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
          <Text style={s.btnText}>Вернуться</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Оформление заказа</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 120 }}>
        {/* Магазин */}
        <View style={s.card}>
          <Text style={s.label}>МАГАЗИН</Text>
          <Text style={s.shopName}>{shopName}</Text>
          <Text style={s.itemCount}>{items.length} {items.length === 1 ? 'позиция' : 'позиции'}</Text>
        </View>

        {/* Способ получения */}
        <View style={s.card}>
          <Text style={s.label}>СПОСОБ ПОЛУЧЕНИЯ</Text>
          {DELIVERY_OPTS.map((o) => (
            <TouchableOpacity
              key={o.key}
              style={[s.optBtn, deliveryType === o.key && s.optBtnActive]}
              onPress={() => setDeliveryType(o.key as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.optLabel, deliveryType === o.key && s.optLabelActive]}>{o.label}</Text>
                <Text style={s.optHint}>{o.hint}</Text>
              </View>
              <View style={[s.radio, deliveryType === o.key && s.radioActive]}>
                {deliveryType === o.key && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Адрес (только для доставки) */}
        {deliveryType === 'shop_delivery' && (
          <View style={s.card}>
            <Text style={s.label}>АДРЕС ДОСТАВКИ</Text>
            <TextInput
              style={s.input}
              placeholder="Улица, дом, квартира..."
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Комментарий */}
        <View style={s.card}>
          <Text style={s.label}>КОММЕНТАРИЙ (необязательно)</Text>
          <TextInput
            style={s.input}
            placeholder="Пожелания к заказу..."
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Итого */}
        <View style={s.card}>
          <Text style={s.label}>ИТОГО</Text>
          {items.map((i) => (
            <View key={i.material_id} style={s.lineRow}>
              <Text style={s.lineTitle} numberOfLines={1}>{i.title}</Text>
              <Text style={s.lineAmt}>{((i.sale_price ?? i.price) * i.quantity).toLocaleString('ru')} ₽</Text>
            </View>
          ))}
          <View style={[s.lineRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border }]}>
            <Text style={s.totalLabel}>К оплате:</Text>
            <Text style={s.totalAmt}>{totalAmt.toLocaleString('ru')} ₽</Text>
          </View>
        </View>
      </ScrollView>

      {/* Кнопка оплаты */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.btn} onPress={handleCheckout} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Оплатить {totalAmt.toLocaleString('ru')} ₽ →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:          { color: colors.emerald, fontSize: 16 },
  title:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:          { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  label:         { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  shopName:      { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  itemCount:     { fontSize: 13, color: colors.textMuted },
  optBtn:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  optBtnActive:  { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  optLabel:      { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  optLabelActive:{ color: colors.emerald },
  optHint:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:   { borderColor: colors.emerald },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.emerald },
  input:         { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.textPrimary, fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  lineRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineTitle:     { flex: 1, fontSize: 13, color: colors.textSecondary, marginRight: 8 },
  lineAmt:       { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  totalLabel:    { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  totalAmt:      { fontSize: 18, fontWeight: '700', color: colors.emerald },
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
  btn:           { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText:       { color: '#fff', fontWeight: '700', fontSize: 16 },
});
