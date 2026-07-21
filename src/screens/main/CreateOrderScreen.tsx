import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, ActivityIndicator, Alert,
  Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';
import { ordersApi } from '../../api/orders';

interface Category { id: number; name: string }
interface CityItem { id: number; name: string }
interface RegionGroup { region: string; cities: CityItem[] }

export default function CreateOrderScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [budget, setBudget]         = useState('');
  const [isUrgent, setIsUrgent]     = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cityId, setCityId]         = useState<number | null>(null);
  const [cityName, setCityName]     = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions]       = useState<RegionGroup[]>([]);
  const [loading, setLoading]       = useState(false);
  const [cityModal, setCityModal]   = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Category[] }>('/categories')
      .then(r => setCategories(r.data.data ?? (r.data as any)))
      .catch(() => {});
    api.get<{ data: RegionGroup[] }>('/cities')
      .then(r => {
        const data = r.data.data ?? (r.data as any);
        setRegions(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Отфильтрованные регионы по поиску
  const filteredRegions = citySearch.trim()
    ? regions.map(rg => ({
        ...rg,
        cities: rg.cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
      })).filter(rg => rg.cities.length > 0)
    : regions;

  const selectCity = (city: CityItem) => {
    setCityId(city.id);
    setCityName(city.name);
    setCityModal(false);
    setCitySearch('');
    setExpandedRegion(null);
  };

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Ошибка', 'Введите название заказа'); return; }
    if (!categoryId)   { Alert.alert('Ошибка', 'Выберите категорию'); return; }
    if (!cityId)       { Alert.alert('Ошибка', 'Выберите город'); return; }
    setLoading(true);
    try {
      await ordersApi.create({
        title:       title.trim(),
        description: description.trim() || undefined,
        total_sum:   budget ? parseInt(budget, 10) : 0,
        is_urgent:   isUrgent,
        category_id: categoryId,
        city_id:     cityId,
      });
      Alert.alert('Готово', 'Заказ размещён!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось создать заказ');
    }
    setLoading(false);
  };

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Хедер */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Новый заказ</Text>
        </View>

        {/* Название */}
        <Text style={s.label}>Название *</Text>
        <TextInput
          style={s.input}
          placeholder="Например: Поклеить обои в комнате"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {/* Описание */}
        <Text style={s.label}>Описание</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Площадь, материалы, пожелания..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDesc}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
        />

        {/* Бюджет */}
        <Text style={s.label}>Бюджет (₽)</Text>
        <TextInput
          style={s.input}
          placeholder="0 — договорная"
          placeholderTextColor={colors.textMuted}
          value={budget}
          onChangeText={setBudget}
          keyboardType="number-pad"
        />

        {/* Категория */}
        <Text style={s.label}>Категория *</Text>
        <View style={s.chips}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.chip, categoryId === c.id && s.chipActive]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[s.chipText, categoryId === c.id && s.chipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Город */}
        <Text style={s.label}>Город *</Text>
        <TouchableOpacity style={s.cityPicker} onPress={() => setCityModal(true)}>
          <Text style={cityId ? s.cityPickerSelected : s.cityPickerPlaceholder}>
            {cityId ? cityName : 'Выбрать город...'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Срочно */}
        <View style={s.urgentRow}>
          <View>
            <Text style={s.urgentLabel}>Срочный заказ</Text>
            <Text style={s.urgentSub}>Мастера увидят его первым</Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={setIsUrgent}
            trackColor={{ false: colors.border, true: colors.rose + '80' }}
            thumbColor={isUrgent ? colors.rose : colors.textMuted}
          />
        </View>

        {/* Кнопка */}
        <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>Разместить заказ</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Модалка выбора города */}
      <Modal visible={cityModal} animationType="slide" onRequestClose={() => setCityModal(false)}>
        <View style={[m.root, { paddingTop: insets.top }]}>
          <View style={m.header}>
            <Text style={m.title}>Выберите город</Text>
            <TouchableOpacity onPress={() => { setCityModal(false); setCitySearch(''); }}>
              <Text style={{ color: colors.emerald, fontSize: 16, fontWeight: '600' }}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          {/* Поиск */}
          <View style={m.searchWrap}>
            <TextInput
              style={m.searchInput}
              placeholder="Поиск города..."
              placeholderTextColor={colors.textMuted}
              value={citySearch}
              onChangeText={setCitySearch}
              autoCapitalize="words"
            />
          </View>

          <FlatList
            data={filteredRegions}
            keyExtractor={(item) => item.region}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item: rg }) => {
              const expanded = expandedRegion === rg.region || !!citySearch.trim();
              return (
                <View>
                  <TouchableOpacity
                    style={m.regionRow}
                    onPress={() => setExpandedRegion(expanded ? null : rg.region)}
                  >
                    <Text style={m.regionName}>{rg.region}</Text>
                    <Text style={m.regionCount}>{rg.cities.length} гор.</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 18 }}>
                      {expanded ? '∨' : '›'}
                    </Text>
                  </TouchableOpacity>
                  {expanded && rg.cities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={[m.cityRow, cityId === city.id && m.cityRowActive]}
                      onPress={() => selectCity(city)}
                    >
                      <Text style={[m.cityName, cityId === city.id && { color: colors.emerald }]}>
                        {city.name}
                      </Text>
                      {cityId === city.id && <Text style={{ color: colors.emerald }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  back:            { width: 40, alignItems: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  label:           { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 16 },
  input:           { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  textarea:        { minHeight: 100 },
  chips:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive:      { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  chipText:        { fontSize: 14, color: colors.textSecondary },
  chipTextActive:  { color: colors.emerald, fontWeight: '700' },
  cityPicker:      { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityPickerPlaceholder: { color: colors.textMuted, fontSize: 15 },
  cityPickerSelected:    { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  urgentRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 20 },
  urgentLabel:     { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  urgentSub:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submitBtn:       { marginTop: 24, backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText:      { color: '#fff', fontWeight: '800', fontSize: 16 },
});

const m = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title:       { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  searchWrap:  { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  regionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  regionName:  { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  regionCount: { fontSize: 12, color: colors.textMuted },
  cityRow:     { paddingHorizontal: 32, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border + '60', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityRowActive: { backgroundColor: colors.emeraldDim + '40' },
  cityName:    { fontSize: 15, color: colors.textSecondary },
});
