import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { fleaApi } from '../../api/flea';
import { api } from '../../api/client';

interface Category { id: number; name: string }
interface City     { id: number; name: string }

const CONDITIONS = [
  { key: 'new',  label: 'Новое',    desc: 'Никогда не использовалось' },
  { key: 'good', label: 'Хорошее',  desc: 'Слегка б/у, отличное состояние' },
  { key: 'fair', label: 'Б/у',      desc: 'Видимые следы использования' },
];

const CONDITION_COLORS: Record<string, string> = {
  new:  colors.emerald,
  good: colors.sky,
  fair: colors.amber,
};

export default function FleaCreateScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [condition,   setCondition]   = useState('good');
  const [catId,       setCatId]       = useState<number | undefined>();
  const [cityId,      setCityId]      = useState<number | undefined>();
  const [photos,      setPhotos]      = useState<{ uri: string; type?: string; name?: string }[]>([]);

  const [categories,  setCategories]  = useState<Category[]>([]);
  const [cities,      setCities]      = useState<City[]>([]);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Category[] }>('/categories'),
      api.get<{ data: City[] }>('/cities'),
    ]).then(([cats, cits]) => {
      setCategories(cats.data.data ?? (cats.data as any) ?? []);
      setCities(cits.data.data ?? (cits.data as any) ?? []);
    }).catch(() => {});
  }, []);

  const pickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Лимит', 'Максимум 5 фото');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const ext  = asset.uri.split('.').pop() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    setPhotos(prev => [...prev, { uri: asset.uri, type: mime, name: `photo_${Date.now()}.${ext}` }]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Укажите название'); return; }
    const p = parseFloat(price.replace(',', '.'));
    if (isNaN(p) || p <= 0) { Alert.alert('Укажите корректную цену'); return; }

    setSaving(true);
    try {
      await fleaApi.create({
        title:       title.trim(),
        description: description.trim() || undefined,
        price:       p,
        condition,
        category_id: catId,
        city_id:     cityId,
        photos,
      });
      Alert.alert('Готово!', 'Объявление опубликовано', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось опубликовать');
    }
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Хедер */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>Новое объявление</Text>
        </View>

        {/* Фото */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Фото</Text>
          <Text style={s.hint}>До 5 фото. Первое будет на обложке.</Text>
          <View style={s.photoRow}>
            {photos.map((p, i) => (
              <View key={i} style={s.photoThumbWrap}>
                <Image source={{ uri: p.uri }} style={s.photoThumb} />
                {i === 0 && <View style={s.coverBadge}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>ОБЛОЖКА</Text></View>}
                <TouchableOpacity style={s.removePhotoBtn} onPress={() => removePhoto(i)}>
                  <Text style={{ color: '#fff', fontSize: 12, lineHeight: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={s.addPhotoBtn} onPress={pickPhoto}>
                <Text style={{ fontSize: 28, color: colors.emerald }}>+</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Фото</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Название */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Название *</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Например: Дрель DeWalt 18V"
            placeholderTextColor={colors.textMuted}
            maxLength={200}
          />
        </View>

        {/* Цена */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Цена *</Text>
          <View style={s.priceRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <Text style={s.currency}>₽</Text>
          </View>
        </View>

        {/* Состояние */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Состояние</Text>
          <View style={{ gap: 8, marginTop: 4 }}>
            {CONDITIONS.map(c => {
              const active = condition === c.key;
              const col = CONDITION_COLORS[c.key];
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[s.condOption, active && { borderColor: col, backgroundColor: col + '12' }]}
                  onPress={() => setCondition(c.key)}
                >
                  <View style={[s.condRadio, active && { borderColor: col, backgroundColor: col }]} />
                  <View>
                    <Text style={[s.condLabel, active && { color: col }]}>{c.label}</Text>
                    <Text style={s.condDesc}>{c.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Описание */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Описание</Text>
          <TextInput
            style={[s.input, s.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Состояние, причина продажи, комплектация..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        {/* Категория */}
        {categories.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Категория</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, catId === c.id && s.chipActive]}
                  onPress={() => setCatId(catId === c.id ? undefined : c.id)}
                >
                  <Text style={[s.chipText, catId === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Город */}
        {cities.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Город</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
              {cities.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.chip, cityId === c.id && s.chipActive]}
                  onPress={() => setCityId(cityId === c.id ? undefined : c.id)}
                >
                  <Text style={[s.chipText, cityId === c.id && s.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity style={s.btn} onPress={submit} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Опубликовать объявление</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  back:          { width: 40, alignItems: 'center' },
  title:         { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  section:       { margin: 16, marginBottom: 0, backgroundColor: colors.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  hint:          { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  input:         { backgroundColor: colors.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  textarea:      { minHeight: 100 },
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency:      { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  photoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  photoThumbWrap:{ position: 'relative' },
  photoThumb:    { width: 80, height: 80, borderRadius: 10 },
  coverBadge:    { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  removePhotoBtn:{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn:   { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: colors.emerald, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emeraldDim },
  condOption:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  condRadio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  condLabel:     { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  condDesc:      { fontSize: 12, color: colors.textMuted },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive:    { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  chipText:      { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive:{ color: colors.emerald, fontWeight: '700' },
  btn:           { margin: 16, marginTop: 20, backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText:       { color: '#fff', fontWeight: '800', fontSize: 16 },
});
