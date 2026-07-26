import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  city?: string | null;
  is_blocked: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Клиент', master_smz: 'СМЗ', ip_pro: 'ИП',
  shop_owner: 'Магазин', moderator: 'Мод', admin: 'Адм',
};
const ROLE_COLORS: Record<string, string> = {
  master_smz: colors.emerald, ip_pro: colors.amber,
  shop_owner: colors.sky, moderator: colors.rose,
  admin: colors.rose, client: colors.textMuted,
};
const ROLES = ['', 'client', 'master_smz', 'ip_pro', 'shop_owner', 'moderator'];
const ROLE_CHIP: Record<string, string> = { '': 'Все', ...ROLE_LABELS };

export default function AdminUsersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [search, setSearch]       = useState('');
  const [role, setRole]           = useState('');
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]  = useState(false);

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get<{ data: AdminUser[]; meta: any }>('/admin/users', {
        params: { page: p, search: search || undefined, role: role || undefined },
      });
      setUsers(append ? (prev) => [...prev, ...res.data.data] : res.data.data);
      setLastPage(res.data.meta.last_page);
      setPage(p);
    } catch {}
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [search, role]);

  useEffect(() => { load(1); }, [load]);

  const toggleBlock = async (user: AdminUser) => {
    const action = user.is_blocked ? 'разблокировать' : 'заблокировать';
    Alert.alert(
      user.is_blocked ? 'Разблокировать' : 'Заблокировать',
      `${action} ${user.name}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: user.is_blocked ? 'Разблокировать' : 'Заблокировать',
          style: user.is_blocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await api.patch<{ is_blocked: boolean }>(`/admin/users/${user.id}/block`);
              setUsers((prev) =>
                prev.map((u) => u.id === user.id ? { ...u, is_blocked: res.data.is_blocked } : u)
              );
            } catch {
              Alert.alert('Ошибка', 'Не удалось изменить статус');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <View style={s.row}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.rowEmail} numberOfLines={1}>{item.email}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <View style={[s.chip, { borderColor: (ROLE_COLORS[item.role] ?? colors.textMuted) + '60' }]}>
            <Text style={[s.chipText, { color: ROLE_COLORS[item.role] ?? colors.textMuted }]}>
              {ROLE_LABELS[item.role] ?? item.role}
            </Text>
          </View>
          {item.city && (
            <View style={s.chip}>
              <Text style={s.chipText}>{item.city}</Text>
            </View>
          )}
          {item.is_blocked && (
            <View style={[s.chip, { borderColor: colors.rose + '60' }]}>
              <Text style={[s.chipText, { color: colors.rose }]}>🚫 заблок.</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[s.blockBtn, item.is_blocked && s.blockBtnActive]}
        onPress={() => toggleBlock(item)}
      >
        <Text style={[s.blockBtnText, item.is_blocked && { color: colors.emerald }]}>
          {item.is_blocked ? '✓' : '🚫'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Пользователи</Text>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Поиск по имени, email, логину..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => load(1)}
        />
      </View>

      <FlatList
        data={ROLES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(r) => r}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
        renderItem={({ item: r }) => (
          <TouchableOpacity
            style={[s.roleChip, role === r && s.roleChipActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[s.roleChipText, role === r && s.roleChipTextActive]}>
              {ROLE_CHIP[r]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
              <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
              <Text style={s.emptyText}>Пользователи не найдены</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 30, color: colors.textSecondary, lineHeight: 34 },
  title:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary },

  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    color: colors.textPrimary, fontSize: 14,
  },

  roleChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.emerald + '20', borderColor: colors.emerald },
  roleChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  roleChipTextActive: { color: colors.emerald },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.emerald },
  rowName:    { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowEmail:   { fontSize: 12, color: colors.textMuted },

  chip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },

  blockBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  blockBtnActive: { backgroundColor: colors.emeraldDim, borderColor: colors.emerald + '60' },
  blockBtnText: { fontSize: 16 },

  empty:     { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 15, color: colors.textMuted },
});
