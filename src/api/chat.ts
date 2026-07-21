import { api } from './client';

export interface ChatMessage {
  id: number;
  text: string;
  is_mine: boolean;
  created_at: string;
  sender?: { id: number; name: string } | null;
}

export interface ChatResponse {
  data: ChatMessage[];
  meta: { current_page: number; last_page: number };
}

export const chatApi = {
  list:  (orderId: number, page = 1) =>
    api.get<ChatResponse>(`/orders/${orderId}/messages`, { params: { page } }),
  send:  (orderId: number, text: string) =>
    api.post<{ data: ChatMessage }>(`/orders/${orderId}/messages`, { text }),
};
