import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { getNavigationTarget } from '../../utils/pushNotifications';

interface AppNotification {
  id: string;
  type: string;
  data: {
    icon?: string;
    message?: string;
    body?: string;
    title?: string;
    order_id?: number;
    order_title?: string;
    screen?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [notifs,     setNotifs]     = useState<AppNotification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread,     setUnread]     = useState(0);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { page: p } });
      setNotifs(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setUnread(data.unread_count ?? 0);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleTap = (item: AppNotification) => {
    if (!item.read_at) {
      api.post('/notifications/read', { id: item.id }).catch(() => {});
      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread(u => Math.max(0, u - 1));
    }

    const nav = getNavigationTarget(item.data);
    if (nav) navigation.navigate(nav.screen, nav.params);
  };

  const markAllRead = () => {
    api.post('/notifications/read', {}).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnread(0);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.read_at;
    const d = item.data;
    const text  = d.message ?? d.body ?? d.order_title ?? 'Уведомление';
    const icon  = d.icon && d.icon.length <= 4 ? d.icon : '🔔';
    const isNav = !!getNavigationTarget(d);

    return (
      <TouchableOpacity
        style={[s.item, isUnread && s.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.75}
      >
        <View style={[s.iconWrap, isUnread && { backgroundColor: colors.emeraldDim }]}>
          <Text style={s.iconText}>{icon}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.message, isUnread && s.messageUnread]} numberOfLines={3}>{text}</Text>
          <Text style={s.date}>
            {new Date(item.created_at).toLocaleString('ru', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={s.right}>
          {isUnread && <View style={s.dot} />}
          {isNav && <Text style={{ color: colors.textMuted, fontSize: 18, marginTop: 4 }}>›</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>
          Уведомления{unread > 0 ? ` (${unread})` : ''}
        </Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.readAllText}>Прочитать все</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => n.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
              <Text style={s.emptyText}>Уведомлений пока нет</Text>
              <Text style={s.emptySub}>Здесь появятся обновления по заказам, бронированиям и сделкам</Text>
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
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  title:        { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  readAllText:  { color: colors.emerald, fontSize: 13, fontWeight: '600' },
  item:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemUnread:   { backgroundColor: colors.surface },
  iconWrap:     { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText:     { fontSize: 18 },
  message:      { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  messageUnread:{ color: colors.textPrimary, fontWeight: '500' },
  date:         { fontSize: 11, color: colors.textMuted },
  right:        { alignItems: 'flex-end', gap: 4, paddingTop: 2 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald },
  empty:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyText:    { color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptySub:     { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
