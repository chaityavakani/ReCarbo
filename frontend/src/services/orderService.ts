import api from './api';
import { Order, OrderStatus } from '../types';

export const orderService = {
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const params = status ? { status } : {};
    const res = await api.get('/orders', { params });
    return res.data.orders;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const res = await api.get(`/orders/${id}`);
    return res.data.order;
  },

  updateStatus: async (
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
    notes?: string
  ): Promise<Order> => {
    const res = await api.patch(`/orders/${id}/status`, {
      status,
      trackingNumber,
      notes,
    });
    return res.data.order;
  },

  createDirectOrder: async (data: {
    listingId: string;
    quantityKg: number;
    deliveryAddress?: string;
    notes?: string;
  }): Promise<Order> => {
    const res = await api.post('/orders', data);
    return res.data.order;
  },
};
