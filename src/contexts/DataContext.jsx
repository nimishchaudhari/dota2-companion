import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import authService from '../services/auth.service.js';

// Data Context
const DataContext = createContext(null);

// Data Provider Component
export const DataProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState({
    recentMatches: null,
    heroStats: null,
    winLoss: null,
    ratings: null,
    playerTotals: null,
    heroes: null, // Hero mapping data
  });
  
  const [loading, setLoading] = useState({
    matches: false,
    heroes: false,
    stats: false,
    ratings: false,
    totals: false,
  });
  
  const [errors, setErrors] = useState({});

  const resetData = () => {
    setData({
      recentMatches: null,
      heroStats: null,
      winLoss: null,
      ratings: null,
      playerTotals: null,
      heroes: null,
    });
    setErrors({});
  };

  const fetchAllData = useCallback(async () => {
    if (!user?.accountId) return;

    const accountId = user.accountId;
    
    // Set all loading states
    setLoading({
      matches: true,
      heroes: true,
      stats: true,
      ratings: true,
      totals: true,
    });

    try {
      // Fetch hero mapping first (needed for other data)
      const heroesPromise = fetchHeroes();
      
      // Fetch all data in parallel
      const [
        recentMatches,
        heroStats,
        winLoss,
        ratings,
        playerTotals,
        heroes
      ] = await Promise.allSettled([
        authService.fetchRecentMatches(accountId),
        authService.fetchHeroStats(accountId),
        authService.fetchWinLoss(accountId),
        authService.fetchRatings(accountId),
        authService.fetchPlayerTotals(accountId),
        heroesPromise
      ]);

      // Update data with successful results
      setData({
        recentMatches: recentMatches.status === 'fulfilled' ? recentMatches.value : null,
        heroStats: heroStats.status === 'fulfilled' ? heroStats.value : null,
        winLoss: winLoss.status === 'fulfilled' ? winLoss.value : null,
        ratings: ratings.status === 'fulfilled' ? ratings.value : null,
        playerTotals: playerTotals.status === 'fulfilled' ? playerTotals.value : null,
        heroes: heroes.status === 'fulfilled' ? heroes.value : null,
      });

      // Handle errors
      const newErrors = {};
      if (recentMatches.status === 'rejected') newErrors.matches = recentMatches.reason?.message;
      if (heroStats.status === 'rejected') newErrors.heroes = heroStats.reason?.message;
      if (winLoss.status === 'rejected') newErrors.stats = winLoss.reason?.message;
      if (ratings.status === 'rejected') newErrors.ratings = ratings.reason?.message;
      if (playerTotals.status === 'rejected') newErrors.totals = playerTotals.reason?.message;
      
      setErrors(newErrors);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setErrors({ general: 'Failed to load dashboard data' });
    } finally {
      setLoading({
        matches: false,
        heroes: false,
        stats: false,
        ratings: false,
        totals: false,
      });
    }
  }, [user?.accountId]);

  // Fetch all dashboard data when user changes
  useEffect(() => {
    if (isAuthenticated && user?.accountId) {
      fetchAllData();
    } else {
      resetData();
    }
  }, [isAuthenticated, user?.accountId, fetchAllData]);

  const fetchHeroes = async () => {
    try {
      const cached = authService.getCacheItem('heroes_mapping');
      if (cached) return cached;

      // Use auth service method which includes API key
      const heroesArray = await authService.fetchHeroes();
      const heroMap = heroesArray.reduce((acc, hero) => {
        acc[hero.id] = hero;
        return acc;
      }, {});
      
      // Cache both the array and the map
      const heroData = { array: heroesArray, map: heroMap };
      authService.setCacheItem('heroes_mapping', heroData);
      return heroData;
    } catch (error) {
      console.error('Failed to fetch heroes:', error);
      return { array: [], map: {} };
    }
  };

  const refreshData = async () => {
    if (!user?.accountId) return;
    
    // Clear cache for this user
    authService.cache.delete(`player_${user.accountId}`);
    
    // Fetch fresh data
    await fetchAllData();
  };

  const refreshSection = async (section) => {
    if (!user?.accountId) return;

    const accountId = user.accountId;
    setLoading(prev => ({ ...prev, [section]: true }));

    try {
      let result = null;
      
      switch (section) {
        case 'matches':
          result = await authService.fetchRecentMatches(accountId);
          setData(prev => ({ ...prev, recentMatches: result }));
          break;
        case 'heroes':
          result = await authService.fetchHeroStats(accountId);
          setData(prev => ({ ...prev, heroStats: result }));
          break;
        case 'stats':
          result = await authService.fetchWinLoss(accountId);
          setData(prev => ({ ...prev, winLoss: result }));
          break;
        case 'ratings':
          result = await authService.fetchRatings(accountId);
          setData(prev => ({ ...prev, ratings: result }));
          break;
        case 'totals':
          result = await authService.fetchPlayerTotals(accountId);
          setData(prev => ({ ...prev, playerTotals: result }));
          break;
      }

      // Clear error for this section
      setErrors(prev => ({ ...prev, [section]: null }));

    } catch (error) {
      console.error(`Failed to refresh ${section}:`, error);
      setErrors(prev => ({ ...prev, [section]: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  // Computed values
  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <DataContext.Provider value={{
      // Raw data
      ...data,
      // Provide heroes as both array and map for compatibility
      heroes: data.heroes?.array || [],
      heroMap: data.heroes?.map || {},
      
      // Loading states
      loading,
      isLoading,
      
      // Error states
      errors,
      hasErrors,
      
      // Actions
      refreshData,
      refreshSection,
      
      // Helper functions
      getHeroName: (heroId) => {
        const heroMap = data.heroes?.map || {};
        return heroMap[heroId]?.localized_name || heroMap[heroId]?.name || `Hero ${heroId}`;
      },
      
      getHeroIcon: (heroId) => {
        const heroMap = data.heroes?.map || {};
        const hero = heroMap[heroId];
        return hero ? `https://cdn.dota2.com${hero.icon}` : null;
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;