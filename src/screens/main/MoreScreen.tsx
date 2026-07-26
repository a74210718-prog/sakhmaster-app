import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useCartStore } from '../../store/cartStore';

interface Tile {
  label: string;
  emoji: string;
  screen: string;
  badge?: number | string;
  color: string;
}

function GridIcon({ focused }: { focused?: boolean }) {
  const c = focused ? colors.emerald : colors.textMuted;
  return (
    <View style={{ width: 26, height: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 3 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: c }} />
      ))}
    </View>
  );
}

export default function MoreScreen({ navigation }: any) {
  const insets      = useSafeAreaInsets();
  const user        = useAuthStore((s) => s.user);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const cartCount   = useCartStore((s) => s.items.length);

  const isAdmin  = user?.role === 'admin' || user?.role === 'moderator';
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';

  const tiles: Tile[] = [
    { label: 'Аренда',        emoji: '🔨', screen: 'Rent',          color: '#f59e0b' },
    { label: 'Магазин',       emoji: '🛍️', screen: 'Shop',          badge: cartCount > 0 ? cartCount : undefined, color: '#0ea5e9' },
    { label: 'Барахолка',     emoji: '🏷️', screen: 'Flea',          color: '#8b5cf6' },
    { label: 'Уведомления',   emoji: '🔔', screen: 'Notifications', badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined, color: '#f43f5e' },
    { label: 'Кошелёк',       emoji: '💰', screen: 'Wallet',        color: '#10b981' },
    { label: 'Контракты',     emoji: '📄', screen: 'Contracts',     color: '#64748b' },
    ...(isMaster ? [{ label: 'Статистика',       emoji: '📊', screen: 'MasterStats', color: '#10b981' }] : []),
    ...(isAdmin  ? [{ label: 'Администрирование', emoji: '⚡', screen: 'Admin',       color: '#f43f5e' }] : []),
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Ещё</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.tileRow}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.screen}
              style={[s.tile, { borderColor: tile.color + '35' }]}
              onPress={() => navigation.navigate(tile.screen)}
              activeOpacity={0.75}
            >
              <View style={[s.iconWrap, { backgroundColor: tile.color + '18' }]}>
                <Text style={s.emoji}>{tile.emoji}</Text>
                {tile.badge !== undefined && (
                  <View style={[s.badge, { backgroundColor: tile.color }]}>
                    <Text style={s.badgeText}>{tile.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={s.label} numberOfLines={2}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export { GridIcon };

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  header:  { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
  title:   { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  grid:    { padding: 16 },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },

  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: { fontSize: 28 },

  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
});
