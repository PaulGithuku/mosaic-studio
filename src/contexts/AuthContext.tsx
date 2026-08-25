import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  User,
  Profile,
  LoginCredentials,
  RegisterCredentials,
  AuthContextType,
} from '../types/auth';
import { authService } from '../services/authService';
import { getStoredToken, setStoredToken, removeStoredToken } from '../services/api';
import { supabase, isClientSupabaseConfigured } from '../lib/supabase';
import { useToast } from './ToastContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getCurrentUser();
      setCurrentUser(data.user);
      setProfile(data.profile);
      setToken(storedToken);
    } catch {
      // Invalidate on auth failure
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
      setToken(null);
      removeStoredToken();
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to Supabase Auth State changes if configured
  useEffect(() => {
    if (!isClientSupabaseConfigured()) {
      refreshUser();
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.access_token) {
        setStoredToken(initialSession.access_token);
        setToken(initialSession.access_token);
      }
      refreshUser();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.access_token) {
        setStoredToken(newSession.access_token);
        setToken(newSession.access_token);
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        removeStoredToken();
        setCurrentUser(null);
        setProfile(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const signIn = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      const data = await authService.login(credentials);
      setCurrentUser(data.user);
      setProfile(data.profile);
      setToken(data.token);
      showSuccessToast('Welcome back', `Signed in as ${data.user.name}`);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      showErrorToast('Authentication Failed', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setLoading(true);
      const data = await authService.register(credentials);
      setCurrentUser(data.user);
      setProfile(data.profile);
      setToken(data.token);
      showSuccessToast('Account Created', 'Welcome to Mosaic Studio. Your photography space is ready.');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed.';
      showErrorToast('Registration Error', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
      setToken(null);
      showSuccessToast('Signed out', 'You have been successfully signed out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        profile,
        photographer: profile,
        session,
        token,
        isAuthenticated: !!currentUser && !!token,
        loading,
        signIn,
        signUp,
        signOut,
        login: signIn,
        register: signUp,
        logout: signOut,
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
