import { api } from './client';

export const profileApi = {
  update: (data: { name?: string; phone?: string }) =>
            api.patch<{ user: any }>('/auth/profile', data),

  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
                    api.patch<{ ok: boolean }>('/auth/password', data),

  withdraw: (amount: number) =>
              api.post<{ id: number; amount: number; status: string }>('/wallet/withdraw', { amount }),
};
