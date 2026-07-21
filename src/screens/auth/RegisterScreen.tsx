import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../../theme/colors';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [role, setRole]         = useState<'client'|'master_smz'>('client');
  const [loading, setLoading]   = useState(false);
  const setUser = useAuthStore.setState;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Ошибка', 'Пароль минимум 8 символов');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
      await SecureStore.setItemAsync('auth_token', data.token);
      setUser({ user: data.user, token: data.token, loading: false });
    } catch (e: any) {
      const errors = e.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (e.response?.data?.message ?? 'Ошибка регистрации');
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.root} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Регистрация</Text>

        <Text style={s.label}>Я регистрируюсь как:</Text>
        <View style={s.roleRow}>
          {(['client', 'master_smz'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.roleBtn, role === r && s.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[s.roleTxt, role === r && s.roleTxtActive]}>
                {r === 'client' ? '👤 Клиент' : '🔧 Мастер'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} placeholder="Имя" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder="Пароль (мин. 8 символов)" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={s.input} placeholder="Повторите пароль" placeholderTextColor={colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Создать аккаунт</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Уже есть аккаунт? <Text style={{ color: colors.emerald }}>Войти</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { padding: 24, gap: 12, paddingTop: 60 },
  title:         { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  label:         { color: colors.textSecondary, fontSize: 13 },
  roleRow:       { flexDirection: 'row', gap: 10 },
  roleBtn:       { flex:1, paddingVertical:12, borderRadius:12, borderWidth:1, borderColor: colors.border, backgroundColor: colors.surface, alignItems:'center' },
  roleBtnActive: { borderColor: colors.emerald, backgroundColor: '#064e3b' },
  roleTxt:       { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  roleTxtActive: { color: colors.emerald },
  input:         { backgroundColor: colors.surface, borderWidth:1, borderColor: colors.border, borderRadius:14, paddingHorizontal:16, paddingVertical:14, color: colors.textPrimary, fontSize:15 },
  btn:           { backgroundColor: colors.emerald, borderRadius:14, paddingVertical:15, alignItems:'center', marginTop:4 },
  btnText:       { color:'#fff', fontWeight:'700', fontSize:16 },
  link:          { textAlign:'center', color: colors.textSecondary, marginTop:8, fontSize:14 },
});
