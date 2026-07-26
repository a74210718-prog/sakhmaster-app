import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [login, setLogin]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [socialLoading, setSocial]  = useState<'vk' | 'yandex' | null>(null);
  const doLogin        = useAuthStore((s) => s.login);
  const loginWithToken = useAuthStore((s) => s.loginWithToken);

  const handleLogin = async () => {
    if (!login.trim() || !password) return;
    setLoading(true);
    try {
      await doLogin(login.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'vk' | 'yandex') => {
    setSocial(provider);
    try {
      const { data } = await api.get<{ url: string }>(`/auth/social/${provider}/url`);
      const result = await WebBrowser.openAuthSessionAsync(data.url, 'sakhmaster://');

      if (result.type !== 'success') return;

      // result.url = sakhmaster://auth?token=xxx&provider=yyy
      const urlObj = new URL(result.url);
      const token  = urlObj.searchParams.get('token');
      const error  = urlObj.searchParams.get('error');

      if (error) {
        Alert.alert('Ошибка', 'Авторизация отменена или не удалась');
        return;
      }
      if (!token) {
        Alert.alert('Ошибка', 'Не получен токен авторизац��и');
        return;
      }

      await loginWithToken(token);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message ?? 'Не удалось войти через социальную сеть');
    } finally {
      setSocial(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.box}>
        <Text style={s.logo}>Ладорея</Text>
        <Text style={s.sub}>Маркетплейс услуг по всей России</Text>

        <TextInput
          style={s.input}
          placeholder="Email или логин"
          placeholderTextColor={colors.textMuted}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Пароль"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading || !!socialLoading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Войти</Text>}
        </TouchableOpacity>

        {/* Разделитель */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>или войдите через</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Социальные кнопки */}
        <View style={s.socialRow}>
          <TouchableOpacity
            style={[s.socialBtn, s.vkBtn]}
            onPress={() => handleSocial('vk')}
            disabled={loading || !!socialLoading}
          >
            {socialLoading === 'vk'
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.socialBtnText}>ВКонтакте</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.socialBtn, s.yandexBtn]}
            onPress={() => handleSocial('yandex')}
            disabled={loading || !!socialLoading}
          >
            {socialLoading === 'yandex'
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.socialBtnText}>Яндекс ID</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Нет аккаунта? <Text style={{ color: colors.emerald }}>Зарегистрироваться</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={{ marginTop: 4 }}>
          <Text style={[s.link, { color: colors.textMuted, fontSize: 13 }]}>← На главную</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', paddingHorizontal: 24 },
  box:            { gap: 12 },
  logo:           { fontSize: 32, fontWeight: '700', color: colors.emerald, textAlign: 'center', marginBottom: 4 },
  sub:            { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  input:          {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.textPrimary, fontSize: 15,
  },
  btn:            { backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnText:        { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:           { textAlign: 'center', color: colors.textSecondary, marginTop: 8, fontSize: 14 },
  dividerRow:     { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText:    { color: colors.textMuted, fontSize: 12, marginHorizontal: 10 },
  socialRow:      { flexDirection: 'row', gap: 10 },
  socialBtn:      { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  vkBtn:          { backgroundColor: '#0077FF' },
  yandexBtn:      { backgroundColor: '#FC3F1D' },
  socialBtnText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
});
