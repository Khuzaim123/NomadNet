// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import {
  login as authLogin,
  logout as authLogout,
  getToken,
  getUser,
  storeAuth,
  clearAuth,
  getCurrentUser
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // current user object
  const [loading, setLoading] = useState(true); // true while initializing
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Try stored user first (from localStorage/sessionStorage)
        const storedUser = getUser();
        if (storedUser) {
          setUser(storedUser);
          setLoading(false);
          return;
        }

        // Fallback: hit /api/auth/me
        const res = await getCurrentUser(token);
        const data = res?.data || res;
        const currentUser =
          data?.data?.user || data?.user || data || null;

        if (currentUser) {
          // Persist user along with existing token
          storeAuth(token, currentUser, true); // remember in localStorage
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Init auth error:', err);
        // If token invalid, clear it
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login: email + password (+ optional rememberMe)
  const login = useCallback(
    async (email, password, rememberMe = false) => {
      setError(null);
      setLoading(true);
      try {
        const data = await authLogin(email, password); // your authService.login
        const payload = data?.data || data;

        // Try to extract token & user from login response
        const token =
          payload?.token ||
          payload?.accessToken ||
          payload?.jwt ||
          getToken(); // fallback to token already set by backend/cookies

        const userData =
          payload?.user ||
          payload?.data?.user ||
          getUser() || // fallback to whatever was stored
          null;

        if (token && userData) {
          storeAuth(token, userData, rememberMe);
          setUser(userData);
        } else {
          // If login didn't include user, try to fetch /me
          const currentToken = token || getToken();
          if (currentToken && getCurrentUser) {
            const meRes = await getCurrentUser(currentToken);
            const meData = meRes?.data || meRes;
            const meUser =
              meData?.data?.user || meData?.user || null;
            if (meUser) {
              storeAuth(currentToken, meUser, rememberMe);
              setUser(meUser);
            }
          }
        }

        return userData;
      } catch (err) {
        console.error('Login error (context):', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to login'
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = getToken();
      if (token) {
        await authLogout(token);
      }
    } catch (err) {
      console.error('Logout error (context):', err);
    } finally {
      clearAuth();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    setUser,
    setError
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// Hook for components to use auth state
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};