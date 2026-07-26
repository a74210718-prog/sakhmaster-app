import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fleaApi, FleaItem, conditionLabel } from '../../api/flea';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_W } = Dimensions.get('window');

const CONDITION_COLORS: Record<string, string> = {
  new:  colors.emerald,
  good: colors.sky,
  fair: colors.amber,
};

export default function FleaItemScreen({ route, navigation }: any) {
  const { id } = route.params as { id: number };
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);

  const [item,    setItem]    = useState<FleaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fleaApi.show(id)
      .then(r => setItem(r.data.data))
      .catch(() => { Alert.alert('Ошибка', 'Не удалось загрузить товар'); navigation.goBack(); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Удалить объявление?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await fleaApi.delete(id);
            navigation.goBack();
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.seller.id;
  const condColor = CONDITION_COLORS[item.condition] ?? colors.textMuted;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Фото */}
        {item.photos && item.photos.length > 0 ? (
          <View>
            <Image
              source={{ uri: item.photos[photoIdx].url }}
              style={{ width: SCREEN_W, height: SCREEN_W * 0.75 }}
              resizeMode="cover"
            />
            {item.photos.length > 1 && (
              <View style={s.photoDots}>
                {item.photos.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                    <View style={[s.dot, i === photoIdx && s.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.noPhoto}>
            <Text style={{ fontSize: 48 }}>🏷️</Text>
          </View>
        )}

        {/* Хедер */}
        <View style={[s.backBtn, { top: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtnInner}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '700' }}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Основное */}
        <View style={s.body}>
          <View style={s.topRow}>
            <Text style={s.price}>{item.price.toLocaleString('ru')} ₽</Text>
            <View style={[s.condBadge, { borderColor: condColor + '50', backgroundColor: condColor + '15' }]}>
              <Text style={[s.condText, { color: condColor }]}>{conditionLabel(item.condition)}</Text>
            </View>
          </View>

          <Text style={s.title}>{item.title}</Text>

          <View style={s.tags}>
            {item.category && (
              <View style={s.tag}><Text style={s.tagText}>{item.category.name}</Text></View>
            )}
            {item.city && (
              <View style={s.tag}><Text style={s.tagText}>📍 {item.city.name}</Text></View>
            )}
          </View>

          {item.description ? (
            <View style={s.descCard}>
              <Text style={s.descLabel}>Описание</Text>
              <Text style={s.descText}>{item.description}</Text>
            </View>
          ) : null}

          {/* Продавец */}
          <View style={s.sellerCard}>
            <Text style={s.sellerLabel}>Продавец</Text>
            <View style={s.sellerRow}>
              {item.seller.avatar ? (
                <Image source={{ uri: item.seller.avatar }} style={s.sellerAvatar} />
              ) : (
                <View style={[s.sellerAvatar, s.sellerAvatarFallback]}>
                  <Text style={{ color: colors.emerald, fontWeight: '700' }}>{item.seller.name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              <Text style={s.sellerName}>{item.seller.name}</Text>
            </View>
          </View>

          <Text style={s.date}>
            Опубликовано {new Date(item.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </ScrollView>

      {/* Кнопки внизу */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isOwner ? (
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator color={colors.rose} />
              : <Text style={s.deleteBtnText}>Удалить объявление</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => navigation.navigate('Chat', { userId: item.seller.id, userName: item.seller.name })}
            activeOpacity={0.85}
          >
            <Text style={s.chatBtnText}>💬  Написать продавцу</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backBtn:          { position: 'absolute', left: 16, zIndex: 10 },
  backBtnInner:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  noPhoto:          { height: 260, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoDots:        { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 8, paddingBottom: 4 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive:        { backgroundColor: colors.emerald, width: 16 },
  body:             { padding: 20, gap: 12 },
  topRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:            { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  condBadge:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  condText:         { fontSize: 13, fontWeight: '700' },
  title:            { fontSize: 20, fontWeight: '700', color: colors.textPrimary, lineHeight: 28 },
  tags:             { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag:              { backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  tagText:          { fontSize: 12, color: colors.textMuted },
  descCard:         { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6 },
  descLabel:        { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  descText:         { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  sellerCard:       { backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 },
  sellerLabel:      { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  sellerRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerAvatar:     { width: 40, height: 40, borderRadius: 12 },
  sellerAvatarFallback: { backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center' },
  sellerName:       { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  date:             { fontSize: 12, color: colors.textMuted },
  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 12 },
  chatBtn:          { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  chatBtnText:      { color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteBtn:        { borderRadius: 14, borderWidth: 1, borderColor: colors.rose, paddingVertical: 16, alignItems: 'center' },
  deleteBtnText:    { color: colors.rose, fontWeight: '700', fontSize: 15 },
});
