import api from './api';
import { SupplierAnalytics, BuyerAnalytics, SustainabilityMetricsData } from '../types';

export const analyticsService = {
  getSupplierAnalytics: async (): Promise<SupplierAnalytics> => {
    const res = await api.get('/analytics/supplier');
    return res.data.analytics;
  },

  getBuyerAnalytics: async (): Promise<BuyerAnalytics> => {
    const res = await api.get('/analytics/buyer');
    return res.data.analytics;
  },

  getSustainabilityMetrics: async (): Promise<SustainabilityMetricsData> => {
    const res = await api.get('/analytics/sustainability');
    return res.data.metrics;
  },
};

