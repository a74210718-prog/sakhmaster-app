import { api } from './client';

export interface MasterStats {
  completed_orders: number;
  in_work_orders:   number;
  rating:           number;
  reviews_count:    number;
  balance:          number;
  earned_total:     number;
  earned_month:     number;
}

export interface PortfolioPhoto {
  id:  number;
  url: string;
}

export interface MasterOwnProfile {
  id:             number;
  name:           string;
  email:          string;
  phone?:         string | null;
  role:           string;
  specialization: string | null;
  bio:            string | null;
  rating:         number;
  reviews_count:  number;
  categories:     { id: number; name: string }[];
  is_pro:         boolean;
  portfolio?:     PortfolioPhoto[];
}

export const masterProfileApi = {
  get:    () => api.get<{ data: MasterOwnProfile }>('/master/profile'),
  update: (data: { specialization?: string; bio?: string; category_ids?: number[] }) =>
            api.patch<{ data: MasterOwnProfile }>('/master/profile', data),
  stats:  () => api.get<MasterStats>('/master/stats'),

  addPhoto: (uri: string, mimeType = 'image/jpeg', fileName = 'photo.jpg') => {
    const form = new FormData();
    form.append('photo', { uri, type: mimeType, name: fileName } as any);
    return api.post<{ data: PortfolioPhoto }>('/master/portfolio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePhoto: (id: number) => api.delete(`/master/portfolio/${id}`),
};
