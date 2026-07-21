import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, Order, OrdersResponse } from '../../api/orders';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    new:             { label: 'Новый',     color: colors.sky },
    pending_agreement:{ label: 'Согласование', color: colors.amber },
    in_work:         { label: 'В работе',  color: colors.emerald },
    pending_review:  { label: 'На проверке', color: colors.amber },
    completed:       { label: 'Завершён',  color: '#6b7280' },
    cancelled:       { label: 'Отменён',   color: colors.rose },
  };
  const s = map[status] ?? { label: status, color: colors.textMuted };
  return (
    <View style={{ backgroundColor: s.color + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: s.color + '50' }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await ordersApi.list();
      setOrders((data as OrdersResponse).data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';

  return (
    <View style={s.root}>
      {/* Хедер */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Привет, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.sub}>{isMaster ? 'Доступные заказы' : 'Мои заказы'}</Text>
        </View>
        {!isMaster && (
          <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateOrder')}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.emerald} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyText}>{isMaster ? 'Новых заказов пока нет' : 'Заказов ещё нет'}</Text>
              {!isMaster && <Text style={s.emptySub}>Нажмите + чтобы создать первый заказ</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
              activeOpacity={0.8}
            >
              <View style={s.cardTop}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.is_urgent && <View style={s.urgentBadge}><Text style={{ color: colors.rose, fontSize: 10, fontWeight: '700' }}>СРОЧНО</Text></View>}
              </View>
              <Text style={s.cardMeta} numberOfLines={1}>{item.category?.name} · {item.city?.name}</Text>
              <View style={s.cardBottom}>
                <StatusBadge status={item.status} />
                {item.total_sum > 0 && (
                  <Text style={s.price}>{item.total_sum.toLocaleString('ru')} ₽</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor: colors.bg },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop: 56 },
  greeting:    { fontSize:22, fontWeight:'700', color: colors.textPrimary },
  sub:         { fontSize:13, color: colors.textMuted, marginTop:2 },
  fab:         { width:44, height:44, borderRadius:12, backgroundColor: colors.emerald, alignItems:'center', justifyContent:'center', shadowColor: colors.emerald, shadowOpacity:0.4, shadowRadius:8, elevation:4 },
  card:        { backgroundColor: colors.surface, borderRadius:16, padding:16, borderWidth:1, borderColor: colors.border },
  cardTop:     { flexDirection:'row', gap:8, alignItems:'flex-start', marginBottom:6 },
  cardTitle:   { flex:1, fontSize:15, fontWeight:'600', color: colors.textPrimary, lineHeight:21 },
  urgentBadge: { backgroundColor: colors.roseDim, borderRadius:6, paddingHorizontal:6, paddingVertical:2, borderWidth:1, borderColor: colors.rose+'40' },
  cardMeta:    { fontSize:12, color: colors.textMuted, marginBottom:10 },
  cardBottom:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  price:       { fontSize:15, fontWeight:'700', color: colors.emerald },
  empty:       { alignItems:'center', paddingTop:80 },
  emptyIcon:   { fontSize:48, marginBottom:12 },
  emptyText:   { fontSize:16, color: colors.textSecondary, fontWeight:'600' },
  emptySub:    { fontSize:13, color: colors.textMuted, marginTop:6 },
});
