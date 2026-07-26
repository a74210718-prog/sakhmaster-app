import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  draft:              { label: 'Черновик',               color: '#6b7280', emoji: '📝' },
  customer_signed:    { label: 'Подписан заказчиком',    color: colors.amber, emoji: '✍️' },
  contractor_signed:  { label: 'Подписан исполнителем',  color: colors.amber, emoji: '✍️' },
  both_signed:        { label: 'Подписан обеими',        color: colors.emerald, emoji: '✅' },
  cancelled:          { label: 'Отменён',                color: colors.rose, emoji: '✕' },
  completed:          { label: 'Завершён',               color: colors.emerald, emoji: '✓' },
};

interface Contract {
  id: number; contract_number: string; status: string; status_label: string;
  total_amount: number; both_signed: boolean; can_sign: boolean;
  i_am_customer: boolean;
  is_signed_by_customer: boolean; is_signed_by_contractor: boolean;
  order: { id: number; title: string } | null;
  customer: { id: number; name: string } | null;
  contractor: { id: number; name: string } | null;
  created_at: string;
}

export default function ContractsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [contracts,  setContracts]  = useState<Contract[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/contracts', { params: { page: p } });
      setContracts(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const renderItem = ({ item }: { item: Contract }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status_label, color: colors.textMuted, emoji: '?' };
    const counterparty = item.i_am_customer ? item.contractor : item.customer;
    const counterRole  = item.i_am_customer ? 'Исполнитель' : 'Заказчик';

    const iSignedLabel = item.i_am_customer
      ? item.is_signed_by_customer ? '✓ Вы подписали' : '— Ваша подпись нужна'
      : item.is_signed_by_contractor ? '✓ Вы подписали' : '— Ваша подпись нужна';

    const needsMySign = item.can_sign && !(item.i_am_customer ? item.is_signed_by_customer : item.is_signed_by_contractor);

    return (
      <TouchableOpacity
        style={[s.card, needsMySign && s.cardHighlight]}
        onPress={() => navigation.navigate('ContractDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.contractNum}>{st.emoji} {item.contract_number}</Text>
            {item.order && <Text style={s.orderTitle} numberOfLines={1}>{item.order.title}</Text>}
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {counterparty && (
          <Text style={s.meta}>{counterRole}: {counterparty.name}</Text>
        )}
        <Text style={s.meta}>{iSignedLabel}</Text>

        <View style={s.cardBottom}>
          <Text style={s.date}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
          <Text style={s.amount}>{item.total_amount.toLocaleString('ru')} ₽</Text>
        </View>

        {needsMySign && (
          <View style={s.signHint}>
            <Text style={s.signHintText}>✍️ Ожидает вашей подписи</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Мои договоры</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={c => String(c.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={colors.emerald} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📄</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Договоров нет</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                Договоры создаются автоматически при выполнении заказа
              </Text>
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
  cardHighlight:{ borderColor: colors.amber + '60', backgroundColor: colors.amberDim ?? colors.amber + '10' },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  contractNum:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  orderTitle:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  meta:         { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  date:         { fontSize: 12, color: colors.textMuted },
  amount:       { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  signHint:     { marginTop: 8, backgroundColor: colors.amber + '15', borderRadius: 8, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: colors.amber + '30' },
  signHintText: { fontSize: 13, fontWeight: '700', color: colors.amber },
});
