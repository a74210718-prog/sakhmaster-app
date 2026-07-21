import { api } from './client';

export interface Master {
  id: number;
  name: string;
  username?: string;
  specialization?: string;
  avatar?: string | null;
  city?: { id: number; name: string } | null;
  rating?: number;
  reviews_count?: number;
  is_pro?: boolean;
  role: string;
}

export interface MasterDetail extends Master {
  bio?: string;
  categories?: { id: number; name: string }[];
  phone?: string;
}

export interface MastersResponse {
  data: Master[];
  meta: { current_page: number; last_page: number; total: number };
}

export const mastersApi = {
  list: (params?: Record<string, any>) =>
    api.get<MastersResponse>('/masters', { params }),
  show: (id: number) =>
    api.get<{ data: MasterDetail }>(`/masters/${id}`),
};
