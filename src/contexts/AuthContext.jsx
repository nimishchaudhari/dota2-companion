import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service.js';

// Authentication Context
export const AuthContext = createContext(null);

// Authentication Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState(
    import.meta.env.VITE_AUTH_MODE || 'development'
  );

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedAuth = localStorage.getItem('dota2_auth');
        
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          const now = new Date().getTime();
          
          if (authData.expiresAt && now < authData.expiresAt) {
            setUser(authData.user);
            setAuthMode(authData.authMode || 'development');
          } else {
            // Session expired, clear storage
            localStorage.removeItem('dota2_auth');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('dota2_auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login with Player ID (Development Mode)
  const loginWithPlayerId = async (playerId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await authService.loginWithPlayerId(playerId);
      
      // Save to localStorage
      const authData = {
        user: userData,
        token: generateSessionToken(),
        authMode: 'development',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        lastDataSync: Date.now()
      };
      
      localStorage.setItem('dota2_auth', JSON.stringify(authData));
      setUser(userData);
      setAuthMode('development');
      
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Steam OpenID Login (Production Mode)
  const loginWithSteam = async () => {
    try {
      await authService.initiateSteamLogin();
    } catch (error) {
      setError('Failed to initiate Steam login');
      throw error;
    }
  };

  // Handle Steam callback
  const handleSteamCallback = useCallback(async (urlParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Processing Steam callback...');
      const userData = await authService.handleSteamCallback(urlParams);
      console.log('Steam callback successful, userData:', userData);
      
      // Save to localStorage
      const authData = {
        user: userData,
        token: generateSessionToken(),
        authMode: 'steam',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        lastDataSync: Date.now()
      };
      
      localStorage.setItem('dota2_auth', JSON.stringify(authData));
      setUser(userData);
      setAuthMode('steam');
      
      console.log('Authentication state updated successfully');
      return userData;
    } catch (error) {
      console.error('Steam callback error:', error);
      setError(error.message);
      throw error;
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props/state

  // Refresh user data
  const refreshUserData = async () => {
    if (!user?.accountId) return;
    
    setIsLoading(true);
    try {
      const updatedData = await authService.refreshUserData(user.accountId, user.authMode);
      
      // Update localStorage
      const savedAuth = JSON.parse(localStorage.getItem('dota2_auth') || '{}');
      savedAuth.user = updatedData;
      savedAuth.lastDataSync = Date.now();
      localStorage.setItem('dota2_auth', JSON.stringify(savedAuth));
      
      setUser(updatedData);
      return updatedData;
    } catch (error) {
      setError('Failed to refresh user data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle auth mode
  const toggleAuthMode = () => {
    const newMode = authMode === 'development' ? 'steam' : 'development';
    setAuthMode(newMode);
  };
  
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('dota2_auth');
    authService.clearCache();
  };
  
  const clearError = () => setError(null);

  // Generate session token
  const generateSessionToken = () => {
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      authMode,
      loginWithPlayerId,
      loginWithSteam,
      handleSteamCallback,
      refreshUserData,
      toggleAuthMode,
      logout,
      clearError,
      isAuthenticated: !!user,
      // Helper functions
      getFamousPlayers: () => authService.getFamousPlayers(),
      isDevMode: authMode === 'development'
    }}>
      {children}
    </AuthContext.Provider>
  );
};