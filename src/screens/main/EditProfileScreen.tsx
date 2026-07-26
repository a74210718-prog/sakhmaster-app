import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { profileApi } from '../../api/profile';
import { useAuthStore } from '../../store/authStore';

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  const [name,    setName]    = useState(user?.name    ?? '');
  const [phone,   setPhone]   = useState(user?.phone   ?? '');
  const [loading, setLoading]         = useState(false);
  const [avatarUri, setAvatarUri]     = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Смена пароля
  const [curPwd,     setCurPwd]     = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [newPwdConf, setNewPwdConf] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarLoading(true);
      try {
        const res = await profileApi.uploadAvatar(uri);
        setUser(res.data.user);
        setAvatarUri(uri);
        Alert.alert('Готово', 'Фото обновлено');
      } catch {
        Alert.alert('Ошибка', 'Не удалось загрузить фото');
      }
      setAvatarLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    setLoading(true);
    try {
      const res = await profileApi.update({ name: name.trim(), phone: phone.trim() || undefined });
      setUser(res.data.user);
      Alert.alert('Сохранено', 'Профиль обновлён');
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось сохранить');
    }
    setLoading(false);
  };

  const savePassword = async () => {
    if (!curPwd || !newPwd || !newPwdConf) { Alert.alert('Ошибка', 'Заполните все поля'); return; }
    if (newPwd !== newPwdConf) { Alert.alert('Ошибка', 'Новые пароли не совпадают'); return; }
    if (newPwd.length < 8) { Alert.alert('Ошибка', 'Минимум 8 символов'); return; }
    setPwdLoading(true);
    try {
      await profileApi.changePassword({ current_password: curPwd, new_password: newPwd, new_password_confirmation: newPwdConf });
      Alert.alert('Готово', 'Пароль изменён');
      setCurPwd(''); setNewPwd(''); setNewPwdConf('');
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.message ?? 'Не удалось изменить пароль');
    }
    setPwdLoading(false);
  };

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
          <Text style={s.title}>Редактировать профиль</Text>
        </View>

        {/* Аватар */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} disabled={avatarLoading} style={s.avatarWrap}>
            {avatarLoading ? (
              <ActivityIndicator color={colors.emerald} size="large" />
            ) : (avatarUri ?? user?.avatar) ? (
              <Image source={{ uri: avatarUri ?? user!.avatar! }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarLetter}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={s.avatarOverlay}>
              <Text style={s.avatarOverlayText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.avatarHint}>Нажмите для смены фото</Text>
        </View>

        {/* Основные данные */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Личные данные</Text>

          <Text style={s.label}>Имя</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ваше имя" placeholderTextColor={colors.textMuted} />

          <Text style={s.label}>Телефон</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+7 (000) 000-00-00" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />

          <Text style={s.label}>Email</Text>
          <View style={s.readonlyField}>
            <Text style={s.readonlyText}>{user?.email}</Text>
          </View>
          <Text style={s.hint}>Email изменить нельзя</Text>

          <TouchableOpacity style={s.btn} onPress={saveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Сохранить</Text>}
          </TouchableOpacity>
        </View>

        {/* Смена пароля */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Смена пароля</Text>

          <Text style={s.label}>Текущий пароль</Text>
          <TextInput style={s.input} value={curPwd} onChangeText={setCurPwd} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.textMuted} />

          <Text style={s.label}>Новый пароль</Text>
          <TextInput style={s.input} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="Минимум 8 символов" placeholderTextColor={colors.textMuted} />

          <Text style={s.label}>Повторите новый пароль</Text>
          <TextInput style={s.input} value={newPwdConf} onChangeText={setNewPwdConf} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.textMuted} />

          <TouchableOpacity style={[s.btn, { backgroundColor: colors.amber }]} onPress={savePassword} disabled={pwdLoading}>
            {pwdLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Изменить пароль</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrap:    { position: 'relative', width: 90, height: 90 },
  avatarImg:     { width: 90, height: 90, borderRadius: 28, borderWidth: 2, borderColor: colors.emerald + '60' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 28, backgroundColor: colors.emeraldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.emerald + '60' },
  avatarLetter:  { fontSize: 40, fontWeight: '700', color: colors.emerald },
  avatarOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.emerald, borderRadius: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  avatarOverlayText: { fontSize: 14 },
  avatarHint:    { marginTop: 8, fontSize: 12, color: colors.textMuted },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  back:          { width: 40, alignItems: 'center' },
  title:         { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  section:       { margin: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 2 },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  label:         { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input:         { backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  readonlyField: { backgroundColor: colors.surface2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: colors.border },
  readonlyText:  { color: colors.textMuted, fontSize: 15, flexShrink: 1 },
  hint:          { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  btn:           { marginTop: 20, backgroundColor: colors.emerald, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:       { color: '#fff', fontWeight: '800', fontSize: 15 },
});
