import { api } from './client';

export interface Review {
  id: number;
  order_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  client: { id: number; name: string };
}

export interface ReviewsResponse {
  data: Review[];
  meta: { current_page: number; last_page: number; total: number; avg_rating?: number | null };
}

export const reviewsApi = {
  store:      (data: { order_id: number; rating: number; comment?: string }) =>
                api.post<{ data: Review }>('/reviews', data),

  forMaster:  (masterId: number, page = 1) =>
                api.get<ReviewsResponse>(`/masters/${masterId}/reviews`, { params: { page } }),

  my:         () => api.get<ReviewsResponse>('/reviews/my'),

  checkOrder: (orderId: number) =>
                api.get<{ has_review: boolean; review: Review | null }>(`/reviews/check/${orderId}`),
};
