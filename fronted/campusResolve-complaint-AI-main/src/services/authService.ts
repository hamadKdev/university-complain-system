import { apiClient, tokenStorage } from './apiClient';
import { UserProfile, UserRole } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: any;
}

export interface SignupResponse {
  message: string;
  user_id?: string;
  access_token?: string;
  token_type?: string;
}

export function parseUserRole(rawRole: unknown): UserRole | null {
  if (typeof rawRole !== 'string') return null;
  const cleaned = rawRole.trim().toLowerCase();
  if (cleaned === 'admin' || cleaned === 'administrator') return 'admin';
  if (cleaned === 'staff' || cleaned === 'technician' || cleaned === 'faculty') return 'staff';
  if (cleaned === 'student') return 'student';
  return null;
}

export function normalizeUserProfile(raw: any): UserProfile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid user profile response received from backend.');
  }

  // Handle various FastAPI / Supabase response envelopes: { user: {...} }, { profile: {...} }, { data: {...} }, or flat
  const data = raw.user && typeof raw.user === 'object'
    ? raw.user
    : raw.profile && typeof raw.profile === 'object'
    ? raw.profile
    : raw.data && typeof raw.data === 'object'
    ? raw.data.user || raw.data
    : raw;

  const id = data.id || data.user_id || data.sub || '';
  const email = data.email || data.user_email || '';
  const full_name =
    data.full_name ||
    data.name ||
    data.user_metadata?.full_name ||
    data.user_metadata?.name ||
    (email ? email.split('@')[0] : 'University User');

  // Check role strictly from database/backend record
  let candidateRole =
    data.role ||
    data.user_metadata?.role ||
    data.app_metadata?.role ||
    data.user_role;

  // Supabase Auth default session role is often "authenticated" if not merged with DB profile
  if (candidateRole === 'authenticated') {
    candidateRole = data.user_metadata?.role || data.app_metadata?.role || null;
  }

  const role = parseUserRole(candidateRole);
  if (!role) {
    throw new Error(
      candidateRole
        ? `Unrecognized role "${candidateRole}" assigned to this account in the database.`
        : 'User account has no role assigned in the university database.'
    );
  }

  return {
    id: String(id),
    email: String(email),
    full_name: String(full_name),
    role,
    department_id: data.department_id ? String(data.department_id) : null,
    department_name: data.department_name ? String(data.department_name) : null,
    created_at: data.created_at,
    avatar_url: data.avatar_url || data.user_metadata?.avatar_url,
  };
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const data = await apiClient.post<AuthResponse>('/auth/login', payload, false);
    if (data.access_token) {
      tokenStorage.set(data.access_token);
    }
    return data;
  },

  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    const data = await apiClient.post<SignupResponse>('/auth/signup', payload, false);
    if (data.access_token) {
      tokenStorage.set(data.access_token);
    }
    return data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get<any>('/auth/me', true);
    return normalizeUserProfile(res);
  },

  logout: (): void => {
    tokenStorage.remove();
  },
};

