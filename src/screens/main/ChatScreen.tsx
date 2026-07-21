import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { chatApi, ChatMessage } from '../../api/chat';

export default function ChatScreen({ route, navigation }: any) {
  const { orderId, orderTitle } = route.params as { orderId: number; orderTitle?: string };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const flatRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await chatApi.list(orderId, 1);
      // Показываем в хронологическом порядке (новые снизу)
      setMessages([...data.data].reverse());
    } catch {}
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, []);

  // Полинг раз в 10 секунд
  useEffect(() => {
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const { data } = await chatApi.send(orderId, trimmed);
      setMessages((prev) => [...prev, data.data]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(trimmed);
    }
    setSending(false);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Хедер */}
      <View style={s.header}>
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

      {/* Поле ввода */}
      <View style={s.inputRow}>
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
  header:         { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 52, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  back:           { width: 40, alignItems: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerSub:      { fontSize: 12, color: colors.textMuted },
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
});
