import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { ordersApi, Order } from '../../api/orders';
import { orderStatusApi } from '../../api/orderStatus';
import { useAuthStore } from '../../store/authStore';

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
  const user = useAuthStore((s) => s.user);
  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  const reload = () => {
    ordersApi.show(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

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
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Хедер */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Заказ #{order.id}</Text>
        {/* Кнопка чата */}
        <TouchableOpacity
          style={s.chatBtn}
          onPress={() => navigation.navigate('Chat', { orderId: order.id, orderTitle: order.title })}
        >
          <Text style={{ fontSize: 20 }}>💬</Text>
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
            <Text style={s.metaVal}>{order.contractor.name}</Text>
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 52, gap: 8 },
  back:         { width: 40, alignItems: 'center' },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  chatBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
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
});
