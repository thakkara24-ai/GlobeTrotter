import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cachedUser = localStorage.getItem('globetrotter_user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('globetrotter_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('globetrotter_token');
    localStorage.removeItem('globetrotter_user');
    showToast('info', 'You have been logged out.');
  }, [showToast]);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('globetrotter_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      localStorage.setItem('globetrotter_user', JSON.stringify(currentUser));
    } catch (err) {
      console.warn('Session check failed', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('globetrotter_token', data.token);
      localStorage.setItem('globetrotter_user', JSON.stringify(data.user));
      showToast('success', `Welcome back, ${data.user.name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    try {
      const data = await authService.register({ name, email, password, confirmPassword });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('globetrotter_token', data.token);
      localStorage.setItem('globetrotter_user', JSON.stringify(data.user));
      showToast('success', `Account created successfully! Welcome to GlobeTrotter, ${data.user.name}.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showToast('error', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('globetrotter_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
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
