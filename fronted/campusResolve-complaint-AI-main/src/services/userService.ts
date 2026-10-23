import { apiClient } from './apiClient';
import { UserProfile, UserRole } from '../types';

export interface SetUserRolePayload {
  role: UserRole;
  department_id?: string | null;
}

export const userService = {
  getUsers: async (): Promise<UserProfile[]> => {
    const res = await apiClient.get<UserProfile[] | { users: UserProfile[] }>('/users');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).users)) return (res as any).users;
    return [];
  },

  setUserRole: async (uid: string, payload: SetUserRolePayload): Promise<any> => {
    return apiClient.patch(`/users/${encodeURIComponent(uid)}/role`, payload);
  },
};
