import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';

const HOW_STEPS = [
  {
    n: '1',
    title: 'Опишите задачу',
    desc: 'Расскажите, что нужно сделать. ИИ-прораб поможет составить смету. Заказ увидят мастера вашего города.',
  },
  {
    n: '2',
    title: 'Выберите мастера',
    desc: 'Сравните отклики, рейтинги и цены. Оплата замораживается — мастер видит гарантию, вы видите защиту.',
  },
  {
    n: '3',
    title: 'Примите работу',
    desc: 'Проверьте результат, подпишите приёмку. Деньги уходят мастеру, чек — автоматически в «Мой налог».',
  },
];

const FEATURES = [
  { icon: '🛡️', title: 'Безопасная сделка', desc: 'Деньги заморожены через Т-Банк до приёмки. Мастер работает спокойно, клиент защищён.' },
  { icon: '📋', title: 'Всё по закону', desc: 'Чеки через «Мой налог», шифрование ИНН по 152-ФЗ, аудит-лог всех действий.' },
  { icon: '⚡', title: 'ИИ-прораб', desc: 'YandexGPT составит смету по описанию, поможет проверить план работ и оценить сроки.' },
  { icon: '🏪', title: 'Магазины-партнёры', desc: 'Выдача материалов по QR-коду. Оплата прямо в заказе. Скидки для постоянных клиентов.' },
  { icon: '⭐', title: 'Проверенные мастера', desc: 'Верификация через ФНС: только реальные самозанятые и ИП. Рейтинги и отзывы.' },
  { icon: '🏠', title: 'Ипотечный модуль', desc: 'Загрузите ремонт в ипотеку — банк-партнёр рассчитает условия прямо на платформе.' },
];

const CATEGORIES = [
  { icon: '🏠', name: 'Ремонт' },
  { icon: '⚡', name: 'Электрика' },
  { icon: '🔧', name: 'Сантехника' },
  { icon: '🖼️', name: 'Отделка' },
  { icon: '🏚️', name: 'Кровля' },
  { icon: '☀️', name: 'Отопление' },
  { icon: '🪟', name: 'Окна' },
  { icon: '🗄️', name: 'Мебель' },
  { icon: '✨', name: 'Клининг' },
  { icon: '🚚', name: 'Переезды' },
  { icon: '🗑️', name: 'Демонтаж' },
  { icon: '🌿', name: 'Ландшафт' },
];

export default function WelcomeScreen() {
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Герой ─────────────────────────────────── */}
        <View style={s.hero}>
          {/* Логотип */}
          <Text style={s.logo}>Ладорея</Text>

          {/* Бейдж */}
          <View style={s.badge}>
            <View style={s.badgeDot} />
            <Text style={s.badgeText}>Работаем по всей России</Text>
          </View>

          {/* Заголовок */}
          <Text style={s.heroTitle}>
            Стройка и ремонт{'\n'}
            <Text style={s.heroAccent}>без посредников</Text>
          </Text>

          {/* Подзаголовок */}
          <Text style={s.heroSub}>
            Находите проверенных мастеров по всей России. Оплата через безопасную сделку, чеки в «Мой налог», гарантия на работы.
          </Text>

          {/* CTA кнопки */}
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => nav.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={s.btnPrimaryText}>Я — клиент, найти мастера</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => nav.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={s.btnSecondaryText}>Я — мастер, брать заказы</Text>
          </TouchableOpacity>

          {/* Trust-метки */}
          <View style={s.trustRow}>
            {['Без скрытых платежей', 'Деньги — до приёмки', 'Поддержка 24/7'].map((t) => (
              <View key={t} style={s.trustItem}>
                <Text style={s.trustCheck}>✓</Text>
                <Text style={s.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Как работает ───────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Как это работает</Text>
          <Text style={s.sectionSub}>Три шага — от заявки до готовой работы с гарантией.</Text>

          {HOW_STEPS.map((step) => (
            <View key={step.n} style={s.stepCard}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{step.n}</Text>
              </View>
              <View style={s.stepBody}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Преимущества ───────────────────────────── */}
        <View style={[s.section, s.sectionAlt]}>
          <Text style={s.sectionTitle}>Почему Ладорея</Text>
          <Text style={s.sectionSub}>Платформа для рынка услуг по всей России.</Text>

          <View style={s.featuresGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={s.featureCard}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Категории ──────────────────────────────── */}
        <View style={s.section}>
          <View style={s.catHeader}>
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>КАТЕГОРИИ</Text>
            </View>
            <Text style={s.sectionTitle}>Выберите тип работ</Text>
          </View>

          <View style={s.catGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={s.catTile}
                onPress={() => nav.navigate('Register')}
                activeOpacity={0.75}
              >
                <View style={s.catIconWrap}>
                  <Text style={s.catIconText}>{cat.icon}</Text>
                </View>
                <Text style={s.catName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CTA ────────────────────────────────────── */}
        <View style={s.ctaBlock}>
          <Text style={s.ctaTitle}>Начните прямо сейчас</Text>
          <Text style={s.ctaSub}>Регистрация бесплатная. Платите только за реальную услугу.</Text>

          <TouchableOpacity
            style={s.ctaBtnWhite}
            onPress={() => nav.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={s.ctaBtnWhiteText}>Создать аккаунт</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.ctaBtnOutline}
            onPress={() => nav.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={s.ctaBtnOutlineText}>Войти в кабинет</Text>
          </TouchableOpacity>
        </View>

        {/* ── Мини-футер ─────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>© 2026 Ладорея · sakhmaster.ru</Text>
          <Text style={s.footerText}>ИП Иванов А.В. · ИНН 650502561329</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // Герой
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: colors.bg,
  },
  logo: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.emerald,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.emeraldDim,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 20,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6ee7b7',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 40,
    marginBottom: 14,
  },
  heroAccent: {
    color: colors.emerald,
  },
  heroSub: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  trustRow: {
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustCheck: {
    color: colors.emerald,
    fontSize: 15,
    fontWeight: '700',
  },
  trustText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Секции
  section: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: colors.bg,
  },
  sectionAlt: {
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Шаги
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Преимущества
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Категории
  catHeader: {
    marginBottom: 16,
  },
  catBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: 6,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.emerald,
    letterSpacing: 1.2,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catTile: {
    width: '31.5%',
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catIconText: {
    fontSize: 20,
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 15,
  },

  // CTA
  ctaBlock: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  ctaBtnWhite: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 32,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnWhiteText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaBtnOutline: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnOutlineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Футер
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
