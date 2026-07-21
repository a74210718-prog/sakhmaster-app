import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'http://192.168.10.189:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// Автоматически добавляем токен в каждый запрос
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Если 401 — сбрасываем токен
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);
