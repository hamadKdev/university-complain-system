import { apiClient } from './apiClient';
import { Department } from '../types';

export const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<Department[] | { departments: Department[] }>('/departments');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).departments)) return (res as any).departments;
    return [];
  },
};
