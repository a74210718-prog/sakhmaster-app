import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  client:     { label: 'Клиент',        color: colors.sky,    icon: '👤' },
  master_smz: { label: 'Мастер СМЗ',   color: colors.emerald, icon: '🔧' },
  ip_pro:     { label: 'ИП PRO',        color: colors.amber,   icon: '🏗️' },
  shop_owner: { label: 'Магазин',       color: colors.sky,    icon: '🏪' },
  moderator:  { label: 'Модератор',     color: colors.rose,    icon: '🛡️' },
  admin:      { label: 'Администратор', color: colors.rose,    icon: '⚡' },
};

function MenuItem({ icon, label, onPress, danger }: any) {
  return (
    <TouchableOpacity style={st.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={st.menuIcon}>{icon}</Text>
      <Text style={[st.menuLabel, danger && { color: colors.rose }]}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const roleInfo = ROLE_LABELS[user?.role ?? 'client'] ?? ROLE_LABELS.client;

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Аватар и имя */}
      <View style={st.hero}>
        <View style={st.avatar}>
          <Text style={st.avatarLetter}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={st.name}>{user?.name}</Text>
        <Text style={st.email}>{user?.email}</Text>
        <View style={[st.roleBadge, { borderColor: roleInfo.color + '50', backgroundColor: roleInfo.color + '15' }]}>
          <Text style={{ fontSize: 14 }}>{roleInfo.icon}</Text>
          <Text style={[st.roleLabel, { color: roleInfo.color }]}>{roleInfo.label}</Text>
        </View>
      </View>

      {/* Меню */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>Кабинет</Text>
        <MenuItem icon="💰" label="Кошелёк" onPress={() => navigation.navigate('Wallet')} />
        <MenuItem icon="📋" label="Мои заказы" onPress={() => navigation.navigate('Home')} />
        {(user?.role === 'master_smz' || user?.role === 'ip_pro') && (
          <MenuItem icon="⭐" label="Мой профиль мастера" onPress={() => {}} />
        )}
      </View>

      <View style={st.section}>
        <Text style={st.sectionTitle}>Настройки</Text>
        <MenuItem icon="🔔" label="Уведомления" onPress={() => {}} />
        <MenuItem icon="🔒" label="Безопасность" onPress={() => {}} />
      </View>

      <View style={st.section}>
        <MenuItem icon="🚪" label="Выйти из аккаунта" onPress={handleLogout} danger />
      </View>

      <Text style={st.version}>Арбайтен v1.0 · sakhmaster.ru</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  hero:         { alignItems: 'center', paddingTop: 60, paddingBottom: 28, gap: 8 },
  avatar:       { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.emerald + '60' },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: colors.emerald },
  name:         { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  email:        { fontSize: 13, color: colors.textMuted },
  roleBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 4 },
  roleLabel:    { fontWeight: '600', fontSize: 13 },
  section:      { marginHorizontal: 16, marginTop: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: 16, paddingBottom: 8 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel:    { flex: 1, fontSize: 15, color: colors.textPrimary },
  version:      { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 24 },
});
