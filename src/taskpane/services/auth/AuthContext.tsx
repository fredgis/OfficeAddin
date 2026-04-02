import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { trySSOAuth } from './ssoAuth';
import { openAuthDialog } from './dialogAuth';
import type { AuthState, AuthContextType, AuthUser } from '../../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Decode the payload of a JWT (no validation — that happens on the backend). */
function parseUserFromToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.oid || payload.sub || '',
      name: payload.name || '',
      email: payload.preferred_username || payload.upn || '',
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // Keep token in a ref so getToken() always sees the latest value
  const tokenRef = useRef<string | null>(null);
  // Lock to prevent concurrent token refresh attempts (avoids multiple dialogs)
  const refreshLockRef = useRef<Promise<string> | null>(null);

  const bootstrapAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = await trySSOAuth();
      if (!token) {
        tokenRef.current = null;
        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const user = parseUserFromToken(token);
      tokenRef.current = token;
      setState({ isAuthenticated: true, user, token, isLoading: false, error: null });
    } catch (error) {
      tokenRef.current = null;
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      let token = await trySSOAuth();
      if (!token) {
        token = await openAuthDialog();
      }
      const user = parseUserFromToken(token);
      tokenRef.current = token;
      setState({ isAuthenticated: true, user, token, isLoading: false, error: null });
    } catch (error) {
      tokenRef.current = null;
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, []);

  const logout = useCallback(() => {
    tokenRef.current = null;
    setState({ isAuthenticated: false, user: null, token: null, isLoading: false, error: null });
  }, []);

  /** Returns a valid token, silently refreshing via SSO if possible. */
  const getToken = useCallback(async (): Promise<string> => {
    // If a refresh is already in progress, wait for it instead of spawning another
    if (refreshLockRef.current) return refreshLockRef.current;

    refreshLockRef.current = (async () => {
      try {
        // Try to refresh silently via SSO first
        const token = await trySSOAuth();
        if (token) {
          tokenRef.current = token;
          const user = parseUserFromToken(token);
          setState(prev => ({ ...prev, token, user, isAuthenticated: true }));
          return token;
        }
        // If SSO refresh failed and we still have a token, return it
        if (tokenRef.current) {
          return tokenRef.current;
        }
        // Last resort: interactive dialog
        const dialogToken = await openAuthDialog();
        tokenRef.current = dialogToken;
        const dialogUser = parseUserFromToken(dialogToken);
        setState(prev => ({ ...prev, token: dialogToken, user: dialogUser, isAuthenticated: true }));
        return dialogToken;
      } finally {
        refreshLockRef.current = null;
      }
    })();

    return refreshLockRef.current;
  }, []);

  // Try silent SSO on mount; only use interactive sign-in from explicit user actions
  useEffect(() => {
    bootstrapAuth();

    const handleAuthExpired = () => {
      tokenRef.current = null;
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: 'Session expired. Click Sign in to continue.',
      }));
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [bootstrapAuth]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
