import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const RATE_LABELS: Record<string, string> = {
  day: 'суткам', hour: 'часам', week: 'неделям', month: 'месяцам',
};

const DELIVERY_OPTS = [
  { key: 'pickup',   label: '🏪 Самовывоз' },
  { key: 'delivery', label: '🚚 Доставка' },
];

export default function RentBookingScreen({ route, navigation }: any) {
  const { tool } = route.params;
  const insets   = useSafeAreaInsets();

  const availableRates = [
    tool.rate_per_hour && { key: 'hour',  value: tool.rate_per_hour },
    tool.rate_per_day  && { key: 'day',   value: tool.rate_per_day },
    tool.rate_per_week && { key: 'week',  value: tool.rate_per_week },
  ].filter(Boolean) as { key: string; value: number }[];

  const [rateType, setRateType]     = useState<string>(availableRates[0]?.key ?? 'day');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [startTime, setStartTime]   = useState('09:00');
  const [periodCount, setPeriodCount] = useState('2');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [loading, setLoading]       = useState(false);

  const selectedRate = availableRates.find((r) => r.key === rateType)?.value ?? 0;

  const calcTotal = (): number => {
    let periods = 0;
    if (rateType === 'hour') {
      periods = parseInt(periodCount) || 0;
    } else if (startDate && endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const days = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
      periods = rateType === 'week' ? Math.ceil(days / 7)
              : rateType === 'month' ? Math.ceil(days / 30)
              : days;
    }
    const subtotal = selectedRate * periods;
    const deposit  = tool.deposit_required ? (tool.deposit_amount ?? 0) : 0;
    return subtotal + deposit;
  };

  const validate = (): string | null => {
    if (!rateType) return 'Выберите тариф';
    if (rateType === 'hour') {
      if (!startDate) return 'Укажите дату начала';
      if (!periodCount || parseInt(periodCount) < 1) return 'Укажите количество часов';
    } else {
      if (!startDate) return 'Укажите дату начала';
      if (!endDate)   return 'Укажите дату окончания';
      if (new Date(endDate) <= new Date(startDate)) return 'Дата окончания должна быть после начала';
    }
    return null;
  };

  const handleBook = async () => {
    const err = validate();
    if (err) { Alert.alert('Ошибка', err); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/rent/bookings', {
        tool_id:       tool.id,
        rate_type:     rateType,
        start_date:    startDate,
        end_date:      rateType !== 'hour' ? endDate : undefined,
        start_time:    rateType === 'hour' ? startTime : undefined,
        period_count:  rateType === 'hour' ? parseInt(periodCount) : undefined,
        delivery_type: deliveryType,
      });

      const result = await WebBrowser.openAuthSessionAsync(data.payment_url, 'sakhmaster://');

      if (result.type === 'success' && result.url.includes('rent/booking-success')) {
        Alert.alert('✓ Забронировано!', `Бронирование ${data.booking_number} успешно оплачено`, [
          { text: 'Мои аренды', onPress: () => navigation.navigate('MyRentals') },
          { text: 'ОК' },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось создать бронирование');
    } finally {
      setLoading(false);
    }
  };

  const total = calcTotal();

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Бронирование</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 120 }}>
        {/* Инструмент */}
        <View style={s.card}>
          <Text style={s.label}>ИНСТРУМЕНТ</Text>
          <Text style={s.toolName}>{tool.name}</Text>
        </View>

        {/* Тариф */}
        <View style={s.card}>
          <Text style={s.label}>ТАРИФ</Text>
          <View style={s.rateRow}>
            {availableRates.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[s.rateBtn, rateType === r.key && s.rateBtnActive]}
                onPress={() => setRateType(r.key)}
              >
                <Text style={[s.rateVal, rateType === r.key && s.rateValActive]}>{r.value.toLocaleString('ru')} ₽</Text>
                <Text style={[s.rateUnit, rateType === r.key && { color: colors.emerald }]}>/{RATE_LABELS[r.key]?.replace('ам', 'у') ?? r.key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Даты */}
        <View style={s.card}>
          <Text style={s.label}>ДАТЫ</Text>
          <View style={s.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Дата начала (ГГГГ-ММ-ДД)</Text>
              <TextInput
                style={s.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-08-01"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            {rateType !== 'hour' && (
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Дата окончания</Text>
                <TextInput
                  style={s.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-08-05"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
          {rateType === 'hour' && (
            <View style={s.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Время начала (ЧЧ:ММ)</Text>
                <TextInput
                  style={s.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Количество часов</Text>
                <TextInput
                  style={s.input}
                  value={periodCount}
                  onChangeText={setPeriodCount}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          )}
        </View>

        {/* Способ получения */}
        {(tool.self_pickup_available || tool.delivery_available) && (
          <View style={s.card}>
            <Text style={s.label}>СПОСОБ ПОЛУЧЕНИЯ</Text>
            <View style={s.delivRow}>
              {DELIVERY_OPTS.filter((o) =>
                (o.key === 'pickup' && tool.self_pickup_available) ||
                (o.key === 'delivery' && tool.delivery_available)
              ).map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={[s.delivBtn, deliveryType === o.key && s.delivBtnActive]}
                  onPress={() => setDeliveryType(o.key as any)}
                >
                  <Text style={[s.delivText, deliveryType === o.key && { color: colors.emerald }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Стоимость */}
        {total > 0 && (
          <View style={s.totalCard}>
            <Text style={s.totalLabel}>К оплате:</Text>
            <Text style={s.totalAmt}>{total.toLocaleString('ru')} ₽</Text>
          </View>
        )}
        {tool.deposit_required && tool.deposit_amount > 0 && (
          <Text style={s.depositNote}>* Включая залог {tool.deposit_amount.toLocaleString('ru')} ₽ (возвращается)</Text>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.bookBtn} onPress={handleBook} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.bookBtnText}>Забронировать и оплатить →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:         { color: colors.emerald, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:         { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  label:        { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  toolName:     { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  rateRow:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  rateBtn:      { flex: 1, minWidth: 80, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, padding: 10, alignItems: 'center' },
  rateBtnActive:{ borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  rateVal:      { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  rateValActive:{ color: colors.emerald },
  rateUnit:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  inputRow:     { flexDirection: 'row', gap: 10 },
  inputLabel:   { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  input:        { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, color: colors.textPrimary, fontSize: 14 },
  delivRow:     { flexDirection: 'row', gap: 10 },
  delivBtn:     { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, paddingVertical: 10, alignItems: 'center' },
  delivBtnActive:{ borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  delivText:    { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  totalCard:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.emeraldDim, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.emerald + '40' },
  totalLabel:   { fontSize: 15, color: colors.textPrimary },
  totalAmt:     { fontSize: 22, fontWeight: '700', color: colors.emerald },
  depositNote:  { fontSize: 12, color: colors.textMuted, paddingHorizontal: 4 },
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
  bookBtn:      { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  bookBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
});
