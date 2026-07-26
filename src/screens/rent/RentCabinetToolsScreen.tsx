import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { api } from '../../api/client';

interface Tool {
  id: number; name: string; is_available: boolean;
  rate_per_day: number; category: { id: number; name: string } | null; cover: string | null;
}

export default function RentCabinetToolsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tools,      setTools]      = useState<Tool[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/rent-cabinet/tools', { params: { page: p } });
      setTools(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.meta?.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleToggle = async (tool: Tool) => {
    const newState = !tool.is_available;
    const label    = newState ? 'Сделать доступным' : 'Скрыть';
    Alert.alert(label, `Инструмент «${tool.name}»`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: label,
        onPress: async () => {
          try {
            await api.patch(`/rent-cabinet/tools/${tool.id}/toggle`, {});
            setTools(prev => prev.map(t => t.id === tool.id ? { ...t, is_available: newState } : t));
          } catch {
            Alert.alert('Ошибка', 'Не удалось изменить доступность');
          }
        },
      },
    ]);
  };

  const renderTool = ({ item }: { item: Tool }) => (
    <View style={s.card}>
      <View style={s.row}>
        {item.cover ? (
          <Image source={{ uri: item.cover }} style={s.thumb} />
        ) : (
          <View style={[s.thumb, s.thumbPlaceholder]}>
            <Text style={{ fontSize: 26 }}>🔩</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          {item.category && <Text style={s.cat}>{item.category.name}</Text>}
          {item.rate_per_day > 0 && (
            <Text style={s.rate}>{item.rate_per_day.toLocaleString('ru')} ₽/сут</Text>
          )}
        </View>
        <TouchableOpacity
          style={[s.toggleBtn, item.is_available ? s.toggleOn : s.toggleOff]}
          onPress={() => handleToggle(item)}
        >
          <Text style={[s.toggleText, { color: item.is_available ? colors.emerald : colors.textMuted }]}>
            {item.is_available ? '✓ Активен' : '✗ Скрыт'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Мои инструменты</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={tools}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={colors.emerald} />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔩</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Инструментов нет</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
                Добавляйте инструменты через личный кабинет на сайте
              </Text>
            </View>
          }
          renderItem={renderTool}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:            { color: colors.emerald, fontSize: 16 },
  title:           { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  card:            { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb:           { width: 60, height: 60, borderRadius: 10 },
  thumbPlaceholder:{ backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  name:            { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cat:             { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rate:            { fontSize: 13, fontWeight: '700', color: colors.emerald, marginTop: 4 },
  toggleBtn:       { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, alignItems: 'center' },
  toggleOn:        { backgroundColor: colors.emeraldDim, borderColor: colors.emerald + '50' },
  toggleOff:       { backgroundColor: colors.surface2, borderColor: colors.border },
  toggleText:      { fontSize: 12, fontWeight: '700' },
});
