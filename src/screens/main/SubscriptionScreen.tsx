import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Plan {
  id: number; code: string; name: string; price: number;
  duration_days: number; target_role: string;
  features: Record<string, unknown>; discount_pct: number;
}
interface CurrentSub {
  id: number;
  plan: { id: number; name: string; code: string };
  starts_at: string; ends_at: string;
  auto_renew: boolean; is_active: boolean;
}

const PLAN_COLORS: Record<string, string> = {
  smz_pro: colors.emerald,
  ip_pro:  colors.amber,
};

function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000));
}

export default function SubscriptionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [current, setCurrent]   = useState<CurrentSub | null>(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get('/subscriptions/plans'),
      apiClient.get('/subscriptions/current'),
    ]).then(([p, c]) => {
      setPlans(p.data.data ?? []);
      setCurrent(c.data.subscription ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    Alert.alert(
      `Подключить «${plan.name}»`,
      `${plan.price.toLocaleString('ru')} ₽ / ${plan.duration_days === 30 ? 'мес' : 'год'}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Оплатить',
          onPress: async () => {
            setPaying(plan.id);
            try {
              const { data } = await apiClient.post('/subscriptions/subscribe', { plan_id: plan.id });
              const result = await WebBrowser.openAuthSessionAsync(
                data.payment_url, 'sakhmaster://'
              );
              if (result.type === 'success') {
                const { data: c } = await apiClient.get('/subscriptions/current');
                setCurrent(c.subscription ?? null);
                Alert.alert('Готово', 'Подписка активирована!');
              }
            } catch {
              Alert.alert('Ошибка', 'Не удалось создать платёж. Попробуйте позже.');
            }
            setPaying(null);
          },
        },
      ]
    );
  };

  const role = user?.role ?? '';
  const myPlans = plans.filter(p =>
    p.target_role === role || p.target_role === 'all'
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Подписка</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}>

          {/* Текущая подписка */}
          {current ? (
            <View style={s.activeBadge}>
              <View style={{ flex: 1 }}>
                <Text style={s.activeName}>{current.plan.name}</Text>
                <Text style={s.activeMeta}>
                  Активна ещё {daysLeft(current.ends_at)} дн. · до {new Date(current.ends_at).toLocaleDateString('ru')}
                </Text>
              </View>
              <View style={s.activeChip}>
                <Text style={s.activeChipText}>✓ Активна</Text>
              </View>
            </View>
          ) : (
            <View style={s.freeBanner}>
              <Text style={s.freeBannerTitle}>Бесплатный тариф</Text>
              <Text style={s.freeBannerSub}>
                Подключите PRO для снижения комиссии и дополнительных возможностей
              </Text>
            </View>
          )}

          {myPlans.length === 0 && (
            <Text style={[s.activeMeta, { textAlign: 'center', marginTop: 40 }]}>
              Тарифы для вашей роли пока недоступны
            </Text>
          )}

          {myPlans.map((plan) => {
            const accent = PLAN_COLORS[plan.code] ?? colors.emerald;
            const isAnnual = plan.duration_days > 31;
            const isCurrent = current?.plan.id === plan.id;

            return (
              <View key={plan.id} style={[s.card, { borderColor: isCurrent ? accent : colors.border }]}>
                {isAnnual && (
                  <View style={[s.annualBadge, { backgroundColor: accent }]}>
                    <Text style={s.annualBadgeText}>−{plan.discount_pct}% экономия</Text>
                  </View>
                )}

                <View style={s.cardHeader}>
                  <View style={[s.dot, { backgroundColor: accent }]} />
                  <Text style={s.cardName}>{plan.name}</Text>
                </View>

                <Text style={[s.price, { color: accent }]}>
                  {plan.price.toLocaleString('ru')} ₽
                  <Text style={s.pricePer}>
                    {' '}/ {isAnnual ? 'год' : 'мес'}
                  </Text>
                </Text>

                {plan.features && Object.entries(plan.features).map(([k, v]) => (
                  <Text key={k} style={s.feature}>
                    {v === true ? '✓' : '–'} {k}
                  </Text>
                ))}

                {isCurrent ? (
                  <View style={[s.btn, { backgroundColor: accent + '20', borderColor: accent }]}>
                    <Text style={[s.btnText, { color: accent }]}>Активна</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[s.btn, { backgroundColor: accent }]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={paying === plan.id}
                  >
                    {paying === plan.id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={[s.btnText, { color: '#fff' }]}>Подключить</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <Text style={s.note}>
            Оплата через T-Bank. Подписка продлевается автоматически.
            Отключить можно в личном кабинете на сайте.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  back:            { width: 60 },
  backText:        { color: colors.emerald, fontSize: 17 },
  title:           { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  activeBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.emeraldDim, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.emerald + '40' },
  activeName:      { fontSize: 16, fontWeight: '700', color: colors.emerald },
  activeMeta:      { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  activeChip:      { backgroundColor: colors.emerald, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  activeChipText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  freeBanner:      { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  freeBannerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  freeBannerSub:   { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card:            { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, position: 'relative', overflow: 'hidden' },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot:             { width: 10, height: 10, borderRadius: 5 },
  cardName:        { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  price:           { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  pricePer:        { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  feature:         { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  btn:             { marginTop: 16, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  btnText:         { fontSize: 16, fontWeight: '700' },
  annualBadge:     { position: 'absolute', top: 14, right: 14, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  annualBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  note:            { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
});
