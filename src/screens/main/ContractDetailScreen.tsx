import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:              { label: 'Черновик',               color: '#6b7280' },
  customer_signed:    { label: 'Подписан заказчиком',    color: colors.amber },
  contractor_signed:  { label: 'Подписан исполнителем',  color: colors.amber },
  both_signed:        { label: 'Подписан обеими сторонами', color: colors.emerald },
  cancelled:          { label: 'Отменён',                color: colors.rose },
  completed:          { label: 'Завершён',               color: colors.emerald },
};

interface ContractDetail {
  id: number; contract_number: string; status: string; status_label: string;
  total_amount: number; works_amount: number; materials_amount: number;
  logistics_amount: number; platform_commission: number; contractor_payout: number;
  both_signed: boolean; can_sign: boolean; have_pdf: boolean;
  i_am_customer: boolean;
  is_signed_by_customer: boolean; is_signed_by_contractor: boolean;
  customer_signed_at: string | null; contractor_signed_at: string | null;
  order: { id: number; title: string; description?: string } | null;
  customer: { id: number; name: string } | null;
  contractor: { id: number; name: string } | null;
  contract_data: Record<string, any> | null;
  created_at: string;
}

export default function ContractDetailScreen({ route, navigation }: any) {
  const { id } = route.params as { id: number };
  const insets = useSafeAreaInsets();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [signing,  setSigning]  = useState(false);

  useEffect(() => {
    api.get(`/contracts/${id}`)
      .then(r => setContract(r.data.data))
      .catch(() => { Alert.alert('Ошибка', 'Не удалось загрузить договор'); navigation.goBack(); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSign = () => {
    if (!contract) return;
    Alert.alert(
      'Подписать договор?',
      'Подписание договора означает ваше согласие со всеми условиями.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подписать',
          onPress: async () => {
            setSigning(true);
            try {
              const { data } = await api.post(`/contracts/${id}/sign`, {});
              setContract(data.data);
              Alert.alert('✓ Подписано!', data.data.both_signed ? 'Договор подписан обеими сторонами.' : 'Ожидаем подписи второй стороны.');
            } catch (e: any) {
              Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось подписать');
            } finally {
              setSigning(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.emerald} size="large" />
    </View>
  );

  if (!contract) return null;

  const st = STATUS_MAP[contract.status] ?? { label: contract.status_label, color: colors.textMuted };
  const needsMySign = contract.can_sign && !(contract.i_am_customer ? contract.is_signed_by_customer : contract.is_signed_by_contractor);

  const data = contract.contract_data ?? {};

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{contract.contract_number}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 100 }}>
        {/* Статус */}
        <View style={[s.statusCard, { borderColor: st.color + '40', backgroundColor: st.color + '12' }]}>
          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
          {contract.customer_signed_at && (
            <Text style={s.signDate}>Заказчик: {new Date(contract.customer_signed_at).toLocaleDateString('ru')}</Text>
          )}
          {contract.contractor_signed_at && (
            <Text style={s.signDate}>Исполнитель: {new Date(contract.contractor_signed_at).toLocaleDateString('ru')}</Text>
          )}
        </View>

        {/* Заказ */}
        {contract.order && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ПРЕДМЕТ ДОГОВОРА</Text>
            <Text style={s.fieldValue}>{contract.order.title}</Text>
            {data.order_description && <Text style={s.fieldMuted}>{data.order_description}</Text>}
          </View>
        )}

        {/* Стороны */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>СТОРОНЫ</Text>
          <View style={s.partiesRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.partyRole}>Заказчик</Text>
              <Text style={s.partyName}>{contract.customer?.name ?? data.customer_name ?? '—'}</Text>
              {contract.is_signed_by_customer
                ? <Text style={[s.signed, { color: colors.emerald }]}>✓ Подписал</Text>
                : <Text style={[s.signed, { color: colors.textMuted }]}>— Не подписал</Text>}
            </View>
            <View style={s.vs}><Text style={{ color: colors.textMuted }}>vs</Text></View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={s.partyRole}>Исполнитель</Text>
              <Text style={[s.partyName, { textAlign: 'right' }]}>{contract.contractor?.name ?? data.contractor_name ?? '—'}</Text>
              {contract.is_signed_by_contractor
                ? <Text style={[s.signed, { color: colors.emerald }]}>✓ Подписал</Text>
                : <Text style={[s.signed, { color: colors.textMuted }]}>— Не подписал</Text>}
            </View>
          </View>
        </View>

        {/* Суммы */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ФИНАНСЫ</Text>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Работы</Text>
            <Text style={s.finVal}>{contract.works_amount.toLocaleString('ru')} ₽</Text>
          </View>
          {contract.materials_amount > 0 && (
            <View style={s.finRow}>
              <Text style={s.finLabel}>Материалы</Text>
              <Text style={s.finVal}>{contract.materials_amount.toLocaleString('ru')} ₽</Text>
            </View>
          )}
          {contract.logistics_amount > 0 && (
            <View style={s.finRow}>
              <Text style={s.finLabel}>Логистика</Text>
              <Text style={s.finVal}>{contract.logistics_amount.toLocaleString('ru')} ₽</Text>
            </View>
          )}
          <View style={[s.finRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
            <Text style={[s.finLabel, { fontWeight: '700', color: colors.textPrimary }]}>Итого</Text>
            <Text style={[s.finVal, { color: colors.emerald, fontWeight: '800', fontSize: 17 }]}>{contract.total_amount.toLocaleString('ru')} ₽</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Комиссия платформы</Text>
            <Text style={[s.finVal, { color: colors.textMuted }]}>{contract.platform_commission.toLocaleString('ru')} ₽</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Выплата исполнителю</Text>
            <Text style={[s.finVal, { color: colors.amber }]}>{contract.contractor_payout.toLocaleString('ru')} ₽</Text>
          </View>
        </View>
      </ScrollView>

      {/* Подписать */}
      {needsMySign && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.signBtn} onPress={handleSign} disabled={signing}>
            {signing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.signBtnText}>✍️ Подписать договор</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:       { color: colors.emerald, fontSize: 16 },
  title:      { fontSize: 16, fontWeight: '700', color: colors.textPrimary, maxWidth: '60%' },
  statusCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  statusText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  signDate:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  section:    { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  fieldMuted: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  partiesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vs:         { width: 24, alignItems: 'center', paddingTop: 8 },
  partyRole:  { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  partyName:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  signed:     { fontSize: 12, fontWeight: '600', marginTop: 4 },
  finRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  finLabel:   { fontSize: 13, color: colors.textMuted },
  finVal:     { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 12 },
  signBtn:    { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  signBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
