import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { mastersApi, MasterDetail } from '../../api/masters';
import { reviewsApi, Review } from '../../api/reviews';

export default function MasterDetailScreen({ route, navigation }: any) {
  const { id } = route.params as { id: number };
  const insets = useSafeAreaInsets();
  const [master,  setMaster]  = useState<MasterDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mastersApi.show(id),
      reviewsApi.forMaster(id),
    ]).then(([mRes, rRes]) => {
      setMaster(mRes.data.data);
      setReviews(rRes.data.data ?? []);
    }).catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (!master) return null;

  const roleColor = master.role === 'ip_pro' ? colors.amber : colors.emerald;

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Профиль мастера</Text>
      </View>

      {/* Аватар */}
      <View style={s.hero}>
        {master.avatar ? (
          <Image source={{ uri: master.avatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarLetter}>{master.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <Text style={s.name}>{master.name}</Text>
        {master.specialization ? (
          <Text style={s.spec}>{master.specialization}</Text>
        ) : null}
        <View style={s.badges}>
          <View style={[s.roleBadge, { borderColor: roleColor + '50', backgroundColor: roleColor + '15' }]}>
            <Text style={[s.roleText, { color: roleColor }]}>
              {master.role === 'ip_pro' ? 'ИП' : 'Самозанятый'}
            </Text>
          </View>
          {master.is_pro && (
            <View style={s.proBadge}>
              <Text style={{ color: colors.amber, fontSize: 12, fontWeight: '800' }}>PRO</Text>
            </View>
          )}
        </View>
        {master.rating != null && (
          <View style={s.ratingRow}>
            <Text style={s.ratingText}>⭐ {Number(master.rating).toFixed(1)}</Text>
            {master.reviews_count != null && master.reviews_count > 0 && (
              <Text style={s.reviewsText}> · {master.reviews_count} отзывов</Text>
            )}
          </View>
        )}
      </View>

      {/* Город */}
      {master.city && (
        <View style={s.card}>
          <Text style={s.cardLabel}>Город</Text>
          <Text style={s.cardValue}>{master.city.name}</Text>
        </View>
      )}

      {/* Специализации */}
      {master.categories && master.categories.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardLabel}>Специализации</Text>
          <View style={s.chips}>
            {master.categories.map((c) => (
              <View key={c.id} style={s.chip}>
                <Text style={s.chipText}>{c.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* О себе */}
      {master.bio ? (
        <View style={s.card}>
          <Text style={s.cardLabel}>О себе</Text>
          <Text style={s.bioText}>{master.bio}</Text>
        </View>
      ) : null}

      {/* Отзывы */}
      {reviews.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={s.sectionTitle}>Отзывы ({reviews.length})</Text>
          {reviews.slice(0, 5).map(r => (
            <View key={r.id} style={s.reviewCard}>
              <View style={s.reviewTop}>
                <Text style={s.reviewAuthor}>{r.client.name}</Text>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1,2,3,4,5].map(n => (
                    <Text key={n} style={{ fontSize: 12, color: n <= r.rating ? colors.amber : colors.border }}>★</Text>
                  ))}
                </View>
              </View>
              {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
              <Text style={s.reviewDate}>{new Date(r.created_at).toLocaleDateString('ru')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => navigation.navigate('CreateOrder')}
          activeOpacity={0.85}
        >
          <Text style={s.ctaText}>Создать заказ для мастера</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 8 },
  reviewCard:   { marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 4 },
  reviewTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviewComment:{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  reviewDate:   { fontSize: 11, color: colors.textMuted },
  back:         { width: 40, alignItems: 'center' },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  hero:         { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar:       { width: 90, height: 90, borderRadius: 28, borderWidth: 2, borderColor: colors.emerald + '60' },
  avatarFallback: { backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 38, fontWeight: '700', color: colors.emerald },
  name:         { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  spec:         { fontSize: 14, color: colors.textMuted },
  badges:       { flexDirection: 'row', gap: 8 },
  roleBadge:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleText:     { fontSize: 13, fontWeight: '600' },
  proBadge:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.amber + '50', backgroundColor: colors.amberDim + '40' },
  ratingRow:    { flexDirection: 'row', alignItems: 'center' },
  ratingText:   { fontSize: 15, fontWeight: '700', color: colors.amber },
  reviewsText:  { fontSize: 13, color: colors.textMuted },
  card:         { marginHorizontal: 16, marginTop: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
  cardLabel:    { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardValue:    { fontSize: 15, color: colors.textPrimary },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { backgroundColor: colors.emeraldDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.emerald + '30' },
  chipText:     { fontSize: 13, color: colors.emerald, fontWeight: '600' },
  bioText:      { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  ctaBtn:       { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText:      { color: '#fff', fontWeight: '800', fontSize: 16 },
});
