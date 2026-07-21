import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function NotificationsScreen() {
  return (
    <View style={s.root}>
      <Text style={s.title}>Уведомления</Text>
      <View style={s.empty}>
        <Text style={{ fontSize: 48 }}>🔔</Text>
        <Text style={s.emptyText}>Уведомлений пока нет</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor: colors.bg },
  title:     { fontSize:22, fontWeight:'700', color: colors.textPrimary, padding:20, paddingTop:56 },
  empty:     { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  emptyText: { color: colors.textMuted, fontSize:15 },
});
