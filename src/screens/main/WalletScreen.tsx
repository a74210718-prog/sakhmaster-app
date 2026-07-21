import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { walletApi, WalletInfo, WalletTransaction } from '../../api/wallet';
import { profileApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';

const TX_LABELS: Record<string, { label: string; color: string }> = {
  deposit:    { label: 'Пополнение',  color: colors.emerald },
  withdrawal: { label: 'Вывод',       color: colors.rose },
  hold:       { label: 'Заморожено',  color: colors.amber },
  release:    { label: 'Разморожено', color: colors.sky },
  commission: { label: 'Комиссия',    color: colors.rose },
  payment:    { label: 'Оплата',      color: colors.sky },
  refund:     { label: 'Возврат',     color: colors.emerald },
};

function TxItem({ item }: { item: WalletTransaction }) {
  const meta = TX_LABELS[item.type] ?? { label: item.type, color: colors.textMuted };
  const sign = ['deposit', 'release', 'refund'].includes(item.type) ? '+' : '−';
  const signColor = sign === '+' ? colors.emerald : colors.rose;
  return (
    <View style={s.txItem}>
      <View style={[s.txDot, { backgroundColor: meta.color + '30', borderColor: meta.color + '60' }]}>
        <Text style={{ fontSize: 14 }}>
          {item.type === 'deposit' ? '💳' : item.type === 'withdrawal' ? '🏦' : '💸'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txLabel}>{meta.label}</Text>
        {item.comment ? <Text style={s.txComment} numberOfLines={1}>{item.comment}</Text> : null}
        <Text style={s.txDate}>{new Date(item.created_at).toLocaleDateString('ru')}</Text>
      </View>
      <Text style={[s.txAmount, { color: signColor }]}>
        {sign}{Math.abs(item.amount).toLocaleString('ru')} ₽
      </Text>
    </View>
  );
}

export default function WalletScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';

  const [info, setInfo]           = useState<WalletInfo | null>(null);
  const [txs, setTxs]             = useState<WalletTransaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        walletApi.info(),
        walletApi.transactions(),
      ]);
      setInfo(walletRes.data);
      setTxs(txRes.data.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleTopup = async () => {
    const amount = parseInt(topupAmount, 10);
    if (!amount || amount < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 100 ₽');
      return;
    }
    setTopupLoading(true);
    try {
      const { data } = await walletApi.topupInit(amount);
      setTopupModal(false);
      setTopupAmount('');
      if (data.payment_url) {
        // Открываем Tinkoff в браузере
        await WebBrowser.openBrowserAsync(data.payment_url);
        // После закрытия браузера обновляем баланс
        load();
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать платёж. Попробуйте ещё раз.');
    }
    setTopupLoading(false);
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма вывода 100 ₽');
      return;
    }
    if (info && amount > info.balance) {
      Alert.alert('Ошибка', `На кошельке только ${info.balance.toLocaleString('ru')} ₽`);
      return;
    }
    setWithdrawLoading(true);
    try {
      await profileApi.withdraw(amount);
      setWithdrawModal(false);
      setWithdrawAmount('');
      Alert.alert('Заявка принята', `Выплата ${amount.toLocaleString('ru')} ₽ будет обработана в течение 1 рабочего дня`);
      load();
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось создать заявку');
    }
    setWithdrawLoading(false);
  };

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Кошелёк</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 80 }} size="large" />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />
          }
          ListHeaderComponent={
            <>
              {/* Баланс-карточка */}
              <View style={s.balanceCard}>
                <Text style={s.balanceLabel}>Баланс</Text>
                <Text style={s.balanceAmount}>{(info?.balance ?? 0).toLocaleString('ru')} ₽</Text>
                {info && info.balance_held > 0 && (
                  <Text style={s.balanceHeld}>Заморожено: {info.balance_held.toLocaleString('ru')} ₽</Text>
                )}
                <View style={s.balanceBtns}>
                  <TouchableOpacity style={s.topupBtn} onPress={() => setTopupModal(true)}>
                    <Text style={s.topupText}>+ Пополнить</Text>
                  </TouchableOpacity>
                  {isMaster && (
                    <TouchableOpacity style={s.withdrawBtn} onPress={() => setWithdrawModal(true)}>
                      <Text style={s.withdrawText}>↑ Вывести</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {txs.length > 0 && (
                <Text style={s.sectionTitle}>История операций</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💰</Text>
              <Text style={s.emptyText}>Операций пока нет</Text>
              <Text style={s.emptySub}>Пополните кошелёк чтобы начать</Text>
            </View>
          }
          renderItem={({ item }) => <TxItem item={item} />}
        />
      )}

      {/* Модалка вывода средств */}
      <Modal visible={withdrawModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.modalTitle}>Вывод средств</Text>
            <Text style={s.modalSub}>Доступно: {(info?.balance ?? 0).toLocaleString('ru')} ₽</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Сумма в рублях"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              autoFocus
            />
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 }}>
              Выплата на карту, привязанную к аккаунту Т-Банка.{'\n'}Обработка: 1 рабочий день.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setWithdrawModal(false); setWithdrawAmount(''); }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalConfirm, { backgroundColor: colors.amber }]} onPress={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Вывести</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Модалка пополнения */}
      <Modal visible={topupModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.modalTitle}>Пополнение кошелька</Text>
            <Text style={s.modalSub}>Минимум 100 ₽</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Сумма в рублях"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={topupAmount}
              onChangeText={setTopupAmount}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setTopupModal(false); setTopupAmount(''); }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleTopup} disabled={topupLoading}>
                {topupLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Оплатить</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 52, gap: 8 },
  back:          { width: 40, alignItems: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  balanceCard:   { margin: 16, backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 6 },
  balanceLabel:  { fontSize: 13, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  balanceHeld:   { fontSize: 13, color: colors.amber },
  balanceBtns:   { flexDirection: 'row', gap: 10, marginTop: 12 },
  topupBtn:      { flex: 1, backgroundColor: colors.emerald, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  topupText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
  withdrawBtn:   { flex: 1, backgroundColor: colors.amber, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  withdrawText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 4 },
  txItem:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  txDot:         { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  txLabel:       { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  txComment:     { fontSize: 12, color: colors.textMuted },
  txDate:        { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmount:      { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  emptySub:      { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  modalSheet:    { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 12, borderTopWidth: 1, borderColor: colors.border },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  modalSub:      { fontSize: 13, color: colors.textMuted, marginTop: -4 },
  modalInput:    { backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary, fontSize: 22, fontWeight: '700', borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  modalActions:  { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel:   { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  modalConfirm:  { flex: 2, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.emerald, borderRadius: 12 },
});
