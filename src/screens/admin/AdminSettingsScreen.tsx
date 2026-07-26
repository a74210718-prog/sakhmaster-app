import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const BASE = 'https://sakhmaster.ru';

const LINKS = [
  {
    section: 'FILAMENT ADMIN',
    items: [
      { icon: '🏠', label: 'Главная Filament',      url: `${BASE}/admin` },
      { icon: '👥', label: 'Пользователи Filament', url: `${BASE}/admin/users` },
      { icon: '📋', label: 'Заказы Filament',       url: `${BASE}/admin/orders` },
      { icon: '💸', label: 'Выплаты Filament',      url: `${BASE}/admin/payout-requests` },
      { icon: '🏦', label: 'Транзакции',             url: `${BASE}/admin/transactions` },
      { icon: '🗂️', label: 'Категории',             url: `${BASE}/admin/categories` },
    ],
  },
  {
    section: 'МОНИТОРИНГ',
    items: [
      { icon: '⚡', label: 'T-Bank Диспуты',  url: `${BASE}/admin/chargebacks` },
      { icon: '🔔', label: 'Уведомления',     url: `${BASE}/admin/notifications` },
      { icon: '🤖', label: 'ИИ-агенты',       url: `${BASE}/admin/ai-agents` },
    ],
  },
  {
    section: 'КОНТЕНТ',
    items: [
      { icon: '🏗️', label: 'Секции главной',   url: `${BASE}/admin/home-sections` },
      { icon: '🛍️', label: 'Магазины',         url: `${BASE}/admin/shops` },
      { icon: '🛠️', label: 'Аренда',           url: `${BASE}/admin/rentals` },
    ],
  },
];

export default function AdminSettingsScreen({ navigation }: any) {
  const insets  = useSafeAreaInsets();
  const logout  = useAuthStore((s) => s.logout);
  const user    = useAuthStore((s) => s.user);

  const open = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.emerald,
      });
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть страницу');
    }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Настройки</Text>
      </View>

      {/* Текущий пользователь */}
      <View style={s.userCard}>
        <View style={s.userAvatar}>
          <Text style={s.userAvatarText}>{user?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.userName}>{user?.name ?? 'Администратор'}</Text>
          <Text style={s.userRole}>{user?.role === 'admin' ? '🔑 Администратор' : '🛡️ Модератор'}</Text>
        </View>
      </View>

      {LINKS.map((group) => (
        <View key={group.section}>
          <Text style={s.sectionLabel}>{group.section}</Text>
          <View style={s.card}>
            {group.items.map((item, i) => (
              <TouchableOpacity
                key={item.url}
                style={[s.row, i < group.items.length - 1 && s.rowBorder]}
                onPress={() => open(item.url)}
                activeOpacity={0.75}
              >
                <Text style={s.rowIcon}>{item.icon}</Text>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={s.sectionLabel}>СЕССИЯ</Text>
      <View style={s.card}>
        <TouchableOpacity
          style={s.row}
          onPress={() =>
            Alert.alert('Выйти', 'Выйти из аккаунта?', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Выйти', style: 'destructive', onPress: () => logout() },
            ])
          }
          activeOpacity={0.75}
        >
          <Text style={s.rowIcon}>🚪</Text>
          <Text style={[s.rowLabel, { color: colors.rose }]}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  backText: { fontSize: 30, color: colors.textSecondary, lineHeight: 34 },
  title:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  userAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: 22, fontWeight: '800', color: colors.emerald },
  userName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  userRole: { fontSize: 13, color: colors.textMuted, marginTop: 3 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
  },

  card: {
    backgroundColor: colors.surface, marginHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon:   { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel:  { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  rowArrow:  { fontSize: 20, color: colors.textMuted },
});
