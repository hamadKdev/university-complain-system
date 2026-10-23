import { API_BASE_URL } from './apiClient';

export interface HealthStatus {
  online: boolean;
  message?: string;
  latencyMs?: number;
}

export const healthService = {
  checkHealth: async (): Promise<HealthStatus> => {
    const start = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const latencyMs = Math.round(performance.now() - start);
      if (response.ok) {
        const data = await response.json().catch(() => ({ status: 'ok' }));
        return { online: true, message: data.status || 'ok', latencyMs };
      }
      return { online: false, message: `HTTP ${response.status}`, latencyMs };
    } catch {
      return { online: false, message: 'Offline or CORS blocked' };
    }
  },
};
