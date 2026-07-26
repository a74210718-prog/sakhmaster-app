import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const FILTERS = [
  { key: '',                label: 'Все' },
  { key: 'pending_payment', label: 'Ожидают' },
  { key: 'active',          label: 'Активные' },
  { key: 'returned',        label: 'Возвращены' },
  { key: 'cancelled',       label: 'Отменены' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_passport: { label: 'Нужен паспорт',    color: colors.amber },
  pending_payment:  { label: 'Ожидает оплаты',   color: colors.amber },
  active:           { label: 'Активно',           color: colors.emerald },
  returned:         { label: 'Возвращён',         color: '#6b7280' },
  cancelled:        { label: 'Отменено',          color: colors.rose },
  rescheduled:      { label: 'Предложено время',  color: colors.sky },
};

interface Booking {
  id: number; booking_number: string; status: string; status_label: string;
  rate_type: string; rate_unit: string; period_count: number;
  total_amount: number; owner_payout: number; delivery_type: string;
  starts_at: string | null; ends_at: string | null;
  renter: { id: number; name: string; phone: string | null } | null;
  tool: { id: number; name: string } | null;
  created_at: string;
}

export default function RentCabinetBookingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState('');
  const [bookings,     setBookings]     = useState<Booking[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [page,         setPage]         = useState(1);
  const [lastPage,     setLastPage]     = useState(1);

  // Modal для возврата
  const [returnModal,  setReturnModal]  = useState(false);
  const [returnTarget, setReturnTarget] = useState<Booking | null>(null);
  const [returnNote,   setReturnNote]   = useState('');

  const load = useCallback(async (p = 1, sf = statusFilter, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/rent-cabinet/bookings', { params: { status: sf, page: p } });
      setBookings(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  useEffect(() => { load(1, statusFilter); }, [statusFilter]);

  const handleConfirm = (booking: Booking) => {
    Alert.alert('Подтвердить бронирование?', `${booking.booking_number} — ${booking.renter?.name ?? ''}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Подтвердить',
        onPress: async () => {
          try {
            const { data } = await api.patch(`/rent-cabinet/bookings/${booking.id}/confirm`, {});
            setBookings(prev => prev.map(b => b.id === booking.id ? data.data : b));
          } catch (e: any) {
            Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось подтвердить');
          }
        },
      },
    ]);
  };

  const openReturnModal = (booking: Booking) => {
    setReturnTarget(booking);
    setReturnNote('');
    setReturnModal(true);
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    try {
      const { data } = await api.patch(`/rent-cabinet/bookings/${returnTarget.id}/returned`, {
        return_note: returnNote,
        return_condition: 'good',
      });
      setBookings(prev => prev.map(b => b.id === returnTarget.id ? data.data : b));
      setReturnModal(false);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось отметить возврат');
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted };
    const canConfirm = item.status === 'pending_payment';
    const canReturn  = item.status === 'active';

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.bookNum}>{item.booking_number}</Text>
            <Text style={s.toolName}>{item.tool?.name ?? '—'}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {item.renter && (
          <Text style={s.meta}>👤 {item.renter.name}{item.renter.phone ? ` · ${item.renter.phone}` : ''}</Text>
        )}
        {(item.starts_at || item.ends_at) && (
          <Text style={s.meta}>📅 {item.starts_at ?? '?'} — {item.ends_at ?? '?'}</Text>
        )}
        <Text style={s.meta}>
          {item.delivery_type === 'pickup' ? '🏪 Самовывоз' : '🚚 Доставка'}
          {' · '}{item.period_count} {item.rate_unit}
        </Text>

        <View style={s.cardBottom}>
          <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.total}>{item.total_amount.toLocaleString('ru')} ₽</Text>
            {item.owner_payout > 0 && item.owner_payout !== item.total_amount && (
              <Text style={s.payout}>выплата: {item.owner_payout.toLocaleString('ru')} ₽</Text>
            )}
          </View>
        </View>

        {(canConfirm || canReturn) && (
          <View style={s.actions}>
            {canConfirm && (
              <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirm(item)}>
                <Text style={s.confirmBtnText}>✓ Подтвердить</Text>
              </TouchableOpacity>
            )}
            {canReturn && (
              <TouchableOpacity style={s.returnBtn} onPress={() => openReturnModal(item)}>
                <Text style={s.returnBtnText}>↩ Возврат</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Бронирования</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.filterWrap}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[s.filterBtn, statusFilter === f.key && s.filterBtnActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[s.filterText, statusFilter === f.key && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={b => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, statusFilter, true); }} tintColor={colors.emerald} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, statusFilter, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Бронирований нет</Text>
            </View>
          }
          renderItem={renderBooking}
        />
      )}

      {/* Модалка возврата */}
      <Modal visible={returnModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Отметить возврат</Text>
            <Text style={s.modalSub}>{returnTarget?.booking_number} — {returnTarget?.renter?.name}</Text>
            <TextInput
              style={s.modalInput}
              value={returnNote}
              onChangeText={setReturnNote}
              placeholder="Примечание о состоянии (необязательно)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setReturnModal(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnConfirm} onPress={handleReturn}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Подтвердить возврат</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:           { color: colors.emerald, fontSize: 16 },
  title:          { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  filterWrap:     { marginBottom: 8 },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterBtnActive:{ backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  filterText:     { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterTextActive:{ color: colors.emerald },
  card:           { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bookNum:        { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  toolName:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge:          { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:      { fontSize: 11, fontWeight: '600' },
  meta:           { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  date:           { fontSize: 12, color: colors.textMuted },
  total:          { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  payout:         { fontSize: 11, color: colors.textMuted },
  actions:        { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn:     { flex: 1, backgroundColor: colors.emeraldDim, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.emerald + '50' },
  confirmBtnText: { color: colors.emerald, fontWeight: '700', fontSize: 14 },
  returnBtn:      { flex: 1, backgroundColor: colors.surface2, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  returnBtnText:  { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  modalSub:       { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  modalInput:     { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 14 },
  modalBtns:      { flexDirection: 'row', gap: 10 },
  modalBtnCancel: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  modalBtnConfirm:{ flex: 2, backgroundColor: colors.emerald, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
});
