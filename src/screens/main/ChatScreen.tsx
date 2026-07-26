import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { chatApi, ChatMessage } from '../../api/chat';

const QUICK_REPLIES_MASTER = [
  'Готов взяться за работу',
  'Уточните детали, пожалуйста',
  'Выезд возможен завтра',
  'Стоимость уточню после осмотра',
  'Работа выполнена, проверяйте',
];

const QUICK_REPLIES_CLIENT = [
  'Спасибо за быстрый ответ!',
  'Когда сможете приступить?',
  'Оплата после выполнения',
  'Жду вас по адресу',
  'Всё устраивает, принято',
];

export default function ChatScreen({ route, navigation }: any) {
  const { orderId, orderTitle } = route.params as { orderId: number; orderTitle?: string };
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore(s => s.user);
  const isMaster = user?.role === 'master_smz' || user?.role === 'ip_pro';
  const quickReplies = isMaster ? QUICK_REPLIES_MASTER : QUICK_REPLIES_CLIENT;

  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [loading, setLoading]         = useState(true);
  const [text, setText]               = useState('');
  const [sending, setSending]         = useState(false);
  const [olderPage, setOlderPage]     = useState(2);
  const [olderLastPage, setOlderLastPage] = useState(1);
  const [loadingOlder, setLoadingOlder]   = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Первичная загрузка — самая свежая страница
  const loadInitial = useCallback(async () => {
    try {
      const { data } = await chatApi.list(orderId, 1);
      setMessages([...data.data].reverse());
      setOlderLastPage(data.meta?.last_page ?? 1);
    } catch {}
    setLoading(false);
  }, [orderId]);

  useEffect(() => { loadInitial(); }, []);

  // Полинг — добавляем только новые сообщения (по ID)
  const pollNew = useCallback(async () => {
    try {
      const { data } = await chatApi.list(orderId, 1);
      const fresh = [...data.data].reverse();
      setMessages(prev => {
        if (!prev.length) return fresh;
        const maxId = Math.max(...prev.map(m => m.id));
        const newMsgs = fresh.filter(m => m.id > maxId);
        return newMsgs.length ? [...prev, ...newMsgs] : prev;
      });
    } catch {}
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(pollNew, 10_000);
    return () => clearInterval(timer);
  }, [pollNew]);

  // Загрузка старых сообщений
  const loadOlder = async () => {
    if (loadingOlder || olderPage > olderLastPage) return;
    setLoadingOlder(true);
    try {
      const { data } = await chatApi.list(orderId, olderPage);
      const older = [...data.data].reverse();
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const unique = older.filter(m => !existingIds.has(m.id));
        return [...unique, ...prev];
      });
      setOlderPage(p => p + 1);
      setOlderLastPage(data.meta?.last_page ?? 1);
    } catch {}
    setLoadingOlder(false);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const { data } = await chatApi.send(orderId, trimmed);
      setMessages(prev => [...prev, data.data]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(trimmed);
    }
    setSending(false);
  };

  const hasOlder = olderPage <= olderLastPage;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Хедер */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.emerald, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>Чат</Text>
          {orderTitle && <Text style={s.headerSub} numberOfLines={1}>{orderTitle}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            hasOlder ? (
              <TouchableOpacity
                style={s.loadOlderBtn}
                onPress={loadOlder}
                disabled={loadingOlder}
              >
                {loadingOlder
                  ? <ActivityIndicator color={colors.emerald} size="small" />
                  : <Text style={s.loadOlderText}>⬆ Загрузить более ранние</Text>
                }
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>Сообщений пока нет</Text>
              <Text style={s.emptySub}>Начните общение с заказчиком/исполнителем</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.bubble, item.is_mine ? s.bubbleMine : s.bubbleOther]}>
              {!item.is_mine && item.sender && (
                <Text style={s.senderName}>{item.sender.name}</Text>
              )}
              <Text style={[s.msgText, item.is_mine ? s.msgTextMine : s.msgTextOther]}>
                {item.text}
              </Text>
              <Text style={[s.time, item.is_mine ? { textAlign: 'right' } : {}]}>
                {new Date(item.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        />
      )}

      {/* Быстрые ответы */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.quickBar}
        contentContainerStyle={s.quickBarContent}
        keyboardShouldPersistTaps="handled"
      >
        {quickReplies.map((qr) => (
          <TouchableOpacity
            key={qr}
            style={s.quickBtn}
            onPress={() => setText(qr)}
            activeOpacity={0.75}
          >
            <Text style={s.quickBtnText}>{qr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Поле ввода */}
      <View style={[s.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={s.input}
          placeholder="Сообщение..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ color: '#fff', fontSize: 20, lineHeight: 24 }}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  back:           { width: 40, alignItems: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerSub:      { fontSize: 12, color: colors.textMuted },
  loadOlderBtn:   { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  loadOlderText:  { fontSize: 13, color: colors.emerald, fontWeight: '600' },
  bubble:         { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine:     { alignSelf: 'flex-end', backgroundColor: colors.emerald + 'CC' },
  bubbleOther:    { alignSelf: 'flex-start', backgroundColor: colors.surface },
  senderName:     { fontSize: 11, fontWeight: '700', color: colors.emerald, marginBottom: 3 },
  msgText:        { fontSize: 15, lineHeight: 21 },
  msgTextMine:    { color: '#fff' },
  msgTextOther:   { color: colors.textPrimary },
  time:           { fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.6)' },
  empty:          { alignItems: 'center', paddingTop: 80 },
  emptyText:      { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  emptySub:       { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  inputRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input:          { flex: 1, backgroundColor: colors.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.textPrimary, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  quickBar:       { flexGrow: 0, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  quickBarContent:{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quickBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  quickBtnText:   { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
});
