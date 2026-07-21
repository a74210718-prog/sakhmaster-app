import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { reviewsApi } from '../../api/reviews';

export default function ReviewScreen({ route, navigation }: any) {
  const { orderId, masterName } = route.params as { orderId: number; masterName: string };
  const insets = useSafeAreaInsets();

  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { Alert.alert('Ошибка', 'Выберите оценку от 1 до 5'); return; }
    setLoading(true);
    try {
      await reviewsApi.store({ order_id: orderId, rating, comment: comment.trim() || undefined });
      Alert.alert('Спасибо!', 'Отзыв успешно отправлен', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось отправить отзыв');
    }
    setLoading(false);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      {/* Хедер */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Оставить отзыв</Text>
      </View>

      <View style={s.body}>
        <Text style={s.masterName}>{masterName}</Text>
        <Text style={s.subtitle}>Оцените качество работы мастера</Text>

        {/* Звёзды */}
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
              <Text style={[s.star, n <= rating && s.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={s.ratingLabel}>
            {['', 'Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][rating]}
          </Text>
        )}

        {/* Комментарий */}
        <Text style={s.label}>Комментарий (необязательно)</Text>
        <TextInput
          style={s.input}
          placeholder="Расскажите о работе мастера..."
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
        />

        {/* Кнопка */}
        <TouchableOpacity style={[s.btn, rating === 0 && s.btnDisabled]} onPress={submit} disabled={loading || rating === 0}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Отправить отзыв</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  back:        { width: 40, alignItems: 'center' },
  title:       { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  body:        { flex: 1, paddingHorizontal: 24 },
  masterName:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginTop: 24, marginBottom: 4 },
  subtitle:    { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  stars:       { flexDirection: 'row', gap: 12, marginBottom: 10 },
  star:        { fontSize: 48, color: colors.border },
  starActive:  { color: colors.amber },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: colors.amber, marginBottom: 24, textAlign: 'center' },
  label:       { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 8 },
  input:       { backgroundColor: colors.surface, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, minHeight: 100 },
  btn:         { marginTop: 28, backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { backgroundColor: colors.emerald + '50' },
  btnText:     { color: '#fff', fontWeight: '800', fontSize: 16 },
});
