import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Home, Swords, Shield, Users, Trophy, Settings, Menu, X, ChevronRight, 
  TrendingUp, Clock, Target, Activity, Star, Zap, User, Gamepad2,
  ArrowUp, ArrowDown, Minus, Eye, Flame, Coins, Heart, Calendar,
  Filter, RotateCcw, Award, AlertTriangle, Brain, Timer, Crosshair,
  BarChart3, Gauge, Sparkles, MapPin, Users2, MessageSquare, Skull,
  Siren, Crown, Gift, CheckCircle, Circle, Pause, Play, MoreHorizontal,
  Monitor, Laptop, Smartphone, Lock, Mail, EyeOff, LoaderCircle
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import authService from './services/auth.service.js';
import { DataProvider, useData } from './contexts/DataContext.jsx';
import { AuthContext } from './contexts/AuthContext.js';
import {
  transformMatches,
  transformHeroStats,
  transformRatings,
  calculateTodaySession,
  calculateCoreMetrics,
  getRankName,
  getDefaultMetrics,
  getDefaultHeroStats
} from './utils/dataTransforms.js';

// Authentication Provider
const AuthProvider = ({ children }) => {
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
      const userData = await authService.handleSteamCallback(urlParams);
      
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
      
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
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

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Animation variants
const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const STAGGER_CONTAINER = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animated Number Component
const AnimatedNumber = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

// Navigation Component  
const Navigation = ({ currentPage, setCurrentPage, mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout, refreshUserData, isLoading } = useAuth();
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'matches', icon: Swords, label: 'Matches' },
    { id: 'heroes', icon: Shield, label: 'Heroes' },
    { id: 'live', icon: Activity, label: 'Live Game' },
    { id: 'pro', icon: Trophy, label: 'Pro Scene' },
    { id: 'draft', icon: Users, label: 'Draft' }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = async () => {
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-white">Dota 2 Companion</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  currentPage === item.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-300">{user?.personaName || user?.displayName || 'Player'}</span>
                  <span className="text-xs text-gray-500">
                    {user?.authMode === 'development' ? `ID: ${user?.accountId}` : `#${user?.steamId || '12345'}`}
                  </span>
                </div>
              </motion.div>
            </Tooltip.Trigger>
            <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
              View Profile
            </Tooltip.Content>
          </Tooltip.Root>
          
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isLoading}
                className={`p-2 transition-colors ${
                  isLoading 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Tooltip.Content>
          </Tooltip.Root>
          
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
              Settings
            </Tooltip.Content>
          </Tooltip.Root>
          
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </Tooltip.Trigger>
            <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
              Logout
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Dota 2</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-2 overflow-hidden"
            >
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    currentPage === item.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-300'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

// Enhanced Login Page with Dual Authentication Modes
const LoginPage = () => {
  const { 
    loginWithPlayerId, 
    loginWithSteam, 
    isLoading, 
    error, 
    clearError, 
    authMode, 
    toggleAuthMode,
    getFamousPlayers 
  } = useAuth();
  
  const [playerId, setPlayerId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const famousPlayers = getFamousPlayers();

  const handlePlayerIdChange = (e) => {
    const value = e.target.value;
    setPlayerId(value);
    
    // Clear errors when user starts typing
    if (formErrors.playerId) {
      setFormErrors({});
    }
    if (error) {
      clearError();
    }
  };

  const validatePlayerId = () => {
    const errors = {};
    
    if (!playerId.trim()) {
      errors.playerId = 'Player ID is required';
    } else if (!/^\d+$/.test(playerId.trim())) {
      errors.playerId = 'Player ID must be numeric (Account ID)';
    } else if (playerId.trim().length < 6) {
      errors.playerId = 'Player ID must be at least 6 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    
    if (!validatePlayerId()) return;
    
    try {
      await loginWithPlayerId(playerId.trim());
    } catch (error) {
      console.error('Dev login failed:', error.message);
    }
  };

  const handleSteamLogin = async () => {
    try {
      await loginWithSteam();
    } catch (error) {
      console.error('Steam login failed:', error.message);
    }
  };

  const handleQuickSelect = (accountId) => {
    setPlayerId(accountId);
    setFormErrors({});
    if (error) clearError();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden p-4"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
            style={{
              left: `${i * 20}%`,
              top: `${i * 15}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Shield className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Dota 2 Companion
          </h1>
          <p className="text-gray-400 text-lg">Your Ultimate Esports Companion</p>
        </div>

        {/* Auth Mode Toggle */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={toggleAuthMode}
              className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 hover:bg-gray-700/50 transition-all"
            >
              <div className={`w-3 h-3 rounded-full ${authMode === 'development' ? 'bg-green-400' : 'bg-blue-400'}`} />
              <span className="text-sm text-gray-300">
                {authMode === 'development' ? 'Development Mode' : 'Steam Authentication'}
              </span>
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl"
        >
          {/* Global Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2 mb-6"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {authMode === 'development' ? (
            /* Development Mode - Player ID Login */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Development Mode</h3>
                <p className="text-sm text-gray-400">Enter any Dota 2 Account ID to view player data</p>
              </div>

              <form onSubmit={handleDevLogin} className="space-y-6">
                {/* Player ID Field */}
                <div>
                  <label htmlFor="playerId" className="block text-sm font-medium text-gray-300 mb-2">
                    Dota 2 Account ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="playerId"
                      value={playerId}
                      onChange={handlePlayerIdChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                        formErrors.playerId ? 'border-red-500/50' : 'border-gray-600/50'
                      }`}
                      placeholder="e.g., 105248644"
                      disabled={isLoading}
                    />
                  </div>
                  {formErrors.playerId && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 text-sm mt-1"
                    >
                      {formErrors.playerId}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg ${
                    isLoading
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                      <span>Fetching Player Data...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      <span>Fetch Player Data</span>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Famous Players Quick Select */}
              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-3">Quick Select Pro Players:</p>
                <div className="grid grid-cols-1 gap-2">
                  {famousPlayers.map((player, index) => (
                    <motion.button
                      key={player.accountId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => handleQuickSelect(player.accountId)}
                      disabled={isLoading}
                      className="flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 rounded-lg transition-all text-left disabled:opacity-50"
                    >
                      <div>
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-gray-400 text-xs">{player.description}</p>
                      </div>
                      <span className="text-cyan-400 text-sm font-mono">{player.accountId}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Steam Authentication Mode */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Steam Authentication</h3>
                <p className="text-sm text-gray-400">Sign in with your Steam account for full access</p>
              </div>

              <motion.button
                onClick={handleSteamLogin}
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white border border-gray-600'
                }`}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                    <span>Redirecting to Steam...</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-6 h-6" />
                    <span>Sign in with Steam</span>
                  </>
                )}
              </motion.button>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-400 text-sm font-medium mb-1">Steam Integration</p>
                    <p className="text-gray-400 text-xs">
                      We'll access your Steam profile and Dota 2 match history to provide personalized statistics and insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Comprehensive Mock Data
const mockData = {
  // Enhanced Player Profile Data
  profile: {
    name: 'PlayerX_ProGamer',
    rank: 'Immortal',
    rankNumber: 1247,
    mmr: 6250,
    peakMmr: 6890,
    behaviorScore: 9580,
    accountLevel: 127,
    dotaPlusTier: 'Master',
    hoursPlayed: 3420,
    avgSessionLength: 2.3,
    preferredRegion: 'Europe West',
    streakType: 'win',
    streakCount: 7,
    commends: 847,
    reports: 23,
    leaderboardPosition: 1247
  },

  // Session Data
  todaySession: {
    wins: 4,
    losses: 1,
    mmrChange: +75,
    gamesUntilBehaviorUpdate: 12,
    currentStreak: 3,
    suggestBreak: false
  },

  // Enhanced MMR Data
  mmrHistory: [
    { date: 'Apr 20', mmr: 5800, solo: 5800, party: 5600, mode: 'solo' },
    { date: 'Apr 25', mmr: 5950, solo: 5950, party: 5650, mode: 'solo' },
    { date: 'May 1', mmr: 5900, solo: 5900, party: 5700, mode: 'party' },
    { date: 'May 5', mmr: 6100, solo: 6100, party: 5750, mode: 'solo' },
    { date: 'May 10', mmr: 6050, solo: 6050, party: 5800, mode: 'solo' },
    { date: 'May 15', mmr: 6200, solo: 6200, party: 5850, mode: 'solo' },
    { date: 'May 20', mmr: 6250, solo: 6250, party: 5900, mode: 'solo' },
    { date: 'May 25', mmr: 6180, solo: 6180, party: 5920, mode: 'party' },
    { date: 'May 30', mmr: 6250, solo: 6250, party: 5950, mode: 'solo' },
    { date: 'Jun 4', mmr: 6250, solo: 6250, party: 5950, mode: 'solo' },
  ],

  // Performance Metrics
  coreMetrics: [
    { label: 'KDA Ratio', value: 2.84, trend: 'up', suffix: '', icon: Target, color: 'from-green-500 to-emerald-600' },
    { label: 'CS/Min', value: 68.4, trend: 'up', suffix: '', icon: Coins, color: 'from-yellow-500 to-orange-600' },
    { label: 'GPM', value: 612, trend: 'down', suffix: '', icon: TrendingUp, color: 'from-blue-500 to-cyan-600' },
    { label: 'XPM', value: 689, trend: 'up', suffix: '', icon: Star, color: 'from-purple-500 to-pink-600' },
    { label: 'Win Rate', value: 58.3, trend: 'up', suffix: '%', icon: Trophy, color: 'from-green-500 to-emerald-600' },
    { label: 'Hero Damage/Min', value: 824, trend: 'up', suffix: '', icon: Crosshair, color: 'from-red-500 to-orange-600' },
    { label: 'Tower Damage', value: 2847, trend: 'down', suffix: '', icon: Crown, color: 'from-indigo-500 to-purple-600' },
    { label: 'Versatility Score', value: 7.2, trend: 'up', suffix: '/10', icon: Brain, color: 'from-teal-500 to-cyan-600' },
  ],

  // Advanced Metrics
  advancedMetrics: {
    consistency: 8.4,
    comebackRate: 24,
    throwRate: 12,
    lateGameWinRate: 67,
    firstBloodParticipation: 42,
    avgGameDuration: 38.2
  },

  // Enhanced Hero Data with performance details
  detailedHeroes: [
    {
      name: 'Shadow Fiend',
      matches: 75,
      winrate: 62,
      kda: '8.2/3.1/6.4',
      gpm: 687,
      xpm: 712,
      lastHits: 284,
      performance: { fight: 85, farm: 92, push: 78, support: 45, versatility: 67 },
      bestMatchups: [{ hero: 'Pudge', winrate: 89 }, { hero: 'Crystal Maiden', winrate: 84 }],
      worstMatchups: [{ hero: 'Invoker', winrate: 32 }, { hero: 'Storm Spirit', winrate: 38 }],
      favoriteItems: ['Black King Bar', 'Shadow Blade', 'Desolator'],
      positions: { mid: 94, carry: 6 },
      recentRecord: { wins: 8, losses: 4 }
    },
    {
      name: 'Anti-Mage',
      matches: 68,
      winrate: 58,
      kda: '7.8/2.9/4.2',
      gpm: 734,
      xpm: 665,
      lastHits: 312,
      performance: { fight: 72, farm: 96, push: 88, support: 25, versatility: 45 },
      bestMatchups: [{ hero: 'Invoker', winrate: 78 }, { hero: 'Storm Spirit', winrate: 71 }],
      worstMatchups: [{ hero: 'Ursa', winrate: 28 }, { hero: 'Lifestealer', winrate: 34 }],
      favoriteItems: ['Battle Fury', 'Manta Style', 'Heart of Tarrasque'],
      positions: { carry: 100 },
      recentRecord: { wins: 5, losses: 3 }
    },
    {
      name: 'Invoker',
      matches: 42,
      winrate: 71,
      kda: '9.1/3.8/8.7',
      gpm: 598,
      xpm: 689,
      lastHits: 201,
      performance: { fight: 88, farm: 76, push: 72, support: 68, versatility: 94 },
      bestMatchups: [{ hero: 'Anti-Mage', winrate: 82 }, { hero: 'Phantom Assassin', winrate: 79 }],
      worstMatchups: [{ hero: 'Storm Spirit', winrate: 45 }, { hero: 'Queen of Pain', winrate: 48 }],
      favoriteItems: ['Aghanim\'s Scepter', 'Black King Bar', 'Refresher Orb'],
      positions: { mid: 100 },
      recentRecord: { wins: 7, losses: 2 }
    }
  ],

  // Rich Match History
  detailedMatches: [
    {
      id: 1,
      hero: 'Shadow Fiend',
      result: 'Victory',
      kda: '12/3/8',
      gpm: 687,
      xpm: 712,
      duration: '38:42',
      mode: 'Ranked Solo',
      skillBracket: 'Very High Skill',
      avgMmr: 6180,
      impactScore: 'MVP',
      laneOutcome: 'Won',
      partySize: 1,
      radiantSide: true,
      team: [
        { hero: 'Shadow Fiend', player: 'You', pos: 2 },
        { hero: 'Pudge', player: 'Tank_Master', pos: 5 },
        { hero: 'Anti-Mage', player: 'Carry_God', pos: 1 },
        { hero: 'Invoker', player: 'Magic_Pro', pos: 3 },
        { hero: 'Crystal Maiden', player: 'Support_Queen', pos: 4 }
      ],
      enemyTeam: [
        { hero: 'Storm Spirit', player: 'Lightning_Fast', pos: 2 },
        { hero: 'Axe', player: 'Axe_Wielder', pos: 3 },
        { hero: 'Phantom Assassin', player: 'Crit_Lord', pos: 1 },
        { hero: 'Lion', player: 'Finger_Death', pos: 5 },
        { hero: 'Enigma', player: 'Black_Hole', pos: 4 }
      ],
      keyStats: { healed: 0, heroDmg: 32847, towerDmg: 4921, fantasyPoints: 18.7 }
    },
    {
      id: 2,
      hero: 'Anti-Mage',
      result: 'Defeat',
      kda: '8/7/3',
      gpm: 634,
      xpm: 598,
      duration: '45:18',
      mode: 'Ranked Solo',
      skillBracket: 'Very High Skill',
      avgMmr: 6205,
      impactScore: 'Good',
      laneOutcome: 'Drew',
      partySize: 1,
      radiantSide: false,
      team: [
        { hero: 'Anti-Mage', player: 'You', pos: 1 },
        { hero: 'Queen of Pain', player: 'Pain_Dealer', pos: 2 },
        { hero: 'Centaur Warrunner', player: 'Tank_Horse', pos: 3 },
        { hero: 'Dazzle', player: 'Grave_Saver', pos: 5 },
        { hero: 'Rubick', player: 'Spell_Steal', pos: 4 }
      ],
      enemyTeam: [
        { hero: 'Phantom Assassin', player: 'Crit_Master', pos: 1 },
        { hero: 'Invoker', player: 'Spell_Caster', pos: 2 },
        { hero: 'Pudge', player: 'Hook_King', pos: 4 },
        { hero: 'Tidehunter', player: 'Wave_Maker', pos: 3 },
        { hero: 'Crystal Maiden', player: 'Ice_Queen', pos: 5 }
      ],
      keyStats: { healed: 0, heroDmg: 28934, towerDmg: 6821, fantasyPoints: 14.2 }
    }
  ],

  // Performance Patterns
  patterns: {
    timePerformance: [
      { hour: '6AM', winrate: 45, games: 12 },
      { hour: '12PM', winrate: 62, games: 89 },
      { hour: '6PM', winrate: 71, games: 234 },
      { hour: '12AM', winrate: 52, games: 156 }
    ],
    dayPerformance: [
      { day: 'Mon', winrate: 48, games: 89, mmrChange: -45 },
      { day: 'Tue', winrate: 62, games: 76, mmrChange: 23 },
      { day: 'Wed', winrate: 71, games: 92, mmrChange: 67 },
      { day: 'Thu', winrate: 58, games: 84, mmrChange: 12 },
      { day: 'Fri', winrate: 69, games: 94, mmrChange: 89 },
      { day: 'Sat', winrate: 55, games: 124, mmrChange: -12 },
      { day: 'Sun', winrate: 51, games: 98, mmrChange: -23 }
    ],
    roleProficiency: [
      { role: 'Carry', games: 421, winrate: 64, preference: 35 },
      { role: 'Mid', games: 634, winrate: 62, preference: 45 },
      { role: 'Offlane', games: 234, winrate: 48, preference: 12 },
      { role: 'Support', games: 187, winrate: 58, preference: 8 }
    ]
  },

  // Goals and Achievements
  goals: {
    weekly: [
      { name: 'Maintain 65%+ winrate', progress: 78, target: 100, type: 'winrate' },
      { name: 'Average 70+ CS/min', progress: 68, target: 70, type: 'farming' },
      { name: 'Play 3+ different heroes', progress: 2, target: 3, type: 'diversity' }
    ],
    achievements: [
      { name: '10 Game Win Streak', date: '2024-05-28', rarity: 'rare' },
      { name: 'Rampage', date: '2024-05-15', rarity: 'epic' },
      { name: 'Perfect KDA Game', date: '2024-04-22', rarity: 'legendary' }
    ]
  }
};

// Utility function for better class handling
const cn = (...classes) => clsx(classes);

// Player Dashboard
const PlayerDashboard = () => {
  const { user } = useAuth();
  const { 
    recentMatches, 
    heroStats, 
    winLoss, 
    ratings, 
    heroes,
    loading, 
    isLoading
  } = useData();
  
  const [activeTab, setActiveTab] = useState('overview');

  // Transform API data to dashboard format
  const todaySession = useMemo(() => {
    if (!recentMatches) return { wins: 0, losses: 0, mmrChange: 0, currentStreak: 0, gamesUntilBehaviorUpdate: 15 };
    return calculateTodaySession(recentMatches);
  }, [recentMatches]);

  const coreMetrics = useMemo(() => {
    if (!recentMatches && !winLoss) return getDefaultMetrics();
    return calculateCoreMetrics(user, winLoss, null, recentMatches);
  }, [user, winLoss, recentMatches]);

  const transformedHeroStats = useMemo(() => {
    if (!heroStats || !heroes) return getDefaultHeroStats();
    return transformHeroStats(heroStats, heroes);
  }, [heroStats, heroes]);

  const mmrHistory = useMemo(() => {
    if (!ratings) return [];
    return transformRatings(ratings);
  }, [ratings]);

  // Transformed matches for future use
  const _transformedMatches = useMemo(() => {
    if (!recentMatches || !heroes) return [];
    return transformMatches(recentMatches, heroes);
  }, [recentMatches, heroes]);

  return (
    <Tooltip.Provider>
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        {/* Main Container - Optimized for PC screens */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 max-w-[1920px]">
          {/* Dashboard Tabs for better organization on PC */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Tabs.List className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 mb-8 border border-gray-700/50 shadow-xl">
              {[
                { value: 'overview', label: 'Overview', icon: Home },
                { value: 'performance', label: 'Performance', icon: BarChart3 },
                { value: 'heroes', label: 'Heroes', icon: Shield },
                { value: 'matches', label: 'Matches', icon: Swords },
                { value: 'insights', label: 'Insights', icon: Brain }
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
                    activeTab === tab.value
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg transform scale-105"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Overview Tab */}
            <Tabs.Content value="overview" className="space-y-8">
              {/* Session Tracker Widget - Enhanced for PC */}
              <motion.div
                variants={cardAnimation}
                className="bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">Today's Session</p>
                      {loading.matches ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-700 rounded w-20 mx-auto lg:mx-0 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-16 mx-auto lg:mx-0"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-white text-2xl lg:text-3xl font-bold">
                            {todaySession.wins}W - {todaySession.losses}L
                          </p>
                          <p className="text-gray-400 text-xs">
                            Win Rate: {todaySession.wins + todaySession.losses > 0 ? 
                              Math.round((todaySession.wins / (todaySession.wins + todaySession.losses)) * 100) : 0}%
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">MMR Change</p>
                      {loading.matches ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-700 rounded w-16 mx-auto lg:mx-0 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-20 mx-auto lg:mx-0"></div>
                        </div>
                      ) : (
                        <>
                          <p className={cn(
                            "text-2xl lg:text-3xl font-bold flex items-center justify-center lg:justify-start",
                            todaySession.mmrChange > 0 ? 'text-green-400' : todaySession.mmrChange < 0 ? 'text-red-400' : 'text-gray-400'
                          )}>
                            {todaySession.mmrChange > 0 ? (
                              <ArrowUp className="w-5 h-5 mr-1" />
                            ) : todaySession.mmrChange < 0 ? (
                              <ArrowDown className="w-5 h-5 mr-1" />
                            ) : (
                              <Minus className="w-5 h-5 mr-1" />
                            )}
                            {Math.abs(todaySession.mmrChange)}
                          </p>
                          <p className="text-gray-400 text-xs">Today's progress</p>
                        </>
                      )}
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">Current Streak</p>
                      {loading.matches ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-700 rounded w-12 mx-auto lg:mx-0 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-16 mx-auto lg:mx-0"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-white text-2xl lg:text-3xl font-bold flex items-center justify-center lg:justify-start">
                            <Flame className="w-6 h-6 mr-2 text-orange-400" />
                            {todaySession.currentStreak}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {todaySession.currentStreak > 0 ? 'Win streak' : 'Games today'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">Behavior Update</p>
                      {loading.matches ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-700 rounded w-8 mx-auto lg:mx-0 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-20 mx-auto lg:mx-0"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-white text-2xl lg:text-3xl font-bold">{todaySession.gamesUntilBehaviorUpdate}</p>
                          <p className="text-gray-400 text-xs">Games remaining</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions for PC */}
                  <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:scale-105">
                          <Play className="w-5 h-5 text-green-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-sm">
                        Find Match
                      </Tooltip.Content>
                    </Tooltip.Root>
                    
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105">
                          <BarChart3 className="w-5 h-5 text-blue-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Content className="bg-gray-800 text-white px-2 py-1 rounded text-sm">
                        Detailed Stats
                      </Tooltip.Content>
                    </Tooltip.Root>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Player Profile - PC Optimized */}
              <motion.div
                variants={cardAnimation}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 border border-gray-700/50 shadow-2xl backdrop-blur-sm"
              >
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Profile Avatar and Basic Info */}
                  <div className="flex flex-col items-center xl:items-start space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      className="relative w-32 h-32 lg:w-40 lg:h-40"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                        <User className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </motion.div>
                    
                    <div className="text-center xl:text-left">
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                        {user?.personaName || user?.profile?.personaname || 'Player'}
                      </h2>
                      <div className="flex items-center justify-center xl:justify-start space-x-3 mb-4">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="text-xl text-yellow-400 font-semibold">
                          {getRankName(user?.rank?.tier || user?.rank_tier) || 'Unranked'}
                        </span>
                        {user?.rank?.leaderboard || user?.leaderboard_rank ? (
                          <span className="text-gray-400">#{user?.rank?.leaderboard || user?.leaderboard_rank}</span>
                        ) : null}
                      </div>
                      
                      {/* Streak Badge */}
                      {todaySession.currentStreak > 0 ? (
                        <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-full">
                          <ArrowUp className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-medium">{todaySession.currentStreak} Win Streak</span>
                        </div>
                      ) : todaySession.losses > 0 ? (
                        <div className="inline-flex items-center bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full">
                          <ArrowDown className="w-4 h-4 text-red-400 mr-2" />
                          <span className="text-red-400 font-medium">No Active Streak</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center bg-gray-500/20 border border-gray-500/30 px-4 py-2 rounded-full">
                          <Minus className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-400 font-medium">No Games Today</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Stats Grid */}
                  <div className="xl:col-span-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {(() => {
                        const stats = [
                          { 
                            label: 'Current MMR', 
                            value: user?.mmr?.solo || user?.mmr?.estimate || user?.solo_competitive_rank || 'N/A', 
                            icon: Star, 
                            color: 'cyan' 
                          },
                          { 
                            label: 'Total Games', 
                            value: winLoss ? winLoss.win + winLoss.lose : 'N/A', 
                            icon: TrendingUp, 
                            color: 'green' 
                          },
                          { 
                            label: 'Plus Subscriber', 
                            value: user?.profile?.plus ? 'Yes' : 'No', 
                            icon: Heart, 
                            color: user?.profile?.plus ? 'green' : 'gray',
                            isText: true 
                          },
                          { 
                            label: 'Cheese Count', 
                            value: user?.profile?.cheese || 0, 
                            icon: Award, 
                            color: 'yellow' 
                          },
                          { 
                            label: 'Win Rate', 
                            value: winLoss && (winLoss.win + winLoss.lose) > 0 ? 
                              `${((winLoss.win / (winLoss.win + winLoss.lose)) * 100).toFixed(1)}%` : 'N/A',
                            icon: Trophy, 
                            color: 'green',
                            isText: true 
                          },
                          { 
                            label: 'Recent Wins', 
                            value: winLoss?.win || 0, 
                            icon: CheckCircle, 
                            color: 'green' 
                          },
                          { 
                            label: 'Recent Losses', 
                            value: winLoss?.lose || 0, 
                            icon: X, 
                            color: 'red' 
                          },
                          { 
                            label: 'Account ID', 
                            value: user?.accountId || 'N/A', 
                            icon: MapPin, 
                            color: 'blue', 
                            isText: true 
                          },
                        ];

                        return stats.map((stat, index) => (
                          <Tooltip.Root key={index}>
                            <Tooltip.Trigger asChild>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
                                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                                </div>
                                {loading.stats && (stat.label.includes('Win') || stat.label.includes('Games')) ? (
                                  <div className="animate-pulse">
                                    <div className="h-6 bg-gray-700 rounded w-12"></div>
                                  </div>
                                ) : (
                                  <p className={`text-lg lg:text-xl font-bold text-${stat.color}-400`}>
                                    {stat.isText ? stat.value : (
                                      typeof stat.value === 'number' ? 
                                        <AnimatedNumber value={stat.value} /> : 
                                        stat.value
                                    )}
                                  </p>
                                )}
                              </motion.div>
                            </Tooltip.Trigger>
                            <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                              {stat.label} Details
                            </Tooltip.Content>
                          </Tooltip.Root>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Performance Metrics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {coreMetrics.slice(0, 4).map((metric, index) => {
                  // Map icon names to components
                  const IconComponent = metric.icon === 'Target' ? Target :
                                       metric.icon === 'Trophy' ? Trophy :
                                       metric.icon === 'Coins' ? Coins :
                                       metric.icon === 'Star' ? Star :
                                       Target; // default
                  
                  return (
                    <motion.div
                      key={index}
                      variants={cardAnimation}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1">
                          {metric.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400" />}
                          {metric.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400" />}
                          {metric.trend === 'same' && <Minus className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm font-medium mb-2">{metric.label}</p>
                      {isLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-700 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-20"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl lg:text-3xl font-bold text-white mb-1">
                            {typeof metric.value === 'number' ? (
                              <AnimatedNumber value={metric.value} suffix={metric.suffix || ''} />
                            ) : (
                              metric.value
                            )}
                          </p>
                          <p className={`text-xs font-medium ${
                            metric.trend === 'up' ? 'text-green-400' : 
                            metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {metric.trend === 'up' ? '↗ Improving' : 
                             metric.trend === 'down' ? '↘ Declining' : '→ Stable'}
                          </p>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Tabs.Content>

            {/* Performance Tab */}
            <Tabs.Content value="performance" className="space-y-8">
              {/* Advanced Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockData.coreMetrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    variants={cardAnimation}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-gray-400 text-sm font-medium">{metric.label}</p>
                      <div className="flex items-center space-x-2">
                        {metric.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400" />}
                        {metric.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400" />}
                        <div className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-lg flex items-center justify-center`}>
                          <metric.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {typeof metric.value === 'number' ? (
                        <AnimatedNumber value={metric.value} suffix={metric.suffix || ''} />
                      ) : (
                        metric.value
                      )}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* MMR Analytics */}
              <motion.div
                variants={cardAnimation}
                className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/40 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    <span>MMR Progression</span>
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                      <span className="text-sm text-gray-400">Solo Queue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-sm text-gray-400">Party Queue</span>
                    </div>
                  </div>
                </div>
                {loading.ratings ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-pulse text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-xl mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-32 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-24 mx-auto"></div>
                    </div>
                  </div>
                ) : mmrHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={mmrHistory}>
                      <defs>
                        <linearGradient id="soloGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                      <XAxis dataKey="date" stroke="#8b92a5" />
                      <YAxis stroke="#8b92a5" domain={['dataMin - 100', 'dataMax + 100']} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#0f1823',
                          border: '1px solid #1a2332',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="solo"
                        stroke="#00d4ff"
                        strokeWidth={3}
                        dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                      />
                      {mmrHistory.some(d => d.party > 0) && (
                        <Line
                          type="monotone"
                          dataKey="party"
                          stroke="#a855f7"
                          strokeWidth={2}
                          dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-center">
                    <div>
                      <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">No MMR History</h3>
                      <p className="text-gray-400 text-sm">
                        MMR tracking data is not available for this player.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </Tabs.Content>

            {/* Heroes Tab */}
            <Tabs.Content value="heroes" className="space-y-8">
              {loading.heroes ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 shadow-xl">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-16 h-16 bg-gray-700 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
                            <div className="h-4 bg-gray-700 rounded w-24"></div>
                          </div>
                          <div className="w-12 h-6 bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-48 bg-gray-700 rounded mb-4"></div>
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="text-center">
                              <div className="h-4 bg-gray-700 rounded w-8 mx-auto mb-1"></div>
                              <div className="h-5 bg-gray-700 rounded w-12 mx-auto"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : transformedHeroStats.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {transformedHeroStats.slice(0, 6).map((hero, index) => (
                    <motion.div
                      key={index}
                      variants={cardAnimation}
                      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/40 shadow-xl"
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
                          {hero.name.substring(0, 2)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{hero.name}</h3>
                          <p className="text-gray-400">{hero.matches} matches • {hero.winrate}% win rate</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          hero.winrate >= 60 ? 'bg-green-500/20 text-green-400' : 
                          hero.winrate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {hero.winrate}%
                        </div>
                      </div>

                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={Object.entries(hero.performance || {}).map(([key, value]) => ({
                          metric: key.charAt(0).toUpperCase() + key.slice(1),
                          value,
                          fullMark: 100
                        }))}>
                          <PolarGrid stroke="#1a2332" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: '#8b92a5', fontSize: 12 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            dataKey="value"
                            stroke="#00d4ff"
                            fill="#00d4ff"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>

                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-400">KDA</p>
                          <p className="text-cyan-400 font-bold">{hero.kda}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">GPM</p>
                          <p className="text-yellow-400 font-bold">{hero.gpm}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">Recent</p>
                          <p className="text-green-400 font-bold">
                            {hero.recentRecord?.wins || 0}W-{hero.recentRecord?.losses || 0}L
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Hero Data</h3>
                  <p className="text-gray-400">Hero statistics are not available for this player.</p>
                </div>
              )}
            </Tabs.Content>

            {/* Closing tabs */}
            <Tabs.Content value="matches" className="space-y-8">
              <div className="text-center py-20">
                <Swords className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Match History</h3>
                <p className="text-gray-400">Detailed match analysis coming soon...</p>
              </div>
            </Tabs.Content>

            <Tabs.Content value="insights" className="space-y-8">
              <div className="text-center py-20">
                <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">AI Insights</h3>
                <p className="text-gray-400">Performance insights and recommendations coming soon...</p>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
};

// Loading Component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Loading Dota 2 Companion</h2>
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-cyan-400 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Simple router for handling auth callback
const SimpleRouter = () => {
  const path = window.location.pathname;
  
  if (path === '/auth/steam/callback') {
    // Handle Steam authentication callback
    return <AuthCallbackHandler />;
  }
  
  return <AppContent />;
};

// Auth callback handler component
const AuthCallbackHandler = () => {
  const { handleSteamCallback, error, toggleAuthMode } = useAuth();
  const [processingError, setProcessingError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent processing multiple times
    if (hasProcessed) return;

    const processCallback = async () => {
      try {
        setHasProcessed(true);
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check if this is a valid Steam callback
        if (urlParams.has('openid.mode') && urlParams.has('openid.claimed_id')) {
          await handleSteamCallback(urlParams);
          setIsComplete(true);
          // Redirect to main app after a short delay
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
          }, 1500);
        } else {
          // Not a Steam callback, redirect to main page
          console.log('Not a Steam callback, redirecting to main page');
          window.history.replaceState({}, '', '/');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        setProcessingError(error);
      }
    };

    processCallback();
  }, [hasProcessed, handleSteamCallback]); // Include dependencies

  const handleSwitchToDevMode = () => {
    toggleAuthMode(); // Switch to development mode
    window.history.replaceState({}, '', '/');
  };

  const finalError = error || processingError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl max-w-md"
      >
        {finalError ? (
          <>
            {finalError.switchToDevMode ? (
              <Gamepad2 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold text-white mb-2">
              {finalError.switchToDevMode ? 'Steam Login Successful!' : 'Authentication Failed'}
            </h2>
            <p className={`text-sm mb-6 ${finalError.switchToDevMode ? 'text-gray-300' : 'text-red-400'}`}>
              {finalError.message}
            </p>
            <div className="space-y-3">
              {finalError.switchToDevMode && (
                <button
                  onClick={handleSwitchToDevMode}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-6 py-3 rounded-lg transition-all font-medium"
                >
                  Switch to Development Mode
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Return to Login
              </button>
            </div>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Authentication Complete!</h2>
            <p className="text-gray-400 text-sm mb-4">Redirecting to your dashboard...</p>
            <div className="flex items-center justify-center space-x-2">
              <ChevronRight className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm">Loading dashboard</span>
            </div>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">Processing Authentication</h2>
            <p className="text-gray-400 text-sm mb-4">Fetching your Steam and Dota 2 data...</p>
            <div className="flex items-center justify-center space-x-2">
              <LoaderCircle className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-cyan-400 text-sm">Please wait</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PlayerDashboard />;
      case 'matches':
        return <div className="p-6 text-white">Matches page coming soon...</div>;
      case 'heroes':
        return <div className="p-6 text-white">Heroes page coming soon...</div>;
      case 'live':
        return <div className="p-6 text-white">Live Game page coming soon...</div>;
      case 'draft':
        return <div className="p-6 text-white">Draft page coming soon...</div>;
      case 'pro':
        return <div className="p-6 text-white">Pro Scene page coming soon...</div>;
      default:
        return <PlayerDashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <Tooltip.Provider>
        <div className="min-h-screen bg-gray-900">
          <Navigation 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </div>
      </Tooltip.Provider>
    </DataProvider>
  );
};

// Main App Component with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <SimpleRouter />
    </AuthProvider>
  );
}