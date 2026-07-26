import { api } from './client';

export interface FleaItem {
  id:          number;
  title:       string;
  description: string | null;
  price:       number;
  condition:   'new' | 'good' | 'fair';
  photos:      { id: number; url: string }[];
  category?:   { id: number; name: string } | null;
  city?:       { id: number; name: string } | null;
  seller:      { id: number; name: string; avatar?: string | null };
  status:      'active' | 'sold' | 'hidden';
  created_at:  string;
}

export interface FleaListResponse {
  data:         FleaItem[];
  current_page: number;
  last_page:    number;
  total:        number;
}

const CONDITION_LABELS: Record<string, string> = {
  new:  'Новое',
  good: 'Хорошее',
  fair: 'Б/у',
};

export const conditionLabel = (c: string) => CONDITION_LABELS[c] ?? c;

export const fleaApi = {
  list: (params?: {
    search?: string;
    category_id?: number;
    city_id?: number;
    condition?: string;
    page?: number;
  }) => api.get<FleaListResponse>('/flea/items', { params }),

  show: (id: number) => api.get<{ data: FleaItem }>(`/flea/items/${id}`),

  create: (data: {
    title:       string;
    description?: string;
    price:       number;
    condition:   string;
    category_id?: number;
    city_id?:    number;
    photos?:     { uri: string; type?: string; name?: string }[];
  }) => {
    const form = new FormData();
    form.append('title', data.title);
    if (data.description) form.append('description', data.description);
    form.append('price', String(data.price));
    form.append('condition', data.condition);
    if (data.category_id) form.append('category_id', String(data.category_id));
    if (data.city_id)     form.append('city_id', String(data.city_id));
    data.photos?.forEach((p, i) => {
      form.append(`photos[${i}]`, { uri: p.uri, type: p.type ?? 'image/jpeg', name: p.name ?? `photo_${i}.jpg` } as any);
    });
    return api.post<{ data: FleaItem }>('/flea/items', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  myItems: () => api.get<FleaListResponse>('/flea/items', { params: { my: 1 } }),

  myListings: (page = 1) => api.get<FleaListResponse>('/flea/my-listings', { params: { page } }),

  update: (id: number, data: {
    title?:       string;
    description?: string;
    price?:       number;
    condition?:   string;
    category_id?: number;
    city_id?:     number;
    photos?:      { uri: string; type?: string; name?: string }[];
  }) => {
    const form = new FormData();
    if (data.title)       form.append('title', data.title);
    if (data.description !== undefined) form.append('description', data.description ?? '');
    if (data.price !== undefined) form.append('price', String(data.price));
    if (data.condition)   form.append('condition', data.condition);
    if (data.category_id) form.append('category_id', String(data.category_id));
    if (data.city_id)     form.append('city_id', String(data.city_id));
    data.photos?.forEach((p, i) => {
      form.append(`photos[${i}]`, { uri: p.uri, type: p.type ?? 'image/jpeg', name: p.name ?? `photo_${i}.jpg` } as any);
    });
    return api.patch<{ data: FleaItem }>(`/flea/items/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  close: (id: number) => api.patch(`/flea/items/${id}/close`, {}),

  delete: (id: number) => api.delete(`/flea/items/${id}`),

  buyRequest: (id: number, buyer_message?: string) =>
    api.post<{ data: FleaDeal }>(`/flea/items/${id}/buy`, { buyer_message }),

  deals: (page = 1) => api.get<{ data: FleaDeal[]; meta: any }>('/flea/deals', { params: { page } }),

  confirmDeal: (id: number) => api.patch<{ data: FleaDeal }>(`/flea/deals/${id}/confirm`, {}),

  cancelDeal: (id: number, reason?: string) =>
    api.patch<{ data: FleaDeal }>(`/flea/deals/${id}/cancel`, { reason }),
};

export interface FleaDeal {
  id:                  number;
  listing_id:          number;
  listing_title:       string | null;
  listing_photo:       string | null;
  amount:              number;
  buyer_message:       string | null;
  status:              'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed';
  status_label:        string;
  buyer_confirmed_at:  string | null;
  seller_confirmed_at: string | null;
  cancelled_at:        string | null;
  cancel_reason:       string | null;
  seller:              { id: number; name: string } | null;
  created_at:          string;
}
