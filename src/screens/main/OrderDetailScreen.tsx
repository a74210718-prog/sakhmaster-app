import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { ordersApi, Order } from '../../api/orders';
import { orderStatusApi } from '../../api/orderStatus';
import { reviewsApi } from '../../api/reviews';
import { paymentsApi, PAYMENT_STATUS } from '../../api/payments';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:               { label: 'Новый',        color: colors.sky },
  pending_agreement: { label: 'Согласование', color: colors.amber },
  held:              { label: 'Оплачен',       color: colors.emerald },
  in_work:           { label: 'В работе',      color: colors.emerald },
  pending_review:    { label: 'На приёмке',    color: colors.amber },
  completed:         { label: 'Завершён',      color: '#6b7280' },
  canceled:          { label: 'Отменён',       color: colors.rose },
};

// Кнопки действий в зависимости от роли + статуса
function getActions(order: Order, isMaster: boolean): { label: string; status: string; color: string }[] {
  if (isMaster) {
    if (order.status === 'new' && !order.contractor)
      return [{ label: 'Взять в работу', status: 'in_work', color: colors.emerald }];
    if (order.status === 'in_work')
      return [{ label: 'Отметить выполненным', status: 'pending_review', color: colors.amber }];
  } else {
    if (order.status === 'pending_review')
      return [{ label: 'Подтвердить выполнение', status: 'completed', color: colors.emerald }];
    if (order.status === 'new' || order.status === 'in_work')
      return [{ label: 'Отменить заказ', status: 'canceled', color: colors.rose }];
  }
  return [];
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { id } = route.params as { id: number };
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [order, setOrder]           = useState<Order | null>(null);
  const [loading, setLoading]       = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [hasReview, setHasReview]   = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);

  const reload = async () => {
    try {
      const { data } = await ordersApi.show(id);
      setOrder(data.data);
      if (user?.role === 'client' && data.data.status === 'completed') {
        const rv = await reviewsApi.checkOrder(id);
        setHasReview(rv.data.has_review);
      }
    } catch { navigation.goBack(); }
    setLoading(false);
  };

  useEffect(() => { reload(); }, [id]);

  useEffect(() => {
    api.get<{ count: number }>(`/orders/${id}/unread-count`)
      .then(r => setUnreadChat(r.data.count))
      .catch(() => {});
  }, [id]);

  const handleAction = (status: string, label: string) => {
    Alert.alert(label, 'Подтвердить действие?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Да',
        onPress: async () => {
          setActLoading(true);
          try {
            await orderStatusApi.update(id, status);
            reload();
          } catch {
            Alert.alert('Ошибка', 'Не удалось изменить статус. Попробуйте ещё раз.');
          }
          setActLoading(false);
        },
      },
    ]);
  };

  const handlePayment = async () => {
    if (!order) return;
    setPayLoading(true);
    try {
      // Шаг 2-7: получаем PaymentURL с сервера
      const { data } = await paymentsApi.getOrderPaymentUrl(order.id);
      const { payment_url, payment_id } = data;

      // Шаг 8: открываем в Chrome Custom Tabs / SFSafariViewController
      const result = await WebBrowser.openAuthSessionAsync(payment_url, 'sakhmaster://');

      if (result.type === 'success') {
        const url = result.url ?? '';
        if (url.includes('/success')) {
          // Шаг 10-11: проверяем статус через API
          const statusRes = await paymentsApi.checkStatus(payment_id);
          const { status } = statusRes.data;

          if (status === PAYMENT_STATUS.CONFIRMED || status === PAYMENT_STATUS.AUTHORIZED) {
            Alert.alert('Оплата прошла!', 'Заказ оплачен. Мастер приступит к работе.');
            reload();
          } else {
            Alert.alert('Оплата не подтверждена', `Статус: ${status}. Обратитесь в поддержку если деньги списались.`);
          }
        } else {
          Alert.alert('Оплата не прошла', 'Попробуйте ещё раз или выберите другой способ оплаты.');
        }
      } else if (result.type === 'cancel') {
        // Пользователь закрыл форму — не показываем ошибку
      }
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Не удалось инициировать оплату';
      Alert.alert('Ошибка', msg);
    }
    setPayLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (!order) return null;

  const st = STATUS_MAP[order.status] ?? { label: order.status, color: colors.textMuted };
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';
  const actions = getActions(order, isMaster);

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Заказ #{order.id}</Text>
        {/* Кнопка чата */}
        <TouchableOpacity
          style={s.chatBtn}
          onPress={() => {
            setUnreadChat(0);
            navigation.navigate('Chat', { orderId: order.id, orderTitle: order.title });
          }}
        >
          <Text style={{ fontSize: 20 }}>💬</Text>
          {unreadChat > 0 && (
            <View style={s.chatBadge}>
              <Text style={s.chatBadgeText}>{unreadChat > 9 ? '9+' : unreadChat}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <View style={[s.statusBadge, { backgroundColor: st.color + '20', borderColor: st.color + '50' }]}>
          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
        <Text style={s.title}>{order.title}</Text>

        <View style={s.row}>
          <Text style={s.metaKey}>Категория</Text>
          <Text style={s.metaVal}>{order.category?.name ?? '—'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.metaKey}>Город</Text>
          <Text style={s.metaVal}>{order.city?.name ?? '—'}</Text>
        </View>
        {order.total_sum > 0 && (
          <View style={s.row}>
            <Text style={s.metaKey}>Бюджет</Text>
            <Text style={[s.metaVal, { color: colors.emerald, fontWeight: '700' }]}>
              {order.total_sum.toLocaleString('ru')} ₽
            </Text>
          </View>
        )}
        {order.deadline_at && (
          <View style={s.row}>
            <Text style={s.metaKey}>Срок</Text>
            <Text style={s.metaVal}>{order.deadline_at}</Text>
          </View>
        )}
        {order.customer && (
          <View style={s.row}>
            <Text style={s.metaKey}>Заказчик</Text>
            <Text style={s.metaVal}>{order.customer.name}</Text>
          </View>
        )}
        {order.contractor && (
          <View style={s.row}>
            <Text style={s.metaKey}>Исполнитель</Text>
            {!isMaster ? (
              <TouchableOpacity onPress={() => navigation.navigate('MasterDetail', { id: order.contractor!.id })}>
                <Text style={[s.metaVal, { color: colors.emerald }]}>{order.contractor.name} ›</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.metaVal}>{order.contractor.name}</Text>
            )}
          </View>
        )}
        {order.is_urgent && (
          <View style={s.urgentBadge}>
            <Text style={{ color: colors.rose, fontSize: 13, fontWeight: '700' }}>🔥 Срочный заказ</Text>
          </View>
        )}
      </View>

      {order.description ? (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Описание</Text>
          <Text style={s.description}>{order.description}</Text>
        </View>
      ) : null}

      {order.photos && order.photos.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Фото</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {order.photos.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={{ width: 100, height: 100, borderRadius: 10 }} />
            ))}
          </View>
        </View>
      )}

      {/* Кнопка оплаты — клиент, статус pending_agreement, есть сумма */}
      {!isMaster && order.status === 'pending_agreement' && order.total_sum > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity
            style={[s.actionBtn, s.payBtn]}
            onPress={handlePayment}
            disabled={payLoading}
            activeOpacity={0.85}
          >
            {payLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[s.actionText, { color: '#1a1a1a' }]}>💳  Оплатить {order.total_sum.toLocaleString('ru')} ₽</Text>
            }
          </TouchableOpacity>
          <Text style={s.payNote}>Оплата через T-Bank. Карта, СБП, T-Pay, Mir Pay.</Text>
        </View>
      )}

      {/* Кнопки действий */}
      {actions.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 12, gap: 10 }}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.status}
              style={[s.actionBtn, { backgroundColor: a.color }]}
              onPress={() => handleAction(a.status, a.label)}
              disabled={actLoading}
              activeOpacity={0.85}
            >
              {actLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.actionText}>{a.label}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Кнопка отзыва — клиент после completed */}
      {user?.role === 'client' && order.status === 'completed' && order.contractor && (
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          {hasReview ? (
            <View style={s.reviewDone}>
              <Text style={{ color: colors.amber, fontSize: 18 }}>★★★★★</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Отзыв уже оставлен</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.amber }]}
              onPress={() => navigation.navigate('Review', {
                orderId: order.id,
                masterName: order.contractor?.name ?? 'Мастер',
              })}
            >
              <Text style={s.actionText}>⭐ Оставить отзыв</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  back:         { width: 40, alignItems: 'center' },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  chatBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  chatBadge:    { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chatBadgeText:{ color: '#fff', fontSize: 10, fontWeight: '800' },
  card:         { margin: 16, marginBottom: 0, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  statusBadge:  { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusText:   { fontSize: 13, fontWeight: '700' },
  title:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary, lineHeight: 24 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaKey:      { fontSize: 13, color: colors.textMuted },
  metaVal:      { fontSize: 13, color: colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  urgentBadge:  { alignSelf: 'flex-start', backgroundColor: colors.rose+'15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.rose+'30' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  description:  { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  actionBtn:    { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  actionText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  payBtn:       { backgroundColor: '#FFDD2D' },
  payNote:      { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  reviewDone:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
});
