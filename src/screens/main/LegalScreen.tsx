import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';

const BASE = 'https://sakhmaster.ru';

const DOCS = [
  {
    icon: '📄',
    title: 'Публичная оферта',
    sub: 'Договор на использование платформы',
    url: `${BASE}/offer`,
  },
  {
    icon: '🔒',
    title: 'Политика конфиденциальности',
    sub: 'Обработка персональных данных (152-ФЗ)',
    url: `${BASE}/privacy`,
  },
  {
    icon: '📋',
    title: 'Пользовательское соглашение',
    sub: 'Правила использования сервиса',
    url: `${BASE}/terms`,
  },
  {
    icon: '💳',
    title: 'Тарифы',
    sub: 'Комиссии, подписки, условия',
    url: `${BASE}/tariffs`,
  },
  {
    icon: '🏢',
    title: 'О платформе',
    sub: 'Миссия, команда, концепция',
    url: `${BASE}/about`,
  },
];

const CONTACTS = [
  { label: 'Поддержка', value: 'support@sakhmaster.ru' },
  { label: 'Телефон',   value: '+7 914 095-65-92' },
  { label: 'ИП',        value: 'Иванов Александр Викторович' },
  { label: 'ИНН',       value: '650502561329' },
  { label: 'ОГРНИП',    value: '326650000016818' },
];

async function open(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: colors.surface,
      controlsColor: colors.emerald,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  } catch {
    Alert.alert('Ошибка', 'Не удалось открыть документ');
  }
}

export default function LegalScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Документы</Text>
      </View>

      <Text style={s.sectionLabel}>ПРАВОВЫЕ ДОКУМЕНТЫ</Text>
      {DOCS.map((doc) => (
        <TouchableOpacity
          key={doc.url}
          style={s.row}
          onPress={() => open(doc.url)}
          activeOpacity={0.75}
        >
          <Text style={s.rowIcon}>{doc.icon}</Text>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>{doc.title}</Text>
            <Text style={s.rowSub}>{doc.sub}</Text>
          </View>
          <Text style={s.rowArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <Text style={s.sectionLabel}>РЕКВИЗИТЫ</Text>
      <View style={s.card}>
        {CONTACTS.map((c, i) => (
          <View key={c.label} style={[s.reqRow, i < CONTACTS.length - 1 && s.reqRowBorder]}>
            <Text style={s.reqLabel}>{c.label}</Text>
            <Text style={s.reqValue}>{c.value}</Text>
          </View>
        ))}
      </View>

      <Text style={s.footer}>
        © 2026 Ладорея (ИП Иванов А.В.) · sakhmaster.ru{'\n'}
        Все права защищены
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn:  { padding: 4 },
  backText: { fontSize: 30, color: colors.textSecondary, lineHeight: 34 },
  title:    { fontSize: 26, fontWeight: '800', color: colors.textPrimary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface,
    marginHorizontal: 16, marginBottom: 8,
    padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  rowIcon:  { fontSize: 24, width: 32, textAlign: 'center' },
  rowBody:  { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowSub:   { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowArrow: { fontSize: 22, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  reqRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  reqRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reqLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
  reqValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '500', flex: 2, textAlign: 'right' },

  footer: {
    textAlign: 'center', fontSize: 11, color: colors.textMuted,
    marginTop: 24, marginHorizontal: 20, lineHeight: 18,
  },
});
