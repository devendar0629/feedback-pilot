import { apiClient } from './client';
import { DashboardAnalytics } from '../types';

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const res = await apiClient.get<DashboardAnalytics>('/analytics/dashboard');
    return res.data;
  },
};
