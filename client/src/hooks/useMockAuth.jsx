import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredToken } from '../services/api';

const AUTH_STORAGE_KEY = 'ai_resume_analyzer_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to parse stored user:', err);
    }
    return null;
  });

  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  // Attempt to synchronize active session with backend if token exists
  useEffect(() => {
    let isMounted = true;
    async function syncBackendSession() {
      const token = getStoredToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const backendUser = await authApi.getMe();
        if (backendUser && isMounted) {
          const synced = {
            id: backendUser._id || backendUser.id,
            name: backendUser.name,
            email: backendUser.email,
            role: backendUser.role,
            isAuthenticated: true,
            isBackendAuthenticated: true,
          };
          setUser(synced);
        }
      } catch (err) {
        if (isMounted) {
          // Token is expired or rejected: clear invalid credentials
          console.warn('Session verification failed, resetting auth state:', err.message);
          setUser(null);
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncBackendSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to persist user state:', err);
    }
  }, [user]);

  /**
   * Login: attempts real backend authentication first, falls back to local demo if offline
   */
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      const backendUser = result.user;
      const newUser = {
        id: backendUser._id || backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role,
        isAuthenticated: true,
        isBackendAuthenticated: true,
      };
      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    } catch (apiErr) {
      // If error was an explicit auth rejection (401), rethrow to display form error
      if (apiErr.status === 401 || apiErr.status === 400) {
        setLoading(false);
        throw apiErr;
      }

      console.warn('Backend authentication unreachable; engaging demo fallback session:', apiErr.message);

      // Offline / demo fallback
      const nameFromEmail = email.split('@')[0]
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'User';

      const newUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: nameFromEmail,
        email: email.trim().toLowerCase(),
        title: 'Candidate',
        avatarUrl: null,
        isAuthenticated: true,
        isBackendAuthenticated: false,
      };

      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    }
  };

  /**
   * Signup: attempts real backend registration first, falls back to demo if offline
   */
  const signup = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const result = await authApi.register({ name, email, password });
      const backendUser = result.user;
      const newUser = {
        id: backendUser._id || backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role,
        isAuthenticated: true,
        isBackendAuthenticated: true,
      };
      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    } catch (apiErr) {
      if (apiErr.status === 409 || apiErr.status === 400) {
        setLoading(false);
        throw apiErr;
      }

      console.warn('Backend registration unreachable; engaging demo fallback session:', apiErr.message);

      const newUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: name.trim() || 'User',
        email: email.trim().toLowerCase(),
        title: 'Candidate',
        avatarUrl: null,
        isAuthenticated: true,
        isBackendAuthenticated: false,
      };

      setUser(newUser);
      setLoading(false);
      return { success: true, user: newUser };
    }
  };

  /**
   * Logout: clears backend cookie and local storage
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network errors on logout
    }
    setUser(null);
  };

  /**
   * Profile update
   */
  const updateProfile = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user?.isAuthenticated,
        isBackendAuthenticated: !!user?.isBackendAuthenticated,
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within an AuthProvider');
  }
  return context;
}
