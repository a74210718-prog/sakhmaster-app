import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { masterProfileApi, MasterStats } from '../../api/masterProfile';
import { reviewsApi, Review } from '../../api/reviews';
import { useAuthStore } from '../../store/authStore';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, color ? { color } : {}]}>{value}</Text>
      {sub ? <Text style={[s.statSub, { color: color ?? colors.textMuted }]}>{sub}</Text> : null}
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Text key={n} style={{ fontSize: 14, color: n <= rating ? colors.amber : colors.border }}>★</Text>
      ))}
    </View>
  );
}

export default function MasterStatsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore(s => s.user);

  const [stats,      setStats]      = useState<MasterStats | null>(null);
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        masterProfileApi.stats(),
        reviewsApi.my(),
      ]);
      setStats(sRes.data);
      setReviews(rRes.data.data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
    >
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Моя статистика</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <>
          {/* Статы */}
          <View style={s.grid}>
            <StatCard label="Выполнено заказов"  value={stats?.completed_orders ?? 0} color={colors.emerald} />
            <StatCard label="В работе"           value={stats?.in_work_orders ?? 0} color={colors.sky} />
            <StatCard label="Рейтинг"            value={stats?.rating?.toFixed(1) ?? '—'} sub="из 5.0" color={colors.amber} />
            <StatCard label="Отзывов"            value={stats?.reviews_count ?? 0} />
            <StatCard
              label="Заработано за месяц"
              value={`${(stats?.earned_month ?? 0).toLocaleString('ru')} ₽`}
              color={colors.emerald}
            />
            <StatCard
              label="Заработано всего"
              value={`${(stats?.earned_total ?? 0).toLocaleString('ru')} ₽`}
            />
          </View>

          {/* Отзывы */}
          <Text style={s.sectionTitle}>Отзывы клиентов</Text>
          {reviews.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>⭐</Text>
              <Text style={s.emptyText}>Отзывов пока нет</Text>
              <Text style={s.emptySub}>Выполняйте заказы и получайте первые оценки</Text>
            </View>
          ) : (
            reviews.map(r => (
              <View key={r.id} style={s.reviewCard}>
                <View style={s.reviewTop}>
                  <Text style={s.reviewAuthor}>{r.client.name}</Text>
                  <StarRow rating={r.rating} />
                </View>
                {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
                <Text style={s.reviewDate}>{new Date(r.created_at).toLocaleDateString('ru')}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  back:          { width: 40, alignItems: 'center' },
  title:         { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard:      { width: '47%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statValue:     { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  statSub:       { fontSize: 11, fontWeight: '600' },
  statLabel:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 16, marginBottom: 10 },
  reviewCard:    { backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 6 },
  reviewTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor:  { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reviewComment: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  reviewDate:    { fontSize: 11, color: colors.textMuted },
  empty:         { alignItems: 'center', paddingVertical: 40 },
  emptyText:     { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySub:      { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
