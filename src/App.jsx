import React, { useState, useEffect, createContext, useContext } from 'react';
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

// Authentication Context
const AuthContext = createContext(null);

// Authentication Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('dota2_user');
        const sessionExpiry = localStorage.getItem('dota2_session_expiry');
        
        if (savedUser && sessionExpiry) {
          const now = new Date().getTime();
          const expiry = parseInt(sessionExpiry);
          
          if (now < expiry) {
            setUser(JSON.parse(savedUser));
          } else {
            // Session expired, clear storage
            localStorage.removeItem('dota2_user');
            localStorage.removeItem('dota2_session_expiry');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('dota2_user');
        localStorage.removeItem('dota2_session_expiry');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock authentication validation
      if (!credentials.steamId || credentials.steamId.length < 3) {
        throw new Error('Please enter a valid Steam ID');
      }
      
      if (!credentials.password || credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Mock successful authentication
      const userData = {
        id: credentials.steamId,
        steamId: credentials.steamId,
        displayName: credentials.steamId.includes('pro') ? 'ProGamer_Elite' : 'PlayerX_ProGamer',
        avatar: null,
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Set session expiry (24 hours)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      
      // Save to localStorage
      localStorage.setItem('dota2_user', JSON.stringify(userData));
      localStorage.setItem('dota2_session_expiry', expiryTime.toString());
      
      setUser(userData);
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('dota2_user');
    localStorage.removeItem('dota2_session_expiry');
  };
  
  const clearError = () => setError(null);
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      login,
      logout,
      clearError,
      isAuthenticated: !!user
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
  const { user, logout } = useAuth();
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
                  <span className="text-sm text-gray-300">{user?.displayName || 'Player'}</span>
                  <span className="text-xs text-gray-500">#{user?.steamId || '12345'}</span>
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

// Enhanced Login Page with Form
const LoginPage = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    steamId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.steamId.trim()) {
      errors.steamId = 'Steam ID is required';
    } else if (formData.steamId.length < 3) {
      errors.steamId = 'Steam ID must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error.message);
    }
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

        {/* Login Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}

            {/* Steam ID Field */}
            <div>
              <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-2">
                Steam ID or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="steamId"
                  name="steamId"
                  value={formData.steamId}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                    formErrors.steamId ? 'border-red-500/50' : 'border-gray-600/50'
                  }`}
                  placeholder="Enter your Steam ID"
                  disabled={isLoading}
                />
              </div>
              {formErrors.steamId && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-1"
                >
                  {formErrors.steamId}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                    formErrors.password ? 'border-red-500/50' : 'border-gray-600/50'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-1"
                >
                  {formErrors.password}
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
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
          >
            <p className="text-gray-400 text-sm mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Steam ID: <span className="text-cyan-400">demo_user</span> or <span className="text-cyan-400">pro_player</span></p>
              <p>Password: <span className="text-cyan-400">password123</span> (min 6 characters)</p>
            </div>
          </motion.div>
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
  const [_timeFilter, _setTimeFilter] = useState('month');
  const [_showAdvanced, _setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
                      <p className="text-white text-2xl lg:text-3xl font-bold">
                        {mockData.todaySession.wins}W - {mockData.todaySession.losses}L
                      </p>
                      <p className="text-gray-400 text-xs">Win Rate: {Math.round((mockData.todaySession.wins / (mockData.todaySession.wins + mockData.todaySession.losses)) * 100)}%</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">MMR Change</p>
                      <p className={cn(
                        "text-2xl lg:text-3xl font-bold flex items-center justify-center lg:justify-start",
                        mockData.todaySession.mmrChange > 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {mockData.todaySession.mmrChange > 0 ? (
                          <ArrowUp className="w-5 h-5 mr-1" />
                        ) : (
                          <ArrowDown className="w-5 h-5 mr-1" />
                        )}
                        {Math.abs(mockData.todaySession.mmrChange)}
                      </p>
                      <p className="text-gray-400 text-xs">Today's progress</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">Current Streak</p>
                      <p className="text-white text-2xl lg:text-3xl font-bold flex items-center justify-center lg:justify-start">
                        <Flame className="w-6 h-6 mr-2 text-orange-400" />
                        {mockData.todaySession.currentStreak}
                      </p>
                      <p className="text-gray-400 text-xs">Win streak</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-cyan-400 text-sm font-medium mb-1">Behavior Update</p>
                      <p className="text-white text-2xl lg:text-3xl font-bold">{mockData.todaySession.gamesUntilBehaviorUpdate}</p>
                      <p className="text-gray-400 text-xs">Games remaining</p>
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
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{mockData.profile.name}</h2>
                      <div className="flex items-center justify-center xl:justify-start space-x-3 mb-4">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="text-xl text-yellow-400 font-semibold">{mockData.profile.rank}</span>
                        <span className="text-gray-400">#{mockData.profile.rankNumber}</span>
                      </div>
                      
                      {/* Streak Badge */}
                      {mockData.profile.streakType === 'win' ? (
                        <div className="inline-flex items-center bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-full">
                          <ArrowUp className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-medium">{mockData.profile.streakCount} Win Streak</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full">
                          <ArrowDown className="w-4 h-4 text-red-400 mr-2" />
                          <span className="text-red-400 font-medium">{mockData.profile.streakCount} Loss Streak</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Stats Grid */}
                  <div className="xl:col-span-2">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      {[
                        { label: 'Current MMR', value: mockData.profile.mmr, icon: Star, color: 'cyan' },
                        { label: 'Peak MMR', value: mockData.profile.peakMmr, icon: TrendingUp, color: 'green' },
                        { label: 'Behavior Score', value: mockData.profile.behaviorScore, icon: Heart, color: mockData.profile.behaviorScore >= 9000 ? 'green' : 'yellow' },
                        { label: 'Account Level', value: mockData.profile.accountLevel, icon: Award, color: 'purple' },
                        { label: 'Hours Played', value: `${mockData.profile.hoursPlayed}h`, icon: Clock, color: 'blue' },
                        { label: 'Win Rate', value: '58.3%', icon: Trophy, color: 'green' },
                        { label: 'Commends', value: mockData.profile.commends, icon: Gift, color: 'yellow' },
                        { label: 'Region', value: mockData.profile.preferredRegion, icon: MapPin, color: 'blue', isText: true },
                      ].map((stat, index) => (
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
                              <p className={`text-lg lg:text-xl font-bold text-${stat.color}-400`}>
                                {stat.isText ? stat.value : <AnimatedNumber value={typeof stat.value === 'string' ? stat.value : stat.value} />}
                              </p>
                            </motion.div>
                          </Tooltip.Trigger>
                          <Tooltip.Content className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700">
                            {stat.label} Details
                          </Tooltip.Content>
                        </Tooltip.Root>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Performance Metrics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {mockData.coreMetrics.slice(0, 4).map((metric, index) => (
                  <motion.div
                    key={index}
                    variants={cardAnimation}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <metric.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {metric.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-400" />}
                        {metric.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-400" />}
                        {metric.trend === 'same' && <Minus className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-2">{metric.label}</p>
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
                  </motion.div>
                ))}
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
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockData.mmrHistory}>
                    <defs>
                      <linearGradient id="soloGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                    <XAxis dataKey="date" stroke="#8b92a5" />
                    <YAxis stroke="#8b92a5" domain={[5500, 6400]} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f1823',
                        border: '1px solid #1a2332',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="solo"
                      stroke="#00d4ff"
                      strokeWidth={3}
                      fill="url(#soloGradient)"
                      fillOpacity={0.6}
                    />
                    <Line
                      type="monotone"
                      dataKey="party"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </Tabs.Content>

            {/* Heroes Tab */}
            <Tabs.Content value="heroes" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {mockData.detailedHeroes.map((hero, index) => (
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
                      <RadarChart data={Object.entries(hero.performance).map(([key, value]) => ({
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
                        <p className="text-green-400 font-bold">{hero.recentRecord.wins}W-{hero.recentRecord.losses}L</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
  );
};

// Main App Component with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}