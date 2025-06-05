import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConfigProvider, 
  App as AntApp, 
  Layout, 
  Menu, 
  Space, 
  Avatar, 
  Dropdown, 
  Badge, 
  Button, 
  Tooltip,
  notification
} from 'antd';
import {
  HomeOutlined,
  TrophyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { darkTheme } from './theme/antdTheme.js';
import MatchAnalysis from './components/MatchAnalysis/MatchAnalysis.jsx';
import AssetTest from './components/AssetTest.jsx';

const { Header, Content, Sider } = Layout;
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Home, Swords, Shield, Users, Trophy, Settings, Menu as LucideMenu, X, ChevronRight, 
  TrendingUp, Clock, Target, Activity, Star, Zap, User, Gamepad2,
  ArrowUp, ArrowDown, Minus, Eye, Flame, Coins, Heart, Calendar,
  Filter, RotateCcw, Award, AlertTriangle, Brain, Timer, Crosshair,
  BarChart3, Gauge, Sparkles, MapPin, Users2, MessageSquare, Skull,
  Siren, Crown, Gift, CheckCircle, Circle, Pause, Play, MoreHorizontal,
  Monitor, Laptop, Smartphone, Lock, Mail, EyeOff, LoaderCircle
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import authService from './services/auth.service.js';
import { DataProvider, useData } from './contexts/DataContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import AntDashboard from './components/Dashboard/AntDashboard.jsx';
import './styles/dashboard.css';
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

// Ant Design Navigation Component  
const Navigation = ({ currentPage, setCurrentPage, mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout, refreshUserData, isLoading } = useAuth();
  
  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: 'matches', icon: <TrophyOutlined />, label: 'Matches' },
    { key: 'heroes', icon: <TeamOutlined />, label: 'Heroes' },
    { key: 'live', icon: <ThunderboltOutlined />, label: 'Live Game' },
    { key: 'pro', icon: <TrophyOutlined />, label: 'Pro Scene' },
    { key: 'draft', icon: <TeamOutlined />, label: 'Draft' }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = async () => {
    try {
      await refreshUserData();
      notification.success({
        message: 'Data Refreshed',
        description: 'Player data has been successfully updated.',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      notification.error({
        message: 'Refresh Failed',
        description: 'Unable to refresh player data. Please try again.',
        placement: 'topRight',
      });
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="bg-gray-900 border-b border-gray-700 px-6 py-0 h-16 flex items-center justify-between">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center"
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-white">Dota 2 Command Center</h1>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:block">
          <Menu
            mode="horizontal"
            selectedKeys={[currentPage]}
            onClick={({ key }) => setCurrentPage(key)}
            items={menuItems}
            className="bg-transparent border-none"
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* User Actions */}
      <Space size="middle">
        {/* Mobile Menu Button */}
        <Button
          type="text"
          icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white"
        />
        
        {/* Refresh Button */}
        <Tooltip title={isLoading ? 'Refreshing...' : 'Refresh Data'}>
          <Button
            type="text"
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-gray-400 hover:text-cyan-400"
          />
        </Tooltip>
        
        {/* User Profile Dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-700 transition-colors">
            <Avatar
              size={32}
              icon={<UserOutlined />}
              className="bg-gradient-to-br from-purple-500 to-pink-600"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm text-gray-300 font-medium">
                {user?.personaName || user?.displayName || 'Player'}
              </span>
              <span className="text-xs text-gray-500">
                {user?.authMode === 'development' ? `ID: ${user?.accountId}` : `#${user?.steamId || '12345'}`}
              </span>
            </div>
          </div>
        </Dropdown>
      </Space>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-900 border-b border-gray-700 z-50">
          <Menu
            mode="vertical"
            selectedKeys={[currentPage]}
            onClick={({ key }) => {
              setCurrentPage(key);
              setMobileMenuOpen(false);
            }}
            items={menuItems}
            className="bg-gray-900 border-none"
            style={{
              backgroundColor: '#111827',
              color: 'white'
            }}
          />
        </div>
      )}
    </Header>
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


// Utility function for better class handling
const cn = (...classes) => clsx(classes);

// Professional Command Center Dashboard
const CommandCenterDashboard = () => {
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
  
  // Command Center State Management (Future Feature Placeholders)
  const [CURRENT_FOCUS, SET_CURRENT_FOCUS] = useState('overview');
  const [LAYOUT_MODE, SET_LAYOUT_MODE] = useState('command'); // command, analysis, focus
  const [ALERT_LEVEL, SET_ALERT_LEVEL] = useState('normal'); // normal, warning, danger, flow

  // Professional Analytics Calculations
  const todaySession = useMemo(() => {
    if (!recentMatches) return { wins: 0, losses: 0, mmrChange: 0, currentStreak: 0, gamesUntilBehaviorUpdate: 15 };
    return calculateTodaySession(recentMatches);
  }, [recentMatches]);

  // Tilt-O-Meter™ Calculation
  const tiltMeter = useMemo(() => {
    if (!recentMatches || recentMatches.length < 3) return { level: 0, status: 'stable', message: 'Not enough data' };
    
    const last10Games = recentMatches.slice(0, 10);
    const recentPerformance = last10Games.reduce((acc, match, index) => {
      const weight = 1 - (index * 0.1); // Recent games weighted more
      const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
      const gpm = match.gold_per_min || 0;
      const xpm = match.xp_per_min || 0;
      
      acc.kdaScore += (kda > 2 ? 1 : kda < 1 ? -1 : 0) * weight;
      acc.farmScore += (gpm > 400 ? 1 : gpm < 300 ? -1 : 0) * weight;
      acc.experienceScore += (xpm > 500 ? 1 : xpm < 400 ? -1 : 0) * weight;
      acc.gameResults += (match.radiant_win === match.player_slot < 128 ? 1 : -1) * weight;
      
      return acc;
    }, { kdaScore: 0, farmScore: 0, experienceScore: 0, gameResults: 0 });
    
    const tiltScore = Math.max(0, Math.min(100, 50 + (
      recentPerformance.kdaScore * 10 + 
      recentPerformance.farmScore * 8 + 
      recentPerformance.experienceScore * 7 + 
      recentPerformance.gameResults * 15
    )));
    
    let status, message;
    if (tiltScore >= 80) {
      status = 'flow';
      message = 'IN THE ZONE! Keep playing!';
    } else if (tiltScore >= 60) {
      status = 'good';
      message = 'Playing well, maintain focus';
    } else if (tiltScore >= 40) {
      status = 'neutral';
      message = 'Stable performance';
    } else if (tiltScore >= 20) {
      status = 'warning';
      message = 'Consider taking a break';
    } else {
      status = 'danger';
      message = 'STOP PLAYING NOW!';
    }
    
    return { level: Math.round(tiltScore), status, message };
  }, [recentMatches]);

  // Performance Efficiency Index (PEI)
  const performanceIndex = useMemo(() => {
    if (!recentMatches || !winLoss) return { score: 50, grade: 'C', trend: 'stable' };
    
    const recent20 = recentMatches.slice(0, 20);
    if (recent20.length < 5) return { score: 50, grade: 'C', trend: 'stable' };
    
    const metrics = recent20.reduce((acc, match) => {
      const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
      const gpm = match.gold_per_min || 0;
      const xpm = match.xp_per_min || 0;
      const duration = match.duration || 1800; // 30 min default
      const isWin = match.radiant_win === (match.player_slot < 128);
      
      acc.kdaTotal += Math.min(kda, 10); // Cap KDA at 10
      acc.gpmTotal += Math.min(gpm, 1000); // Cap GPM at 1000
      acc.xpmTotal += Math.min(xpm, 1000); // Cap XPM at 1000
      acc.winRate += isWin ? 1 : 0;
      acc.avgDuration += duration;
      
      return acc;
    }, { kdaTotal: 0, gpmTotal: 0, xpmTotal: 0, winRate: 0, avgDuration: 0 });
    
    const avgKDA = metrics.kdaTotal / recent20.length;
    const avgGPM = metrics.gpmTotal / recent20.length;
    const avgXPM = metrics.xpmTotal / recent20.length;
    const winRate = (metrics.winRate / recent20.length) * 100;
    
    // Weighted scoring system
    const score = Math.round(
      (avgKDA / 4) * 25 + // KDA worth 25%
      (avgGPM / 600) * 20 + // GPM worth 20%
      (avgXPM / 700) * 15 + // XPM worth 15%
      (winRate / 100) * 40 // Win rate worth 40%
    );
    
    let grade;
    if (score >= 90) grade = 'S+';
    else if (score >= 85) grade = 'S';
    else if (score >= 80) grade = 'A+';
    else if (score >= 75) grade = 'A';
    else if (score >= 70) grade = 'B+';
    else if (score >= 65) grade = 'B';
    else if (score >= 60) grade = 'C+';
    else if (score >= 55) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';
    
    // Calculate trend
    const firstHalf = recent20.slice(10, 20);
    const secondHalf = recent20.slice(0, 10);
    const firstScore = firstHalf.reduce((acc, match) => acc + (match.radiant_win === (match.player_slot < 128) ? 1 : 0), 0);
    const secondScore = secondHalf.reduce((acc, match) => acc + (match.radiant_win === (match.player_slot < 128) ? 1 : 0), 0);
    
    let trend = 'stable';
    if (secondScore > firstScore + 1) trend = 'improving';
    else if (firstScore > secondScore + 1) trend = 'declining';
    
    return { score: Math.min(100, Math.max(0, score)), grade, trend };
  }, [recentMatches, winLoss]);

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
    <RadixTooltip.Provider>
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-space-black relative overflow-hidden"
      >
        {/* Command Center Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-space-black via-space-dark to-space-black"></div>
        
        {/* Top Command Bar */}
        <div className="relative z-50 glass-card border-b-2 border-electric-cyan/30 rounded-none backdrop-blur-xl">
          <div className="max-w-[2560px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Command Center Logo */}
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 bg-gradient-to-br from-electric-cyan to-electric-blue rounded-lg flex items-center justify-center relative"
                >
                  <Shield className="w-8 h-8 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan to-electric-blue rounded-lg opacity-30 animate-pulse"></div>
                </motion.div>
                <div>
                  <h1 className="command-header text-2xl">DOTA 2 COMMAND CENTER</h1>
                  <p className="text-electric-cyan/60 text-sm font-mono">PROFESSIONAL ESPORTS ANALYTICS</p>
                </div>
              </div>

              {/* Real-Time Performance Indicators */}
              <div className="flex items-center space-x-6">
                {/* Tilt-O-Meter */}
                <div className="glass-card px-4 py-2 border border-electric-cyan/20">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs font-mono text-electric-cyan/80 uppercase tracking-wider">Tilt Meter</div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      tiltMeter.status === 'flow' && "bg-mental-flow/20 text-mental-flow border border-mental-flow/50",
                      tiltMeter.status === 'good' && "bg-mental-focused/20 text-mental-focused border border-mental-focused/50",
                      tiltMeter.status === 'neutral' && "bg-mental-neutral/20 text-mental-neutral border border-mental-neutral/50",
                      tiltMeter.status === 'warning' && "bg-mental-tilting/20 text-mental-tilting border border-mental-tilting/50 animate-pulse",
                      tiltMeter.status === 'danger' && "bg-mental-danger/20 text-mental-danger border border-mental-danger/50 tilt-warning"
                    )}>
                      {tiltMeter.level}%
                    </div>
                  </div>
                </div>

                {/* Performance Grade */}
                <div className="glass-card px-4 py-2 border border-electric-cyan/20">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs font-mono text-electric-cyan/80 uppercase tracking-wider">PEI Grade</div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold font-futuristic",
                      performanceIndex.grade.startsWith('S') && "bg-performance-excellent/20 text-performance-excellent border border-performance-excellent/50",
                      performanceIndex.grade.startsWith('A') && "bg-performance-good/20 text-performance-good border border-performance-good/50",
                      performanceIndex.grade.startsWith('B') && "bg-performance-average/20 text-performance-average border border-performance-average/50",
                      performanceIndex.grade.startsWith('C') && "bg-performance-poor/20 text-performance-poor border border-performance-poor/50",
                      (performanceIndex.grade === 'D' || performanceIndex.grade === 'F') && "bg-performance-terrible/20 text-performance-terrible border border-performance-terrible/50"
                    )}>
                      {performanceIndex.grade}
                    </div>
                  </div>
                </div>

                {/* Session Status */}
                <div className="glass-card px-4 py-2 border border-electric-cyan/20">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs font-mono text-electric-cyan/80 uppercase tracking-wider">Session</div>
                    <div className="text-electric-cyan font-mono font-bold">
                      {todaySession.wins}W-{todaySession.losses}L
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      todaySession.mmrChange > 0 && "bg-neon-green animate-pulse",
                      todaySession.mmrChange < 0 && "bg-neon-red animate-pulse",
                      todaySession.mmrChange === 0 && "bg-electric-cyan/50"
                    )}></div>
                  </div>
                </div>

                {/* Player Profile Quick */}
                <div className="glass-card px-4 py-2 border border-electric-cyan/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-rank-immortal to-rank-divine rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-header text-white">
                        {user?.personaName || user?.profile?.personaname || 'OPERATIVE'}
                      </div>
                      <div className="text-xs font-mono text-electric-cyan/60">
                        {getRankName(user?.rank?.tier || user?.rank_tier) || 'UNRANKED'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Command Center Layout */}
        <div className="relative z-40 max-w-[2560px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
          
          {/* Left Panel - Primary Analytics */}
          <div className="xl:col-span-8 col-span-1 space-y-6">
            
            {/* Session Health Monitor */}
            <motion.div
              variants={cardAnimation}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="command-header text-lg">SESSION HEALTH MONITOR</h2>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    tiltMeter.status === 'flow' && "bg-neon-green",
                    tiltMeter.status === 'good' && "bg-electric-cyan",
                    tiltMeter.status === 'neutral' && "bg-neon-yellow",
                    tiltMeter.status === 'warning' && "bg-performance-poor",
                    tiltMeter.status === 'danger' && "bg-neon-red"
                  )}></div>
                  <span className="text-xs font-mono text-electric-cyan/80 uppercase">
                    {tiltMeter.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-4">
                {/* Tilt-O-Meter */}
                <div className="text-center">
                  <div className="text-xs font-mono text-electric-cyan/60 mb-2 uppercase tracking-wider">Tilt-O-Meter™</div>
                  <div className={cn(
                    "relative w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center",
                    tiltMeter.status === 'flow' && "border-mental-flow text-mental-flow",
                    tiltMeter.status === 'good' && "border-mental-focused text-mental-focused",
                    tiltMeter.status === 'neutral' && "border-mental-neutral text-mental-neutral",
                    tiltMeter.status === 'warning' && "border-mental-tilting text-mental-tilting animate-pulse",
                    tiltMeter.status === 'danger' && "border-mental-danger text-mental-danger tilt-warning"
                  )}>
                    <span className="stat-number text-lg">{tiltMeter.level}</span>
                  </div>
                  <div className="text-xxs text-electric-cyan/50 mt-1">{tiltMeter.message}</div>
                </div>

                {/* MMR Velocity */}
                <div className="text-center">
                  <div className="text-xs font-mono text-electric-cyan/60 mb-2 uppercase tracking-wider">MMR Velocity</div>
                  <div className="text-2xl stat-number text-electric-cyan">
                    {todaySession.mmrChange > 0 ? '+' : ''}{todaySession.mmrChange}
                  </div>
                  <div className="text-xxs text-electric-cyan/50 mt-1">Per Session</div>
                </div>

                {/* Performance Index */}
                <div className="text-center">
                  <div className="text-xs font-mono text-electric-cyan/60 mb-2 uppercase tracking-wider">PEI Score</div>
                  <div className={cn(
                    "text-2xl stat-number",
                    performanceIndex.score >= 80 && "text-performance-excellent",
                    performanceIndex.score >= 60 && performanceIndex.score < 80 && "text-performance-good",
                    performanceIndex.score >= 40 && performanceIndex.score < 60 && "text-performance-average",
                    performanceIndex.score < 40 && "text-performance-terrible"
                  )}>
                    {performanceIndex.score}
                  </div>
                  <div className="text-xxs text-electric-cyan/50 mt-1">Grade: {performanceIndex.grade}</div>
                </div>

                {/* Streak Status */}
                <div className="text-center">
                  <div className="text-xs font-mono text-electric-cyan/60 mb-2 uppercase tracking-wider">Streak</div>
                  <div className="flex items-center justify-center">
                    <Flame className={cn(
                      "w-6 h-6 mr-1",
                      todaySession.currentStreak > 0 ? "text-neon-green" : "text-electric-cyan/30"
                    )} />
                    <span className="text-xl stat-number text-electric-cyan">
                      {Math.abs(todaySession.currentStreak)}
                    </span>
                  </div>
                  <div className="text-xxs text-electric-cyan/50 mt-1">
                    {todaySession.currentStreak > 0 ? 'Wins' : todaySession.currentStreak < 0 ? 'Losses' : 'None'}
                  </div>
                </div>

                {/* Action Recommendation */}
                <div className="text-center">
                  <div className="text-xs font-mono text-electric-cyan/60 mb-2 uppercase tracking-wider">Action</div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "px-3 py-2 rounded-lg font-bold text-xs border-2 transition-all",
                      tiltMeter.status === 'flow' && "bg-neon-green/20 border-neon-green text-neon-green hover:bg-neon-green/30",
                      tiltMeter.status === 'good' && "bg-electric-cyan/20 border-electric-cyan text-electric-cyan hover:bg-electric-cyan/30",
                      tiltMeter.status === 'neutral' && "bg-neon-yellow/20 border-neon-yellow text-neon-yellow hover:bg-neon-yellow/30",
                      tiltMeter.status === 'warning' && "bg-performance-poor/20 border-performance-poor text-performance-poor hover:bg-performance-poor/30",
                      tiltMeter.status === 'danger' && "bg-neon-red/20 border-neon-red text-neon-red hover:bg-neon-red/30 animate-pulse"
                    )}
                  >
                    {tiltMeter.status === 'flow' && 'QUEUE UP!'}
                    {tiltMeter.status === 'good' && 'KEEP GOING'}
                    {tiltMeter.status === 'neutral' && 'CONTINUE'}
                    {tiltMeter.status === 'warning' && 'CAREFUL'}
                    {tiltMeter.status === 'danger' && 'STOP NOW'}
                  </motion.button>
                  <div className="text-xxs text-electric-cyan/50 mt-1">Recommended</div>
                </div>
              </div>
            </motion.div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreMetrics.slice(0, 4).map((metric, index) => {
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
                    className="glass-card p-4 min-h-[140px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {metric.trend === 'up' && <ArrowUp className="w-3 h-3 text-neon-green" />}
                        {metric.trend === 'down' && <ArrowDown className="w-3 h-3 text-neon-red" />}
                        {metric.trend === 'same' && <Minus className="w-3 h-3 text-electric-cyan/50" />}
                      </div>
                    </div>
                    <p className="text-electric-cyan/80 text-xs font-mono uppercase tracking-wider mb-1">{metric.label}</p>
                    {isLoading ? (
                      <div className="skeleton h-6 w-12 rounded mb-1"></div>
                    ) : (
                      <p className="text-xl stat-number text-white mb-1">
                        {typeof metric.value === 'number' ? (
                          <AnimatedNumber value={metric.value} suffix={metric.suffix || ''} />
                        ) : (
                          metric.value
                        )}
                      </p>
                    )}
                    <p className={`text-xxs font-mono ${
                      metric.trend === 'up' ? 'text-neon-green' : 
                      metric.trend === 'down' ? 'text-neon-red' : 'text-electric-cyan/50'
                    }`}>
                      {metric.trend === 'up' ? '↗ Improving' : 
                       metric.trend === 'down' ? '↘ Declining' : '→ Stable'}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* MMR Analytics */}
            <motion.div
              variants={cardAnimation}
              className="glass-card p-6 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="command-header text-lg">MMR PROGRESSION ANALYSIS</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-electric-cyan rounded-full"></div>
                    <span className="text-xs font-mono text-electric-cyan/60">Solo Queue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-neon-purple rounded-full"></div>
                    <span className="text-xs font-mono text-electric-cyan/60">Party Queue</span>
                  </div>
                </div>
              </div>
              {loading.ratings ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="skeleton h-32 w-32 rounded-xl"></div>
                </div>
              ) : mmrHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={mmrHistory}>
                    <defs>
                      <linearGradient id="soloGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00D9FF" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                    <XAxis dataKey="date" stroke="#00D9FF" fontSize={12} />
                    <YAxis stroke="#00D9FF" fontSize={12} domain={['dataMin - 100', 'dataMax + 100']} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(26, 26, 26, 0.9)',
                        border: '1px solid rgba(0, 217, 255, 0.3)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(20px)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="solo"
                      stroke="#00D9FF"
                      strokeWidth={3}
                      dot={{ fill: '#00D9FF', strokeWidth: 2, r: 4 }}
                      fill="url(#soloGradient)"
                    />
                    {mmrHistory.some(d => d.party > 0) && (
                      <Line
                        type="monotone"
                        dataKey="party"
                        stroke="#9370DB"
                        strokeWidth={2}
                        dot={{ fill: '#9370DB', strokeWidth: 2, r: 4 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <Activity className="w-16 h-16 text-electric-cyan/30 mx-auto mb-4" />
                    <h3 className="text-lg font-header text-white mb-2">NO MMR DATA</h3>
                    <p className="text-electric-cyan/50 text-sm">
                      MMR tracking data is not available for this operative.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Panel - Secondary Analytics */}
          <div className="xl:col-span-4 col-span-1 space-y-6">
            
            {/* Hero Pool Analytics */}
            <motion.div
              variants={cardAnimation}
              className="glass-card p-6 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="command-header text-lg">HERO MASTERY</h3>
                <Shield className="w-5 h-5 text-electric-cyan" />
              </div>
              
              {loading.heroes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="skeleton w-12 h-12 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="skeleton h-4 w-24 rounded mb-2"></div>
                        <div className="skeleton h-3 w-16 rounded"></div>
                      </div>
                      <div className="skeleton h-6 w-12 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transformedHeroStats.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {transformedHeroStats.slice(0, 8).map((hero, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-2 rounded-lg bg-space-medium/20 hover:bg-space-light/30 transition-all"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-electric-cyan to-electric-blue rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
                        {hero.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-header text-sm">{hero.name}</h4>
                        <p className="text-electric-cyan/60 text-xs font-mono">
                          {hero.matches} games • {hero.winrate}% WR
                        </p>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        hero.winrate >= 70 ? 'bg-neon-green/20 text-neon-green' : 
                        hero.winrate >= 55 ? 'bg-electric-cyan/20 text-electric-cyan' : 
                        hero.winrate >= 45 ? 'bg-neon-yellow/20 text-neon-yellow' : 
                        'bg-neon-red/20 text-neon-red'
                      )}>
                        {hero.winrate >= 70 ? 'S' : 
                         hero.winrate >= 55 ? 'A' : 
                         hero.winrate >= 45 ? 'B' : 'C'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <Shield className="w-16 h-16 text-electric-cyan/30 mx-auto mb-4" />
                    <h3 className="text-lg font-header text-white mb-2">NO HERO DATA</h3>
                    <p className="text-electric-cyan/50 text-sm">
                      Hero statistics are not available for this operative.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Recent Match Timeline */}
            <motion.div
              variants={cardAnimation}
              className="glass-card p-6 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="command-header text-lg">MATCH TIMELINE</h3>
                <Swords className="w-5 h-5 text-electric-cyan" />
              </div>
              
              {loading.matches ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-2">
                      <div className="skeleton w-8 h-8 rounded-full"></div>
                      <div className="flex-1">
                        <div className="skeleton h-4 w-32 rounded mb-1"></div>
                        <div className="skeleton h-3 w-24 rounded"></div>
                      </div>
                      <div className="skeleton h-6 w-16 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {recentMatches.slice(0, 10).map((match, index) => {
                    const isWin = match.radiant_win === (match.player_slot < 128);
                    const kda = `${match.kills}/${match.deaths}/${match.assists}`;
                    const duration = Math.floor(match.duration / 60);
                    
                    return (
                      <motion.div
                        key={match.match_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded-lg border-l-4 transition-all hover:bg-space-light/20",
                          isWin ? "border-l-neon-green bg-neon-green/5" : "border-l-neon-red bg-neon-red/5"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          isWin ? "bg-neon-green/20 text-neon-green" : "bg-neon-red/20 text-neon-red"
                        )}>
                          {isWin ? 'W' : 'L'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white text-sm font-mono">{kda}</span>
                            <span className="text-electric-cyan/60 text-xs">•</span>
                            <span className="text-electric-cyan/60 text-xs">{duration}m</span>
                          </div>
                          <p className="text-electric-cyan/60 text-xs">
                            {match.hero_id ? `Hero ${match.hero_id}` : 'Unknown Hero'}
                          </p>
                        </div>
                        <div className="text-xs font-mono text-electric-cyan/60">
                          {new Date(match.start_time * 1000).toLocaleDateString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <Swords className="w-16 h-16 text-electric-cyan/30 mx-auto mb-4" />
                    <h3 className="text-lg font-header text-white mb-2">NO MATCH DATA</h3>
                    <p className="text-electric-cyan/50 text-sm">
                      Recent match history is not available.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          </div>
        </div>
      </motion.div>
    </RadixTooltip.Provider>
  );
};

// Use AntDashboard as the main dashboard component
const PlayerDashboard = ({ onMatchClick }) => {
  return <AntDashboard onMatchClick={onMatchClick} />;
};

// Loading Component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-space-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 bg-gradient-to-br from-electric-cyan to-electric-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="command-header text-xl mb-2">LOADING DOTA 2 COMMAND CENTER</h2>
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-electric-cyan rounded-full"
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
  
  if (path === '/asset-test') {
    // Asset verification test page (no auth required)
    return <AssetTest />;
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
          console.log('Processing Steam authentication callback...');
          await handleSteamCallback(urlParams);
          console.log('Steam authentication completed, redirecting...');
          setIsComplete(true);
          
          // Force redirect to main app after a brief delay
          setTimeout(() => {
            console.log('Redirecting to main app...');
            window.location.replace('/');
          }, 1000);
        } else {
          // Not a Steam callback, redirect to main page
          console.log('Not a Steam callback, redirecting to main page');
          window.location.replace('/');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        setProcessingError(error);
      }
    };

    processCallback();
  }, [hasProcessed, handleSteamCallback]);

  const handleSwitchToDevMode = () => {
    toggleAuthMode(); // Switch to development mode
    window.history.replaceState({}, '', '/');
  };

  const finalError = error || processingError;

  return (
    <div className="min-h-screen bg-space-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center glass-card p-8 max-w-md"
      >
        {finalError ? (
          <>
            {finalError.switchToDevMode ? (
              <Gamepad2 className="w-16 h-16 text-electric-cyan mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-neon-red mx-auto mb-4" />
            )}
            <h2 className="command-header text-xl mb-2">
              {finalError.switchToDevMode ? 'Steam Login Successful!' : 'Authentication Failed'}
            </h2>
            <p className={`text-sm mb-6 ${finalError.switchToDevMode ? 'text-electric-cyan/80' : 'text-neon-red/80'}`}>
              {finalError.message}
            </p>
            <div className="space-y-3">
              {finalError.switchToDevMode && (
                <button
                  onClick={handleSwitchToDevMode}
                  className="w-full bg-gradient-to-r from-neon-green/20 to-electric-cyan/20 border-2 border-neon-green text-neon-green px-6 py-3 rounded-lg transition-all font-header font-bold hover:bg-neon-green/30"
                >
                  SWITCH TO DEVELOPMENT MODE
                </button>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-space-medium/50 border-2 border-electric-cyan/30 text-electric-cyan px-6 py-3 rounded-lg transition-all font-header font-bold hover:bg-space-medium/70"
              >
                RETURN TO LOGIN
              </button>
            </div>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
            <h2 className="command-header text-xl mb-2">AUTHENTICATION COMPLETE!</h2>
            <p className="text-electric-cyan/80 text-sm mb-4">Redirecting to command center...</p>
            <div className="flex items-center justify-center space-x-2">
              <ChevronRight className="w-5 h-5 text-neon-green" />
              <span className="text-neon-green text-sm font-mono">LOADING DASHBOARD</span>
            </div>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-electric-cyan to-electric-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="command-header text-xl mb-2">PROCESSING AUTHENTICATION</h2>
            <p className="text-electric-cyan/80 text-sm mb-4">Fetching your Steam and Dota 2 data...</p>
            <div className="flex items-center justify-center space-x-2">
              <LoaderCircle className="w-5 h-5 animate-spin text-electric-cyan" />
              <span className="text-electric-cyan text-sm font-mono">PLEASE WAIT</span>
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
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleMatchClick = (matchId) => {
    setSelectedMatchId(matchId);
    setCurrentPage('match-analysis');
  };

  const handleBackToDashboard = () => {
    setSelectedMatchId(null);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PlayerDashboard onMatchClick={handleMatchClick} />;
      case 'match-analysis':
        return selectedMatchId ? (
          <MatchAnalysis 
            matchId={selectedMatchId} 
            onBack={handleBackToDashboard} 
          />
        ) : (
          <PlayerDashboard onMatchClick={handleMatchClick} />
        );
      case 'matches':
        return <div className="p-6 text-electric-cyan font-header">MATCHES PAGE COMING SOON...</div>;
      case 'heroes':
        return <div className="p-6 text-electric-cyan font-header">HEROES PAGE COMING SOON...</div>;
      case 'live':
        return <div className="p-6 text-electric-cyan font-header">LIVE GAME PAGE COMING SOON...</div>;
      case 'draft':
        return <div className="p-6 text-electric-cyan font-header">DRAFT PAGE COMING SOON...</div>;
      case 'pro':
        return <div className="p-6 text-electric-cyan font-header">PRO SCENE PAGE COMING SOON...</div>;
      default:
        return <PlayerDashboard onMatchClick={handleMatchClick} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <Layout className="min-h-screen">
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </Layout>
    </DataProvider>
  );
};

// Main App Component with Auth Provider
export default function App() {
  return (
    <ConfigProvider theme={darkTheme}>
      <AntApp>
        <AuthProvider>
          <SimpleRouter />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
