import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { masterProfileApi, MasterOwnProfile } from '../../api/masterProfile';
import { api } from '../../api/client';

interface Category { id: number; name: string }

export default function MasterProfileEditScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [profile,        setProfile]        = useState<MasterOwnProfile | null>(null);
  const [specialization, setSpecialization] = useState('');
  const [bio,            setBio]            = useState('');
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [selectedCats,   setSelectedCats]   = useState<number[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    Promise.all([
      masterProfileApi.get(),
      api.get<{ data: Category[] }>('/categories'),
    ]).then(([profileRes, catsRes]) => {
      const p = profileRes.data.data;
      setProfile(p);
      setSpecialization(p.specialization ?? '');
      setBio(p.bio ?? '');
      setSelectedCats(p.categories.map(c => c.id));
      setCategories(catsRes.data.data ?? (catsRes.data as any) ?? []);
    }).catch(() => {
      Alert.alert('Ошибка', 'Не удалось загрузить профиль');
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, []);

  const toggleCat = (id: number) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await masterProfileApi.update({
        specialization: specialization.trim() || undefined,
        bio:            bio.trim() || undefined,
        category_ids:   selectedCats,
      });
      Alert.alert('Сохранено', 'Профиль мастера обновлён', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось сохранить');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

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
          <Text style={s.title}>Профиль мастера</Text>
        </View>

        {/* Роль */}
        <View style={s.roleBadge}>
          <Text style={s.roleText}>
            {profile?.role === 'ip_pro' ? '🏢 ИП PRO' : '🔧 Самозанятый'}
            {profile?.is_pro ? ' · PRO' : ''}
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Специализация</Text>
          <Text style={s.hint}>Коротко о том, что вы умеете</Text>
          <TextInput
            style={s.input}
            value={specialization}
            onChangeText={setSpecialization}
            placeholder="Например: Электрик, сантехник, плиточник"
            placeholderTextColor={colors.textMuted}
            maxLength={200}
          />

          <Text style={[s.sectionTitle, { marginTop: 20 }]}>О себе</Text>
          <Text style={s.hint}>Опыт, достижения, особенности работы</Text>
          <TextInput
            style={[s.input, s.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Расскажите о себе подробнее..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        {/* Категории */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Категории услуг</Text>
          <Text style={s.hint}>Выберите все подходящие категории</Text>
          <View style={s.chips}>
            {categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, selectedCats.includes(c.id) && s.chipActive]}
                onPress={() => toggleCat(c.id)}
              >
                <Text style={[s.chipText, selectedCats.includes(c.id) && s.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCats.length > 0 && (
            <Text style={s.selectedCount}>Выбрано: {selectedCats.length}</Text>
          )}
        </View>

        <TouchableOpacity style={s.btn} onPress={save} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Сохранить профиль</Text>
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
  roleBadge:     { marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.emeraldDim, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.emerald + '40' },
  roleText:      { color: colors.emerald, fontSize: 13, fontWeight: '700' },
  section:       { margin: 16, marginBottom: 0, backgroundColor: colors.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  hint:          { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  input:         { backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  textarea:      { minHeight: 110 },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipActive:    { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  chipText:      { fontSize: 13, color: colors.textSecondary },
  chipTextActive:{ color: colors.emerald, fontWeight: '700' },
  selectedCount: { fontSize: 12, color: colors.emerald, marginTop: 10, fontWeight: '600' },
  btn:           { margin: 16, marginTop: 20, backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText:       { color: '#fff', fontWeight: '800', fontSize: 16 },
});
