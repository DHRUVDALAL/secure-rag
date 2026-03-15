'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AuthState, User, Company, getStoredAuth, setStoredAuth, clearStoredAuth } from '@/lib/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    company: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    setAuthState(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, company, accessToken, refreshToken } = response.data;
    setStoredAuth(user, company, accessToken, refreshToken);
    setAuthState({ user, company, isAuthenticated: true });
    return response.data;
  }, []);

  const register = useCallback(
    async (data: { companyName: string; email: string; password: string; firstName: string; lastName: string }) => {
      const response = await api.post('/auth/register', data);
      const { user, company, accessToken, refreshToken } = response.data;
      setStoredAuth(user, company, accessToken, refreshToken);
      setAuthState({ user, company, isAuthenticated: true });
      return response.data;
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuthState({ user: null, company: null, isAuthenticated: false });
    window.location.href = '/login';
  }, []);

  return { ...authState, loading, login, register, logout };
}
