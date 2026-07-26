import { api } from './client';

export const profileApi = {
  update: (data: { name?: string; phone?: string }) =>
            api.patch<{ user: any }>('/auth/profile', data),

  uploadAvatar: (uri: string) => {
    const form = new FormData();
    form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
    return api.patch<{ user: any }>('/auth/profile', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
                    api.patch<{ ok: boolean }>('/auth/password', data),

  withdraw: (amount: number) =>
              api.post<{ id: number; amount: number; status: string }>('/wallet/withdraw', { amount }),
};
