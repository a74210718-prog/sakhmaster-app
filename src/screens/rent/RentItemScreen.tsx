import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const { width: W } = Dimensions.get('window');

interface ToolDetail {
  id: number; name: string; description: string | null;
  condition: string; brand: string | null; model: string | null;
  rate_per_day: number | null; rate_per_hour: number | null;
  rate_per_week: number | null; deposit_required: boolean; deposit_amount: number | null;
  delivery_available: boolean; self_pickup_available: boolean; pickup_address: string | null;
  requires_passport: boolean; requires_contract: boolean;
  photos: string[]; image_url: string | null;
  owner: { id: number; name: string; avatar_url: string | null } | null;
  category: { id: number; name: string } | null;
}

const RATE_LABELS: Record<string, string> = {
  day: 'сутки', hour: 'час', week: 'неделю', month: 'месяц',
};

export default function RentItemScreen({ route, navigation }: any) {
  const { id } = route.params;
  const insets  = useSafeAreaInsets();
  const [tool, setTool]       = useState<ToolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rent/tools/${id}`);
        setTool(data.data);
      } catch { navigation.goBack(); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={colors.emerald} size="large" /></View>;
  }
  if (!tool) return null;

  const rates = [
    tool.rate_per_hour  && { key: 'hour',  value: tool.rate_per_hour },
    tool.rate_per_day   && { key: 'day',   value: tool.rate_per_day },
    tool.rate_per_week  && { key: 'week',  value: tool.rate_per_week },
  ].filter(Boolean) as { key: string; value: number }[];

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Фото-заглушка */}
        {tool.photos.length > 0 ? (
          <View style={s.imgWrap}>
            <View style={s.imgPlaceholder}><Text style={{ fontSize: 70 }}>🔧</Text></View>
          </View>
        ) : (
          <View style={s.imgPlaceholder}><Text style={{ fontSize: 70 }}>🔧</Text></View>
        )}

        <View style={s.body}>
          <Text style={s.title}>{tool.name}</Text>
          {tool.brand && <Text style={s.sub}>Бренд: {tool.brand}{tool.model ? ' ' + tool.model : ''}</Text>}
          <Text style={s.condLabel}>Состояние: {tool.condition}</Text>
          {tool.category && <Text style={s.catLabel}>{tool.category.name}</Text>}

          {/* Тарифы */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>ТАРИФЫ</Text>
            <View style={s.ratesGrid}>
              {rates.map((r) => (
                <View key={r.key} style={s.rateBox}>
                  <Text style={s.rateVal}>{r.value.toLocaleString('ru')} ₽</Text>
                  <Text style={s.rateLabel}>за {RATE_LABELS[r.key]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Залог */}
          {tool.deposit_required && (
            <View style={s.depositBox}>
              <Text style={s.depositText}>
                💰 Залог: {tool.deposit_amount?.toLocaleString('ru')} ₽ (возвращается после возврата инструмента)
              </Text>
            </View>
          )}

          {/* Условия */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>УСЛОВИЯ</Text>
            {tool.self_pickup_available && <Text style={s.condRow}>🏪 Самовывоз: {tool.pickup_address ?? 'по договорённости'}</Text>}
            {tool.delivery_available     && <Text style={s.condRow}>🚚 Доставка доступна</Text>}
            {tool.requires_passport      && <Text style={s.condRow}>📋 Требуется копия паспорта</Text>}
            {tool.requires_contract      && <Text style={s.condRow}>📝 Требуется подпись договора</Text>}
          </View>

          {/* Описание */}
          {tool.description ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ОПИСАНИЕ</Text>
              <Text style={s.desc}>{tool.description}</Text>
            </View>
          ) : null}

          {/* Владелец */}
          {tool.owner ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ВЛАДЕЛЕЦ</Text>
              <View style={s.ownerRow}>
                <View style={s.ownerAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
                <Text style={s.ownerName}>{tool.owner.name}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Кнопка «Забронировать» */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={s.bookBtn}
          onPress={() => navigation.navigate('RentBooking', { tool })}
        >
          <Text style={s.bookBtnText}>📅 Забронировать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header:      { paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:     { alignSelf: 'flex-start', padding: 4 },
  backText:    { color: colors.emerald, fontSize: 16 },
  imgWrap:     { height: 220, backgroundColor: colors.surface2 },
  imgPlaceholder:{ height: 220, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  body:        { padding: 16, gap: 6 },
  title:       { fontSize: 20, fontWeight: '700', color: colors.textPrimary, lineHeight: 27 },
  sub:         { fontSize: 13, color: colors.textMuted },
  condLabel:   { fontSize: 13, color: colors.amber },
  catLabel:    { fontSize: 12, color: colors.sky },
  section:     { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border },
  sectionLabel:{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  ratesGrid:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  rateBox:     { backgroundColor: colors.emeraldDim, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.emerald + '40' },
  rateVal:     { fontSize: 18, fontWeight: '700', color: colors.emerald },
  rateLabel:   { fontSize: 11, color: colors.emerald + 'aa', marginTop: 2 },
  depositBox:  { backgroundColor: colors.amberDim, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.amber + '40', marginTop: 10 },
  depositText: { fontSize: 13, color: colors.amber, lineHeight: 19 },
  condRow:     { fontSize: 13, color: colors.textSecondary, marginBottom: 6, lineHeight: 19 },
  desc:        { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  ownerRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  ownerName:   { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
  bookBtn:     { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
