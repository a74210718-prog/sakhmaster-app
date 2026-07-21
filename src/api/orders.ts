import { api } from './client';

export interface Order {
  id: number;
  title: string;
  description?: string;
  status: string;
  total_sum: number;
  is_urgent: boolean;
  created_at: string;
  deadline_at?: string;
  category?: { id: number; name: string } | null;
  city?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
  contractor?: { id: number; name: string } | null;
}

export interface OrdersResponse {
  data: Order[];
  meta: { current_page: number; last_page: number; total: number };
}

export const ordersApi = {
  list:   (params?: Record<string, any>) => api.get<OrdersResponse>('/orders', { params }),
  show:   (id: number)                   => api.get<{ data: Order }>(`/orders/${id}`),
  create: (data: any)                    => api.post<{ data: Order }>('/orders', data),
};
