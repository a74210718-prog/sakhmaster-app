import { api } from './client';

export interface WalletInfo {
  balance: number;
  balance_held: number;
  currency: string;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  comment?: string;
  created_at: string;
}

export interface TransactionsResponse {
  data: WalletTransaction[];
  meta: { current_page: number; last_page: number };
}

export const walletApi = {
  info:         ()           => api.get<WalletInfo>('/wallet'),
  transactions: (page = 1)  => api.get<TransactionsResponse>('/wallet/transactions', { params: { page } }),
  topupInit:    (amount: number) => api.post<{ payment_url: string; order_id: string }>('/wallet/topup', { amount }),
};
