import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [login, setLogin]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const doLogin = useAuthStore((s) => s.login);

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

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.box}>
        {/* Логотип */}
        <Text style={s.logo}>Арбайтен</Text>
        <Text style={s.sub}>Маркетплейс услуг Сахалина</Text>

        <TextInput
          style={s.input}
          placeholder="Email или логин"
          placeholderTextColor={colors.textMuted}
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="Пароль"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Войти</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Нет аккаунта? <Text style={{ color: colors.emerald }}>Зарегистрироваться</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', paddingHorizontal: 24 },
  box:     { gap: 12 },
  logo:    { fontSize: 32, fontWeight: '700', color: colors.emerald, textAlign: 'center', marginBottom: 4 },
  sub:     { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  input:   {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.textPrimary, fontSize: 15,
  },
  btn:     {
    backgroundColor: colors.emerald, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:    { textAlign: 'center', color: colors.textSecondary, marginTop: 8, fontSize: 14 },
});
