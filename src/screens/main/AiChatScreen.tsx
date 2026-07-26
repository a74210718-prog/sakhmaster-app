import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';

interface Agent { slug: string; name: string; icon: string; color: string }
interface Message { id: string; role: 'user' | 'assistant'; content: string }

const WELCOME = 'Привет! Я ИИ-ассистент платформы Ладорея. Чем могу помочь?';

export default function AiChatScreen({ navigation }: any) {
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [agents, setAgents]         = useState<Agent[]>([]);
  const [agent, setAgent]           = useState<Agent | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    apiClient.get('/ai/agents').then(({ data }) => {
      setAgents(data);
      if (data.length > 0) {
        setAgent(data[0]);
        setMessages([{ id: 'welcome', role: 'assistant', content: WELCOME }]);
      }
    }).catch(() => {}).finally(() => setLoadingAgents(false));
  }, []);

  const selectAgent = (a: Agent) => {
    setAgent(a);
    setMessages([{ id: 'welcome', role: 'assistant', content: `Привет! Я ${a.name}. Чем могу помочь?` }]);
    setSessionUuid(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !agent) return;

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await apiClient.post(`/ai/chat/${agent.slug}`, {
        message: text,
        session_uuid: sessionUuid,
      });
      if (data.session_uuid) setSessionUuid(data.session_uuid);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply ?? 'Нет ответа',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Не удалось получить ответ. Попробуйте ещё раз.',
      }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Хедер */}
        <View style={s.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
              <Text style={s.backText}>‹ Назад</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
          <View style={{ alignItems: 'center' }}>
            {agent && <Text style={{ fontSize: 20 }}>{agent.icon}</Text>}
            <Text style={s.headerTitle}>{agent?.name ?? 'ИИ-ассистент'}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Выбор агента */}
        {loadingAgents ? (
          <ActivityIndicator color={colors.emerald} style={{ marginTop: 16 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.agentScroll}
          >
            {agents.map((a) => (
              <TouchableOpacity
                key={a.slug}
                style={[s.agentChip, agent?.slug === a.slug && { borderColor: a.color ?? colors.emerald, backgroundColor: (a.color ?? colors.emerald) + '20' }]}
                onPress={() => selectAgent(a)}
              >
                <Text>{a.icon}</Text>
                <Text style={[s.agentChipText, agent?.slug === a.slug && { color: a.color ?? colors.emerald }]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Чат */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View style={[
              s.bubble,
              item.role === 'user' ? s.bubbleUser : s.bubbleBot,
            ]}>
              <Text style={[
                s.bubbleText,
                item.role === 'user' ? s.bubbleTextUser : s.bubbleTextBot,
              ]}>
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={[s.bubble, s.bubbleBot, { paddingVertical: 12 }]}>
                <ActivityIndicator color={colors.emerald} size="small" />
              </View>
            ) : null
          }
        />

        {/* Поле ввода */}
        <View style={[s.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={s.textInput}
            placeholder="Напишите вопрос…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, { opacity: (!input.trim() || loading) ? 0.4 : 1 }]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: colors.bg },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  back:             { width: 60 },
  backText:         { color: colors.emerald, fontSize: 17 },
  headerTitle:      { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  agentScroll:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  agentChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  agentChipText:    { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  bubble:           { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:       { alignSelf: 'flex-end', backgroundColor: colors.emerald, borderBottomRightRadius: 4 },
  bubbleBot:        { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText:       { fontSize: 15, lineHeight: 22 },
  bubbleTextUser:   { color: '#fff' },
  bubbleTextBot:    { color: colors.textPrimary },
  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border, gap: 8 },
  textInput:        { flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, maxHeight: 120 },
  sendBtn:          { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center' },
  sendIcon:         { color: '#fff', fontSize: 20, fontWeight: '700' },
});
