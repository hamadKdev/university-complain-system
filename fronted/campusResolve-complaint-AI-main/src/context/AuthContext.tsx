import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService, LoginPayload, SignupPayload } from '../services/authService';
import { tokenStorage, setUnauthorizedListener } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    const existingToken = tokenStorage.get();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const profile = await authService.getMe();
      if (!profile || !profile.role) {
        throw new Error('User profile or role not found in database.');
      }
      setUser(profile);
      setToken(existingToken);
      return profile;
    } catch (err) {
      console.warn('Invalid or expired authentication session', err);
      tokenStorage.remove();
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedListener(() => {
      setToken(null);
      setUser(null);
    });

    fetchUserProfile();

    return () => {
      setUnauthorizedListener(null);
    };
  }, [fetchUserProfile]);

  const login = async (payload: LoginPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authService.login(payload);
      if (!res.access_token) {
        throw new Error('Authentication succeeded but no access token was returned.');
      }
      setToken(res.access_token);

      // Immediately fetch real profile with database-assigned role
      const profile = await authService.getMe();
      if (!profile || !profile.role) {
        throw new Error('Unable to retrieve authenticated role from database.');
      }
      setUser(profile);
      return profile;
    } catch (err) {
      tokenStorage.remove();
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.signup(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    tokenStorage.remove();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (): Promise<UserProfile | null> => {
    return fetchUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
