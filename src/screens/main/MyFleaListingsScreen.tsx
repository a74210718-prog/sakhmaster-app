import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fleaApi, FleaItem } from '../../api/flea';

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  active:   { label: 'Активно',  color: colors.emerald },
  sold:     { label: 'Продано',  color: colors.textMuted },
  closed:   { label: 'Закрыто', color: colors.textMuted },
  reserved: { label: 'Резерв',  color: colors.amber },
};

export default function MyFleaListingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [items,      setItems]      = useState<FleaItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [lastPage,   setLastPage]   = useState(1);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await fleaApi.myListings(p);
      setItems(p === 1 ? (data.data ?? []) : prev => [...prev, ...(data.data ?? [])]);
      setLastPage(data.last_page ?? 1);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const handleClose = (id: number) => {
    Alert.alert('Закрыть объявление?', 'Оно будет помечено как проданное/закрытое.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Закрыть', style: 'destructive',
        onPress: async () => {
          try {
            await fleaApi.close(id);
            setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'sold' } : i));
          } catch {
            Alert.alert('Ошибка', 'Не удалось закрыть объявление');
          }
        },
      },
    ]);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Удалить?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          try {
            await fleaApi.delete(id);
            setItems(prev => prev.filter(i => i.id !== id));
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FleaItem }) => {
    const st = STATUS_STYLES[item.status] ?? { label: item.status, color: colors.textMuted };
    const photo = item.photos?.[0]?.url;
    const isActive = item.status === 'active';

    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          {photo ? (
            <Image source={{ uri: photo }} style={s.thumb} />
          ) : (
            <View style={[s.thumb, s.thumbPlaceholder]}>
              <Text style={{ fontSize: 28 }}>🏷️</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.itemTitle} numberOfLines={2}>{item.title}</Text>
              <View style={[s.badge, { backgroundColor: st.color + '20', borderColor: st.color + '40' }]}>
                <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <Text style={s.price}>{item.price.toLocaleString('ru')} ₽</Text>
            {item.city && <Text style={s.meta}>📍 {item.city.name}</Text>}
          </View>
        </View>

        {isActive && (
          <View style={s.actions}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => navigation.navigate('FleaEdit', { item })}
            >
              <Text style={s.actionBtnText}>✏️ Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDanger]}
              onPress={() => handleClose(item.id)}
            >
              <Text style={[s.actionBtnText, { color: colors.amber }]}>✓ Закрыть</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { borderColor: colors.rose + '40' }]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={[s.actionBtnText, { color: colors.rose }]}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isActive && (
          <TouchableOpacity
            style={[s.actionBtn, { marginTop: 8, borderColor: colors.rose + '40' }]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={[s.actionBtnText, { color: colors.rose }]}>🗑 Удалить</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.title}>Мои объявления</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('FleaCreate')}
          style={s.addBtn}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Добавить</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1, true); }}
              tintColor={colors.emerald}
            />
          }
          onEndReached={() => { if (page < lastPage) load(page + 1, true); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏷️</Text>
              <Text style={s.emptyText}>Объявлений ещё нет</Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('FleaCreate')}
              >
                <Text style={s.emptyBtnText}>Создать объявление</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  back:        { color: colors.emerald, fontSize: 16 },
  title:       { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  addBtn:      { backgroundColor: colors.emerald, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  card:        { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardRow:     { flexDirection: 'row', gap: 12 },
  thumb:       { width: 72, height: 72, borderRadius: 10 },
  thumbPlaceholder: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  titleRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', flex: 1 },
  itemTitle:   { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  badge:       { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  badgeText:   { fontSize: 11, fontWeight: '600' },
  price:       { fontSize: 16, fontWeight: '700', color: colors.emerald, marginTop: 4 },
  meta:        { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions:     { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn:   { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  actionBtnDanger: { borderColor: colors.amber + '40' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyText:   { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginBottom: 20 },
  emptyBtn:    { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
});
