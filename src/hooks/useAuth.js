import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.js';

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('[useAuth] Context value:', context);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};