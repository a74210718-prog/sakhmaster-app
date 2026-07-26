import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface Payout {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
}

export default function AdminPayoutsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [payouts, setPayouts]     = useState<Payout[]>([]);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]  = useState(false);

  // Reject modal
  const [rejectId, setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: Payout[]; meta: any }>('/admin/payouts/pending', { params: { page: p } });
      setPayouts(append ? (prev) => [...prev, ...res.data.data] : res.data.data);
      setLastPage(res.data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleApprove = (payout: Payout) => {
    Alert.alert(
      'Одобрить выплату',
      `Одобрить ${payout.amount.toLocaleString('ru')} ₽ для ${payout.user?.name ?? 'мастера'}?`,
      [
        { text: 'О��мена', style: 'cancel' },
        {
          text: 'Одобрить',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.post(`/admin/payouts/${payout.id}/approve`);
              setPayouts((prev) => prev.filter((p) => p.id !== payout.id));
            } catch {
              Alert.alert('Ошибка', 'Не удалось одобрить выплату');
            }
            setActionLoading(false);
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/payouts/${rejectId}/reject`, { reason: rejectReason.trim() });
      setPayouts((prev) => prev.filter((p) => p.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch {
      Alert.alert('Ошибка', 'Не удалось отклонить выплату');
    }
    setActionLoading(false);
  };

  const renderItem = ({ item: p }: { item: Payout }) => (
    <View style={s.row}>
      <View style={s.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowName}>{p.user?.name ?? 'Мастер'}</Text>
          <Text style={s.rowEmail}>{p.user?.email ?? ''}</Text>
          <Text style={s.rowDate}>{new Date(p.created_at).toLocaleString('ru', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={s.rowSum}>{p.amount.toLocaleString('ru')} ₽</Text>
      </View>
      <View style={s.rowActions}>
        <TouchableOpacity
          style={s.approveBtn}
          onPress={() => handleApprove(p)}
          disabled={actionLoading}
          activeOpacity={0.8}
        >
          <Text style={s.approveBtnText}>✓ Одобрить</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.rejectBtn}
          onPress={() => { setRejectId(p.id); setRejectReason(''); }}
          disabled={actionLoading}
          activeOpacity={0.8}
        >
          <Text style={s.rejectBtnText}>✕ Отклонить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Выплаты</Text>
        {payouts.length > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{payouts.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={payouts}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => {
            if (page < lastPage && !loadingMore) load(page + 1, true);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.emerald} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>✅</Text>
              <Text style={s.emptyTitle}>Нет ожидающих выплат</Text>
              <Text style={s.emptyText}>Все заявки обработаны</Text>
            </View>
          }
        />
      )}

      {/* Modal отклонения */}
      <Modal
        visible={rejectId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectId(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Причина отклонения</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Укажите причину..."
              placeholderTextColor={colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setRejectId(null)}
              >
                <Text style={s.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalRejectBtn, !rejectReason.trim() && { opacity: 0.5 }]}
                onPress={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.modalRejectText}>Отклонить</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  backText: { fontSize: 30, color: colors.textSecondary, lineHeight: 34 },
  title:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  badge:  { backgroundColor: colors.amber + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.amber + '50' },
  badgeText: { color: colors.amber, fontSize: 13, fontWeight: '800' },

  row: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  rowTop:  { flexDirection: 'row', gap: 12 },
  rowName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  rowEmail:{ fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  rowSum:  { fontSize: 22, fontWeight: '800', color: colors.amber },

  rowActions: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1, backgroundColor: colors.emerald, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.rose + '50',
  },
  rejectBtnText: { color: colors.rose, fontWeight: '700', fontSize: 14 },

  empty:      { alignItems: 'center', padding: 64 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  emptyText:  { fontSize: 14, color: colors.textMuted },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    width: '100%', backgroundColor: colors.surface,
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  modalInput: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12, color: colors.textPrimary,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancelBtn: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  modalCancelText: { color: colors.textSecondary, fontWeight: '600' },
  modalRejectBtn: {
    flex: 1, backgroundColor: colors.rose, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  modalRejectText: { color: '#fff', fontWeight: '700' },
});
