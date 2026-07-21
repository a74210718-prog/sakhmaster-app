import { api } from './client';

export const orderStatusApi = {
  update: (orderId: number, status: string) =>
    api.patch<{ data: { status: string } }>(`/orders/${orderId}/status`, { status }),
};
