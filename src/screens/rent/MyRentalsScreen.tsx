import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:             { label: 'Черновик',         color: '#6b7280' },
  pending_passport:  { label: 'Нужен паспорт',    color: colors.amber },
  pending_payment:   { label: 'Ожидает оплаты',   color: colors.sky },
  active:            { label: 'Активно',           color: colors.emerald },
  returned:          { label: 'Возвращён',         color: '#6b7280' },
  cancelled:         { label: 'Отменено',          color: colors.rose },
  disputed:          { label: 'Спор',              color: colors.rose },
  rescheduled:       { label: 'Предложено время',  color: colors.sky },
  completed:         { label: 'Завершено',         color: '#6b7280' },
};

interface Booking {
  id: number; booking_number: string; status: string; status_label: string;
  total_amount: number; rate_type: string; period_count: number;
  starts_at: string | null; ends_at: string | null; created_at: string;
  tool: { id: number; name: string; image_url: string | null } | null;
}

const RATE_UNIT: Record<string, string> = { day: 'сут', hour: 'ч', week: 'нед', month: 'мес' };

export default function MyRentalsScreen({ navigation }: any) {
  const insets  = useSafeAreaInsets();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/rent/my-rentals');
      setBookings(data.data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: Booking }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted };
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.bookingNum}>{item.booking_number}</Text>
            <Text style={s.toolName}>{item.tool?.name ?? '—'}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '50' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {(item.starts_at || item.ends_at) && (
          <Text style={s.dates}>
            📅 {item.starts_at ?? '?'} — {item.ends_at ?? '?'}
          </Text>
        )}

        <View style={s.cardBottom}>
          <Text style={s.period}>{item.period_count} {RATE_UNIT[item.rate_type] ?? item.rate_type}</Text>
          <Text style={s.totalAmt}>{item.total_amount.toLocaleString('ru')} ₽</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Мои аренды</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.emerald} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔧</Text>
              <Text style={s.emptyText}>Аренд ещё нет</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.goBack()}>
                <Text style={s.emptyBtnText}>Посмотреть каталог</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:         { color: colors.emerald, fontSize: 16 },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:         { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bookingNum:   { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  toolName:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  dates:        { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  period:       { fontSize: 13, color: colors.textMuted },
  totalAmt:     { fontSize: 16, fontWeight: '700', color: colors.emerald },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyText:    { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginBottom: 20 },
  emptyBtn:     { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
