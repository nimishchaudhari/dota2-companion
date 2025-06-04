import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Home, Swords, Shield, Users, Trophy, Settings, Menu, X, ChevronRight, 
  TrendingUp, Clock, Target, Activity, Star, Zap,
  User, Gamepad2
} from 'lucide-react';


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

const staggerContainer = {
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
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'matches', icon: Swords, label: 'Matches' },
    { id: 'heroes', icon: Shield, label: 'Heroes' },
    { id: 'live', icon: Activity, label: 'Live Game' },
    { id: 'pro', icon: Trophy, label: 'Pro Scene' },
    { id: 'draft', icon: Users, label: 'Draft' }
  ];

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
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-300">PlayerX_ProGamer#1234</span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
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

// Login Page
const LoginPage = ({ onLogin }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden"
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
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
        >
          <Shield className="w-20 h-20 text-white" />
        </motion.div>
        
        <h1 className="text-5xl font-bold text-white mb-4">
          Dota 2 Companion
        </h1>
        <p className="text-gray-400 mb-8 text-lg">Your Ultimate Esports Companion</p>
        
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 212, 255, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogin}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center space-x-3 mx-auto hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
        >
          <Gamepad2 className="w-6 h-6" />
          <span>Sign in with Steam</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Player Dashboard
const PlayerDashboard = () => {
  const mmrData = [
    { date: 'May 5', mmr: 5800 },
    { date: 'May 10', mmr: 5950 },
    { date: 'May 15', mmr: 5900 },
    { date: 'May 20', mmr: 6100 },
    { date: 'May 25', mmr: 6050 },
    { date: 'May 30', mmr: 6250 },
    { date: 'Jun 4', mmr: 6250 },
  ];

  const recentMatches = [
    { id: 1, hero: 'SF', result: 'Victory', kda: '10/2/15', mode: 'All Pick', duration: '35:20' },
    { id: 2, hero: 'AM', result: 'Defeat', kda: '5/8/12', mode: 'Ranked', duration: '42:15' },
    { id: 3, hero: 'JUG', result: 'Victory', kda: '15/3/22', mode: 'All Pick', duration: '38:45' },
    { id: 4, hero: 'INV', result: 'Victory', kda: '12/4/18', mode: 'Turbo', duration: '25:10' },
  ];

  const signatureHeroes = [
    { name: 'Shadow Fiend', matches: 75, winrate: 62 },
    { name: 'Anti-Mage', matches: 68, winrate: 58 },
    { name: 'Juggernaut', matches: 54, winrate: 65 },
    { name: 'Invoker', matches: 42, winrate: 71 },
    { name: 'Phantom Assassin', matches: 38, winrate: 55 },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-4 md:p-6 max-w-7xl mx-auto"
    >
      {/* Profile Summary */}
      <motion.div
        variants={cardAnimation}
        whileHover="hover"
        className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 mb-6 border border-gray-700"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <User className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">PlayerX_ProGamer</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-300">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Rank: Immortal</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-cyan-400" />
                <span>MMR: <AnimatedNumber value={6250} /></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 bg-blue-600 rounded" />
                <span>Europe West</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Win Rate', value: 58.3, suffix: '%', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
          { label: 'Avg. KDA', value: '4.5/2.1/9.8', icon: Target, color: 'from-blue-500 to-cyan-600' },
          { label: 'Preferred Role', value: 'Mid Lane', icon: Zap, color: 'from-purple-500 to-pink-600' },
          { label: 'Total Matches', value: 1847, icon: Swords, color: 'from-orange-500 to-red-600' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            variants={cardAnimation}
            whileHover="hover"
            className="bg-gray-800 rounded-xl p-5 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {typeof stat.value === 'number' ? (
                <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
              ) : (
                stat.value
              )}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MMR Trend */}
        <motion.div
          variants={cardAnimation}
          whileHover="hover"
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>MMR Trend - Last 30 Days</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mmrData}>
              <defs>
                <linearGradient id="mmrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="date" stroke="#8b92a5" />
              <YAxis stroke="#8b92a5" domain={[5700, 6300]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1823',
                  border: '1px solid #1a2332',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="mmr"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#mmrGradient)"
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Signature Heroes */}
        <motion.div
          variants={cardAnimation}
          whileHover="hover"
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <span>Signature Heroes</span>
          </h3>
          <div className="space-y-3">
            {signatureHeroes.map((hero, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
                className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                  {hero.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{hero.name}</p>
                  <p className="text-sm text-gray-400">{hero.matches} Matches</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${hero.winrate >= 60 ? 'text-green-400' : 'text-gray-300'}`}>
                    {hero.winrate}%
                  </p>
                  <p className="text-xs text-gray-500">Win Rate</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Matches */}
      <motion.div
        variants={cardAnimation}
        className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span>Recent Matches</span>
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
        
        <div className="space-y-3">
          {recentMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                  {match.hero}
                </div>
                <div>
                  <p className={`font-semibold ${match.result === 'Victory' ? 'text-green-400' : 'text-red-400'}`}>
                    {match.result}
                  </p>
                  <p className="text-sm text-gray-400">KDA: {match.kda}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-300">{match.mode}</p>
                <p className="text-gray-500">{match.duration}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

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

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
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
  );
}