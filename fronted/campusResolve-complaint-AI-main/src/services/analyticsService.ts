import { apiClient } from './apiClient';
import { AnalyticsData } from '../types';

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    return apiClient.get<AnalyticsData>('/analytics');
  },
};
