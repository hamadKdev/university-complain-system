import { ApiErrorResponse, ApiValidationError } from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://university-complain-system.vercel.app'
).replace(/\/$/, '');

const TOKEN_KEY = 'campusresolve_access_token';
const LEGACY_KEYS = [
  'campusresolve_role',
  'campusresolve_user',
  'demo_user',
  'demo_role',
  'demo_account',
  'user',
  'role',
  'mock_user',
];

export const tokenStorage = {
  get: (): string | null => {
    try {
      // Purge any legacy dev session keys
      for (const k of LEGACY_KEYS) {
        localStorage.removeItem(k);
      }
      const token = localStorage.getItem(TOKEN_KEY);
      if (
        !token ||
        token.startsWith('demo-') ||
        token.startsWith('mock-') ||
        token === 'undefined' ||
        token === 'null'
      ) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      for (const k of LEGACY_KEYS) {
        localStorage.removeItem(k);
      }
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save access token', e);
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      for (const k of LEGACY_KEYS) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.error('Failed to remove access token', e);
    }
  },
};

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse | null;
  validationErrors?: ApiValidationError[];

  constructor(status: number, message: string, data: ApiErrorResponse | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    if (data && Array.isArray(data.detail)) {
      this.validationErrors = data.detail;
    }
  }
}

export function formatApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.validationErrors && err.validationErrors.length > 0) {
      return err.validationErrors
        .map((ve) => `${ve.loc.slice(-1)[0]}: ${ve.msg}`)
        .join('; ');
    }
    const rawData = err.data as any;
    if (rawData) {
      if (typeof rawData.detail === 'string' && rawData.detail.trim().length > 0) {
        return rawData.detail;
      }
      if (typeof rawData.message === 'string' && rawData.message.trim().length > 0) {
        return rawData.message;
      }
      if (typeof rawData.error === 'string' && rawData.error.trim().length > 0) {
        return rawData.error;
      }
      if (typeof rawData.error_description === 'string' && rawData.error_description.trim().length > 0) {
        return rawData.error_description;
      }
      if (typeof rawData.msg === 'string' && rawData.msg.trim().length > 0) {
        return rawData.msg;
      }
    }
    if (err.message && err.message !== 'ApiError' && !err.message.includes('[object Object]')) {
      return err.message;
    }
    if (err.status === 401) {
      return 'Invalid credentials or session expired. Please sign in again.';
    }
    if (err.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (err.status === 404) {
      return 'Requested resource was not found.';
    }
    if (err.status === 409) {
      return 'Conflict: This action has already been processed or violates a state constraint.';
    }
    if (err.status >= 500) {
      return 'Server error occurred. Please try again shortly.';
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred.';
}

type OnUnauthorizedCallback = () => void;
let unauthorizedListener: OnUnauthorizedCallback | null = null;

export function setUnauthorizedListener(cb: OnUnauthorizedCallback | null) {
  unauthorizedListener = cb;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = tokenStorage.get();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (netErr) {
    throw new ApiError(0, 'Unable to connect to CampusResolve API. Check network connectivity or CORS settings.');
  }

  if (response.status === 401) {
    tokenStorage.remove();
    if (unauthorizedListener) {
      unauthorizedListener();
    }
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // no-op
    }
    const message =
      errorData?.detail && typeof errorData.detail === 'string'
        ? errorData.detail
        : errorData?.message && typeof errorData.message === 'string'
        ? errorData.message
        : errorData?.error_description && typeof errorData.error_description === 'string'
        ? errorData.error_description
        : errorData?.error && typeof errorData.error === 'string'
        ? errorData.error
        : 'Invalid credentials or session expired.';
    throw new ApiError(401, message, errorData);
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const message =
      responseData && typeof responseData.detail === 'string'
        ? responseData.detail
        : responseData && Array.isArray(responseData.detail)
        ? responseData.detail.map((e: any) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(', ')
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, responseData);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'GET', requiresAuth }),
  post: <T>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    }),
  patch: <T>(endpoint: string, body?: any, requiresAuth = true) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      requiresAuth,
    }),
  delete: <T>(endpoint: string, requiresAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', requiresAuth }),
};
