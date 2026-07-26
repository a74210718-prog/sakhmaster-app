import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: 'Активен',      color: colors.emerald },
  invited:  { label: 'Приглашён',    color: colors.amber },
  inactive: { label: 'Неактивен',    color: colors.textMuted },
  left:     { label: 'Покинул',      color: colors.rose },
};

interface TeamMember {
  id: number; status: string; note: string | null;
  member: { id: number; name: string; phone: string | null; avatar: string | null } | null;
}

export default function IpTeamScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [members,    setMembers]    = useState<TeamMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/ip/team');
      setMembers(data.data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const renderMember = ({ item }: { item: TeamMember }) => {
    const st = STATUS_MAP[item.status] ?? { label: item.status, color: colors.textMuted };
    const m  = item.member;
    return (
      <View style={s.card}>
        <View style={s.row}>
          {m?.avatar ? (
            <Image source={{ uri: m.avatar }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={{ fontSize: 22, color: colors.emerald }}>
                {m?.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{m?.name ?? 'Пользователь удалён'}</Text>
            {m?.phone && <Text style={s.phone}>{m.phone}</Text>}
            {item.note && <Text style={s.note}>{item.note}</Text>}
          </View>
          <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Команда СМЗ</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.amber} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Команда пока пуста</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                Пригласите СМЗ-мастеров через личный кабинет на сайте
              </Text>
            </View>
          }
          renderItem={renderMember}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:            { color: colors.amber, fontSize: 16 },
  title:           { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:            { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 52, height: 52, borderRadius: 16 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.emerald + '40' },
  name:            { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  phone:           { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  note:            { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  badge:           { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:       { fontSize: 11, fontWeight: '600' },
});
