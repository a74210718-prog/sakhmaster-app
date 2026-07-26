import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const PERIODS = [
  { key: 'month',   label: 'Месяц' },
  { key: 'quarter', label: 'Квартал' },
  { key: 'year',    label: 'Год' },
  { key: 'all',     label: 'Всё время' },
];

interface Tx {
  id: number; type: 'in' | 'out';
  amount: number; fee: number;
  description: string; created_at: string;
}

interface Totals { income: number; expense: number; fees: number }

export default function IpFinanceScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [period,     setPeriod]     = useState('month');
  const [totals,     setTotals]     = useState<Totals>({ income: 0, expense: 0, fees: 0 });
  const [txs,        setTxs]        = useState<Tx[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, pd = period, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/ip/finance', { params: { period: pd, page: p } });
      setTotals(data.totals);
      setTxs(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [period]);

  useEffect(() => { load(1, period); }, [period]);

  const renderTx = ({ item }: { item: Tx }) => (
    <View style={st.txRow}>
      <View style={[st.txDot, { backgroundColor: item.type === 'in' ? colors.emerald : colors.rose }]} />
      <View style={{ flex: 1 }}>
        <Text style={st.txDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={st.txDate}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[st.txAmt, { color: item.type === 'in' ? colors.emerald : colors.rose }]}>
          {item.type === 'in' ? '+' : '−'}{item.amount.toLocaleString('ru')} ₽
        </Text>
        {item.fee > 0 && <Text style={st.txFee}>комиссия {item.fee.toLocaleString('ru')} ₽</Text>}
      </View>
    </View>
  );

  return (
    <View style={st.root}>
      <View style={[st.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={st.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={st.title}>Финансы ИП</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Фильтр периода */}
      <View style={st.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[st.periodBtn, period === p.key && st.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[st.periodText, period === p.key && st.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Итоги */}
      {!loading && (
        <View style={st.totalsRow}>
          <View style={st.totalItem}>
            <Text style={st.totalLbl}>Доход</Text>
            <Text style={[st.totalVal, { color: colors.emerald }]}>{totals.income.toLocaleString('ru')} ₽</Text>
          </View>
          <View style={st.totalItem}>
            <Text style={st.totalLbl}>Расход</Text>
            <Text style={[st.totalVal, { color: colors.rose }]}>{totals.expense.toLocaleString('ru')} ₽</Text>
          </View>
          <View style={st.totalItem}>
            <Text style={st.totalLbl}>Комиссия</Text>
            <Text style={[st.totalVal, { color: colors.amber }]}>{totals.fees.toLocaleString('ru')} ₽</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, period, true); }} tintColor={colors.amber} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, period, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
              <Text style={{ color: colors.textMuted }}>Транзакций нет</Text>
            </View>
          }
          renderItem={renderTx}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:           { color: colors.amber, fontSize: 16 },
  title:          { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  periodRow:      { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  periodBtn:      { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  periodBtnActive:{ backgroundColor: colors.amberDim ?? colors.amber + '20', borderColor: colors.amber },
  periodText:     { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  periodTextActive: { color: colors.amber },
  totalsRow:      { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  totalItem:      { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: colors.border },
  totalLbl:       { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  totalVal:       { fontSize: 14, fontWeight: '700' },
  txRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  txDot:          { width: 8, height: 8, borderRadius: 4 },
  txDesc:         { fontSize: 14, color: colors.textPrimary },
  txDate:         { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmt:          { fontSize: 15, fontWeight: '700' },
  txFee:          { fontSize: 10, color: colors.textMuted },
});
