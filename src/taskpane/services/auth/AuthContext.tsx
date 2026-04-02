import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { trySSOAuth } from './ssoAuth';
import { openAuthDialog } from './dialogAuth';
import type { AuthState, AuthContextType, AuthUser } from '../../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Decode the payload of a JWT (no validation — that happens on the backend). */
function parseUserFromToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
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

  const acquireToken = useCallback(async (): Promise<string> => {
    // SSO first, dialog fallback
    let token = await trySSOAuth();
    if (!token) {
      token = await openAuthDialog();
    }
    return token;
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = await acquireToken();
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
  }, [acquireToken]);

  const logout = useCallback(() => {
    tokenRef.current = null;
    setState({ isAuthenticated: false, user: null, token: null, isLoading: false, error: null });
  }, []);

  /** Returns a valid token, silently refreshing via SSO if possible. */
  const getToken = useCallback(async (): Promise<string> => {
    // Try to refresh silently via SSO first
    const token = await trySSOAuth();
    if (token) {
      tokenRef.current = token;
      return token;
    }
    // If SSO refresh failed and we still have a token, return it
    if (tokenRef.current) {
      return tokenRef.current;
    }
    // Last resort: interactive dialog
    const dialogToken = await openAuthDialog();
    tokenRef.current = dialogToken;
    return dialogToken;
  }, []);

  // Auto-login on mount
  useEffect(() => {
    login();
  }, [login]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
