import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from '../../types/auth';

/** Convenience hook – must be used inside <AuthProvider>. */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
