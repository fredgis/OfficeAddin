/** Authenticated user info extracted from the token. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/** Auth state held in React context. */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

/** Full context value exposed by AuthProvider. */
export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  /** Returns a valid access token, refreshing via SSO/dialog if needed. */
  getToken: () => Promise<string>;
}
