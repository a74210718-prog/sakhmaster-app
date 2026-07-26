import { api } from './client';

export interface PaymentUrlResponse {
  payment_url: string;
  payment_id:  string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  status:     string;
  amount:     number;
}

// Статусы T-Bank после оплаты
export const PAYMENT_STATUS = {
  CONFIRMED:  'CONFIRMED',   // успешно списано (одностадийный)
  AUTHORIZED: 'AUTHORIZED',  // заморожено (двухстадийный, до Confirm)
  AUTH_FAIL:  'AUTH_FAIL',   // ошибка авторизации
  REJECTED:   'REJECTED',    // отклонён после 3 попыток
  CANCELED:   'CANCELED',    // отменён
} as const;

export const paymentsApi = {
  getOrderPaymentUrl: (orderId: number) =>
    api.post<PaymentUrlResponse>(`/orders/${orderId}/payment-url`),

  checkStatus: (paymentId: string) =>
    api.get<PaymentStatusResponse>(`/payments/${paymentId}/status`),
};
