import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fleaApi, FleaDeal } from '../../api/flea';

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending:   { label: 'Ожидает ответа',   color: colors.amber,   emoji: '⏳' },
  paid:      { label: 'Оплачен',           color: colors.sky,     emoji: '💳' },
  completed: { label: 'Завершён',          color: colors.emerald, emoji: '✅' },
  cancelled: { label: 'Отменён',           color: colors.textMuted, emoji: '✕' },
  disputed:  { label: 'Спор',             color: colors.rose,    emoji: '⚠️' },
};

export default function FleaDealsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [deals,      setDeals]      = useState<FleaDeal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await fleaApi.deals(p);
      setDeals(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleConfirm = (deal: FleaDeal) => {
    Alert.alert(
      'Подтвердить получение?',
      'Подтвердите, что получили товар. После этого сделка будет завершена.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: async () => {
            try {
              const { data } = await fleaApi.confirmDeal(deal.id);
              setDeals(prev => prev.map(d => d.id === deal.id ? data.data : d));
            } catch (e: any) {
              Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось подтвердить');
            }
          },
        },
      ]
    );
  };

  const handleCancel = (deal: FleaDeal) => {
    Alert.alert('Отменить заявку?', 'Заявка на покупку будет отменена.', [
      { text: 'Назад', style: 'cancel' },
      {
        text: 'Отменить', style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await fleaApi.cancelDeal(deal.id);
            setDeals(prev => prev.map(d => d.id === deal.id ? data.data : d));
          } catch (e: any) {
            Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось отменить');
          }
        },
      },
    ]);
  };

  const renderDeal = ({ item }: { item: FleaDeal }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted, emoji: '?' };
    const canConfirm = item.status === 'paid' && !item.buyer_confirmed_at;
    const canCancel  = item.status === 'pending' || item.status === 'paid';

    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          {item.listing_photo ? (
            <Image source={{ uri: item.listing_photo }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, s.thumbPlaceholder]}>
              <Text style={{ fontSize: 22 }}>🏷️</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle} numberOfLines={2}>{item.listing_title ?? 'Товар'}</Text>
            <Text style={s.price}>{item.amount.toLocaleString('ru')} ₽</Text>
            {item.seller && <Text style={s.seller}>Продавец: {item.seller.name}</Text>}
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.emoji} {st.label}</Text>
          </View>
        </View>

        {item.buyer_message ? (
          <Text style={s.msg}>💬 {item.buyer_message}</Text>
        ) : null}

        {item.cancel_reason ? (
          <Text style={s.cancelReason}>Причина отмены: {item.cancel_reason}</Text>
        ) : null}

        <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>

        {(canConfirm || canCancel) && (
          <View style={s.actions}>
            {canConfirm && (
              <TouchableOpacity style={[s.btn, s.btnConfirm]} onPress={() => handleConfirm(item)}>
                <Text style={s.btnTextConfirm}>✓ Получил товар</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={() => handleCancel(item)}>
                <Text style={s.btnTextCancel}>Отменить</Text>
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
        <Text style={s.title}>Мои покупки</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1, true); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🛒</Text>
              <Text style={s.emptyText}>Покупок ещё нет</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('Tabs', { screen: 'Flea' })}
              >
                <Text style={s.emptyBtnText}>Перейти в барахолку</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderDeal}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:        { color: colors.emerald, fontSize: 16 },
  title:       { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:        { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardTop:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb:       { width: 64, height: 64, borderRadius: 10 },
  thumbPlaceholder: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  itemTitle:   { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  price:       { fontSize: 15, fontWeight: '700', color: colors.emerald, marginTop: 4 },
  seller:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge:       { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:   { fontSize: 11, fontWeight: '600' },
  msg:         { fontSize: 13, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  cancelReason:{ fontSize: 12, color: colors.rose, marginTop: 6 },
  date:        { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  actions:     { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn:         { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  btnConfirm:  { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  btnCancel:   { backgroundColor: 'transparent', borderColor: colors.border },
  btnTextConfirm: { fontSize: 14, fontWeight: '700', color: colors.emerald },
  btnTextCancel:  { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyText:   { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginBottom: 20 },
  emptyBtn:    { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
});
