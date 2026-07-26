import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

interface SmzStatus {
  inn: string | null;
  inn_verified_at: string | null;
  fns_verified_status: string | null;
  tbank_recipient_id: string | null;
  tbank_recipient_status: string | null;
  smz_payout_method: 'sbp' | 'bank' | null;
  smz_payout_phone: string | null;
  smz_payout_bank_name: string | null;
  auto_payout: boolean;
}

const FNS_STATUS: Record<string, { label: string; color: string }> = {
  verified:   { label: '✓ Подтверждён ФНС', color: colors.emerald },
  pending:    { label: '⏳ Проверяется', color: colors.amber },
  not_found:  { label: '✕ Не найден в ФНС', color: colors.rose },
  error:      { label: '⚠ Ошибка проверки', color: colors.rose },
};

const TBANK_STATUS: Record<string, { label: string; color: string }> = {
  active:   { label: '✓ Подключён T-Bank', color: colors.emerald },
  created:  { label: '⏳ На проверке T-Bank', color: colors.amber },
  pending:  { label: '⏳ Ожидает данных', color: colors.amber },
  error:    { label: '✕ Ошибка T-Bank', color: colors.rose },
};

export default function SmzVerificationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [status, setStatus]       = useState<SmzStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [inn, setInn]             = useState('');
  const [savingInn, setSavingInn] = useState(false);
  const [method, setMethod]       = useState<'sbp' | 'bank'>('sbp');
  const [phone, setPhone]         = useState('');
  const [account, setAccount]     = useState('');
  const [bik, setBik]             = useState('');
  const [bankName, setBankName]   = useState('');
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    apiClient.get('/smz/status').then(({ data }) => {
      setStatus(data);
      setInn(data.inn ?? '');
      setMethod(data.smz_payout_method ?? 'sbp');
      setPhone(data.smz_payout_phone ?? '');
      setBankName(data.smz_payout_bank_name ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveInn = async () => {
    if (!/^\d{12}$/.test(inn)) {
      Alert.alert('Ошибка', 'ИНН должен содержать ровно 12 цифр');
      return;
    }
    setSavingInn(true);
    try {
      await apiClient.post('/smz/link-inn', { inn });
      const { data } = await apiClient.get('/smz/status');
      setStatus(data);
      Alert.alert('Готово', 'ИНН привязан. Проверка ФНС займёт несколько минут.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось привязать ИНН. Проверьте номер.');
    }
    setSavingInn(false);
  };

  const savePayout = async () => {
    if (method === 'sbp' && !/^\+?[\d\s\-]{10,}$/.test(phone)) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона для СБП');
      return;
    }
    if (method === 'bank' && (account.length < 20 || bik.length !== 9)) {
      Alert.alert('Ошибка', 'Проверьте номер счёта (20 цифр) и БИК (9 цифр)');
      return;
    }
    setSavingPayout(true);
    try {
      await apiClient.post('/smz/setup-payout', {
        method, phone: method === 'sbp' ? phone : undefined,
        account: method === 'bank' ? account : undefined,
        bik: method === 'bank' ? bik : undefined,
        bank_name: bankName || undefined,
      });
      Alert.alert('Готово', 'Реквизиты выплат сохранены');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить реквизиты');
    }
    setSavingPayout(false);
  };

  const fnsInfo  = FNS_STATUS[status?.fns_verified_status ?? ''];
  const tbankInfo = TBANK_STATUS[status?.tbank_recipient_status ?? ''];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Статус СМЗ</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}>

          {/* Статус-карточки */}
          <View style={s.statusRow}>
            {fnsInfo ? (
              <View style={[s.statusChip, { borderColor: fnsInfo.color + '50', backgroundColor: fnsInfo.color + '15' }]}>
                <Text style={[s.statusChipText, { color: fnsInfo.color }]}>{fnsInfo.label}</Text>
              </View>
            ) : (
              <View style={[s.statusChip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[s.statusChipText, { color: colors.textMuted }]}>ФНС: не проверялся</Text>
              </View>
            )}
            {tbankInfo ? (
              <View style={[s.statusChip, { borderColor: tbankInfo.color + '50', backgroundColor: tbankInfo.color + '15' }]}>
                <Text style={[s.statusChipText, { color: tbankInfo.color }]}>{tbankInfo.label}</Text>
              </View>
            ) : (
              <View style={[s.statusChip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[s.statusChipText, { color: colors.textMuted }]}>T-Bank: не подключён</Text>
              </View>
            )}
          </View>

          {/* ИНН */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>ИНН самозанятого</Text>
            <Text style={s.sectionSub}>
              Необходим для проверки статуса СМЗ в ФНС и получения выплат
            </Text>
            <TextInput
              style={s.input}
              placeholder="000000000000"
              placeholderTextColor={colors.textMuted}
              value={inn}
              onChangeText={setInn}
              keyboardType="number-pad"
              maxLength={12}
            />
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.emerald }]}
              onPress={saveInn}
              disabled={savingInn}
            >
              {savingInn
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{status?.inn ? 'Обновить ИНН' : 'Привязать ИНН'}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Реквизиты выплат */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Способ получения выплат</Text>
            <Text style={s.sectionSub}>
              На этот счёт будут перечисляться средства за выполненные заказы
            </Text>

            {/* Переключатель метода */}
            <View style={s.methodRow}>
              <TouchableOpacity
                style={[s.methodBtn, method === 'sbp' && s.methodBtnActive]}
                onPress={() => setMethod('sbp')}
              >
                <Text style={[s.methodBtnText, method === 'sbp' && s.methodBtnTextActive]}>СБП</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.methodBtn, method === 'bank' && s.methodBtnActive]}
                onPress={() => setMethod('bank')}
              >
                <Text style={[s.methodBtnText, method === 'bank' && s.methodBtnTextActive]}>Банковский счёт</Text>
              </TouchableOpacity>
            </View>

            {method === 'sbp' ? (
              <>
                <Text style={s.label}>Телефон (привязанный к СБП)</Text>
                <TextInput
                  style={s.input}
                  placeholder="+7 900 000-00-00"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <>
                <Text style={s.label}>Расчётный счёт (20 цифр)</Text>
                <TextInput
                  style={s.input}
                  placeholder="40802810000000000000"
                  placeholderTextColor={colors.textMuted}
                  value={account}
                  onChangeText={setAccount}
                  keyboardType="number-pad"
                  maxLength={20}
                />
                <Text style={s.label}>БИК банка (9 цифр)</Text>
                <TextInput
                  style={s.input}
                  placeholder="044525974"
                  placeholderTextColor={colors.textMuted}
                  value={bik}
                  onChangeText={setBik}
                  keyboardType="number-pad"
                  maxLength={9}
                />
                <Text style={s.label}>Название банка</Text>
                <TextInput
                  style={s.input}
                  placeholder="АО «ТБанк»"
                  placeholderTextColor={colors.textMuted}
                  value={bankName}
                  onChangeText={setBankName}
                />
              </>
            )}

            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.emerald }]}
              onPress={savePayout}
              disabled={savingPayout}
            >
              {savingPayout
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>Сохранить реквизиты</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={s.note}>
            Данные хранятся в зашифрованном виде. Выплаты производятся через T-Bank
            после завершения заказа и подтверждения клиентом.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: colors.bg },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  back:               { width: 60 },
  backText:           { color: colors.emerald, fontSize: 17 },
  title:              { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  statusRow:          { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  statusChip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  statusChipText:     { fontSize: 13, fontWeight: '600' },
  section:            { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sectionSub:         { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  label:              { fontSize: 13, color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input:              { backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  btn:                { marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText:            { color: '#fff', fontSize: 15, fontWeight: '700' },
  methodRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  methodBtn:          { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  methodBtnActive:    { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  methodBtnText:      { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  methodBtnTextActive:{ color: colors.emerald },
  note:               { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
