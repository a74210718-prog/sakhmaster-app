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
}

export const masterProfileApi = {
  get:    () => api.get<{ data: MasterOwnProfile }>('/master/profile'),
  update: (data: { specialization?: string; bio?: string; category_ids?: number[] }) =>
            api.patch<{ data: MasterOwnProfile }>('/master/profile', data),
  stats:  () => api.get<MasterStats>('/master/stats'),
};
