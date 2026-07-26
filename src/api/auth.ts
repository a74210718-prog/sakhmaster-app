import { api } from './client';

export interface LoginPayload    { email: string; password: string }
export interface RegisterPayload { name: string; email: string; password: string; role: 'client' | 'master_smz' | 'ip_pro' }

export interface User {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  city_id?: number | null;
}

export const authApi = {
  login:    (data: LoginPayload)    => api.post<{ token: string; user: User }>('/auth/login', data),
  register: (data: RegisterPayload) => api.post<{ token: string; user: User }>('/auth/register', data),
  me:       ()                      => api.get<{ user: User }>('/auth/me'),
  logout:   ()                      => api.post('/auth/logout'),
};
