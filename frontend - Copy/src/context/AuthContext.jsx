import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Normalize the user object from either backend format
  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    return {
      ...rawUser,
      // Ensure consistent role naming: treat 'provider' as 'organization' internally
      // but keep 'organization' as-is from the new backend
    };
  };

  // Extract token and user from either response format:
  // New backend: { success, token, user }
  // Old backend: { token, user } or just the user object
  const extractFromResponse = (data) => {
    if (data?.token && data?.user) {
      return { token: data.token, user: data.user };
    }
    if (data?.token) {
      return { token: data.token, user: data };
    }
    return { token: null, user: data };
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: rawUser } = extractFromResponse(data);
    const userData = normalizeUser(rawUser);
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    // Map 'provider' role to 'organization' for the new backend
    const normalizedPayload = {
      ...payload,
      role: payload.role === 'provider' ? 'organization' : payload.role,
      // Map orgName to companyName for new backend
      companyName: payload.orgName || payload.companyName || undefined,
    };
    const { data } = await api.post('/auth/register', normalizedPayload);
    const { token, user: rawUser } = extractFromResponse(data);
    const userData = normalizeUser(rawUser);
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      // New backend returns { success, user }
      const rawUser  = data?.user || data;
      const userData = normalizeUser(rawUser);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch {
      return null;
    }
  };

  const updateUser = (updates) => {
    const updated = normalizeUser({ ...user, ...updates });
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
