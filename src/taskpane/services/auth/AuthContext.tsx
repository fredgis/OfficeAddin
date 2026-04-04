import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { openAuthDialog } from './dialogAuth';
import { parseJwtPayload } from './tokenUtils';
import type { AuthState, AuthContextType, AuthUser } from '../../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
type AuthMethod = 'sso' | 'popup' | null;

function parseTokenPayload(token: string): Record<string, unknown> | null {
  return parseJwtPayload(token);
}

/** Decode the payload of a JWT (no validation — that happens on the backend). */
function parseUserFromToken(token: string): AuthUser | null {
  const payload = parseTokenPayload(token);
  if (!payload) {
    return null;
  }

  return {
    id: String(payload.oid || payload.sub || ''),
    name: String(payload.name || ''),
    email: String(payload.preferred_username || payload.upn || ''),
  };
}

function isTokenFresh(token: string, skewSeconds: number = 60): boolean {
  const payload = parseTokenPayload(token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  if (!exp) {
    return false;
  }

  return exp * 1000 > Date.now() + skewSeconds * 1000;
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
  const authMethodRef = useRef<AuthMethod>(null);
  // Lock to prevent concurrent token refresh attempts (avoids multiple dialogs)
  const refreshLockRef = useRef<Promise<string> | null>(null);

  const applyAuthenticatedState = useCallback((token: string, method: AuthMethod) => {
    const user = parseUserFromToken(token);
    tokenRef.current = token;
    authMethodRef.current = method;
    setState({ isAuthenticated: true, user, token, isLoading: false, error: null });
  }, []);

  const bootstrapAuth = useCallback(async () => {
    tokenRef.current = null;
    authMethodRef.current = null;
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = await openAuthDialog();
      applyAuthenticatedState(token, 'popup');
    } catch (error) {
      tokenRef.current = null;
      authMethodRef.current = null;
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, [applyAuthenticatedState]);

  const logout = useCallback(() => {
    tokenRef.current = null;
    authMethodRef.current = null;
    setState({ isAuthenticated: false, user: null, token: null, isLoading: false, error: null });
  }, []);

  /** Returns a valid token, silently refreshing via SSO if possible. */
  const getToken = useCallback(async (): Promise<string> => {
    // If a refresh is already in progress, wait for it instead of spawning another
    if (refreshLockRef.current) return refreshLockRef.current;
    if (tokenRef.current && isTokenFresh(tokenRef.current)) {
      return tokenRef.current;
    }

    refreshLockRef.current = (async () => {
      try {
        if (authMethodRef.current === 'popup') {
          const dialogToken = await openAuthDialog();
          applyAuthenticatedState(dialogToken, 'popup');
          return dialogToken;
        }

        const dialogToken = await openAuthDialog();
        applyAuthenticatedState(dialogToken, 'popup');
        return dialogToken;
      } finally {
        refreshLockRef.current = null;
      }
    })();

    return refreshLockRef.current;
  }, [applyAuthenticatedState]);

  // Try silent SSO on mount; only use interactive sign-in from explicit user actions
  useEffect(() => {
    bootstrapAuth();

    const handleAuthExpired = (event: Event) => {
      const detail =
        event instanceof CustomEvent && typeof event.detail === 'string' && event.detail
          ? event.detail
          : 'Session expired. Click Sign in to continue.';
      tokenRef.current = null;
      authMethodRef.current = null;
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: detail,
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
