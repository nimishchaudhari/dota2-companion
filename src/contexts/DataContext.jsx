import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import authService from '../services/auth.service.js';
import enhancedDataCacheService from '../services/enhancedDataCache.service.js';

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
    // Enhanced data structures
    detailedMatches: {
      matches: [],
      totalFetched: 0,
      lastFetchedMatchId: null,
      isComplete: false,
      fetchProgress: { current: 0, total: 0 },
      lastUpdated: null
    },
    heroAnalytics: {},
    enhancedAnalytics: {},
    performanceMetrics: {
      trends: {},
      streaks: {},
      recentForm: {},
      seasonal: {}
    }
  });
  
  const [loading, setLoading] = useState({
    matches: false,
    heroes: false,
    stats: false,
    ratings: false,
    totals: false,
    enhanced: false,
    detailedMatches: false,
    heroAnalytics: false,
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
      },
      
      // Enhanced analytics functions
      loadEnhancedHeroData: async (heroId) => {
        if (!user?.accountId) return null;
        
        setLoading(prev => ({ ...prev, enhanced: true }));
        
        try {
          // First ensure we have detailed match data
          const ensureDetailedMatchData = async (maxMatches = 1000) => {
            if (!user?.accountId) return { matches: [] };
            
            // Check if we already have sufficient data
            if (data.detailedMatches.matches.length >= maxMatches) {
              return data.detailedMatches;
            }

            setLoading(prev => ({ ...prev, detailedMatches: true }));
            
            try {
              const enhancedMatches = await enhancedDataCacheService.fetchEnhancedMatchData(
                user.accountId,
                {
                  maxMatches,
                  onProgress: (progress) => {
                    setData(prev => ({
                      ...prev,
                      detailedMatches: {
                        ...prev.detailedMatches,
                        fetchProgress: progress
                      }
                    }));
                  }
                }
              );

              setData(prev => ({
                ...prev,
                detailedMatches: enhancedMatches
              }));

              return enhancedMatches;
            } catch (error) {
              console.error('Failed to fetch detailed match data:', error);
              setErrors(prev => ({ ...prev, detailedMatches: error.message }));
              return { matches: [] };
            } finally {
              setLoading(prev => ({ ...prev, detailedMatches: false }));
            }
          };
          
          const detailedMatches = await ensureDetailedMatchData();
          
          // Calculate hero analytics from real match data
          const heroAnalytics = enhancedDataCacheService.calculateHeroAnalytics(
            detailedMatches.matches, 
            heroId
          );
          
          setData(prev => ({
            ...prev,
            heroAnalytics: {
              ...prev.heroAnalytics,
              [heroId]: heroAnalytics
            }
          }));
          
          return heroAnalytics;
        } catch (error) {
          console.error('Failed to load enhanced hero data:', error);
          setErrors(prev => ({ ...prev, enhanced: error.message }));
          return null;
        } finally {
          setLoading(prev => ({ ...prev, enhanced: false }));
        }
      },


      // Refresh all hero analytics
      refreshAllHeroAnalytics: async () => {
        if (!user?.accountId || !data.heroStats) return;

        setLoading(prev => ({ ...prev, heroAnalytics: true }));

        try {
          // Get detailed matches if available, otherwise use basic data
          let detailedMatches = data.detailedMatches;
          const newHeroAnalytics = {};

          // Calculate analytics for all heroes with sufficient games
          data.heroStats.forEach(heroStat => {
            if (heroStat.games >= 5) { // Only analyze heroes with 5+ games
              const analytics = enhancedDataCacheService.calculateHeroAnalytics(
                detailedMatches.matches,
                heroStat.hero_id
              );
              newHeroAnalytics[heroStat.hero_id] = analytics;
            }
          });

          setData(prev => ({
            ...prev,
            heroAnalytics: newHeroAnalytics
          }));

          return newHeroAnalytics;
        } catch (error) {
          console.error('Failed to refresh hero analytics:', error);
          setErrors(prev => ({ ...prev, heroAnalytics: error.message }));
          return {};
        } finally {
          setLoading(prev => ({ ...prev, heroAnalytics: false }));
        }
      },

      // Get enhanced hero data with fallback to basic data
      getEnhancedHeroData: (heroId) => {
        // Check for enhanced analytics first
        if (data.heroAnalytics[heroId]) {
          return {
            ...data.heroAnalytics[heroId],
            source: 'enhanced',
            isEnhanced: true
          };
        }

        // Fallback to basic hero stats
        const basicHeroStat = data.heroStats?.find(h => h.hero_id === heroId);
        if (basicHeroStat) {
          return {
            heroId,
            games: basicHeroStat.games || 0,
            winRate: basicHeroStat.games > 0 ? (basicHeroStat.win / basicHeroStat.games) * 100 : 0,
            averageKDA: basicHeroStat.games > 0 ? 
              (basicHeroStat.sum_kills + basicHeroStat.sum_assists) / Math.max(basicHeroStat.sum_deaths, 1) : 0,
            averageGPM: basicHeroStat.games > 0 ? basicHeroStat.sum_gold_per_min / basicHeroStat.games : 0,
            averageXPM: basicHeroStat.games > 0 ? basicHeroStat.sum_xp_per_min / basicHeroStat.games : 0,
            source: 'basic',
            isEnhanced: false,
            dataQuality: basicHeroStat.games >= 5 ? 'limited' : 'insufficient'
          };
        }

        return null;
      },
      
      getDataCompleteness: (heroId) => {
        if (!data.heroStats) return { score: 0, status: 'no-data' };
        
        const heroStat = data.heroStats.find(h => h.hero_id === heroId);
        if (!heroStat) return { score: 0, status: 'no-data' };
        
        let score = 0;
        const checks = {
          basicData: heroStat.games > 0 && heroStat.win != null,
          performanceData: heroStat.sum_gold_per_min != null && heroStat.sum_xp_per_min != null,
          detailedData: heroStat.sum_last_hits != null && heroStat.sum_hero_damage != null,
          recentMatches: data.recentMatches?.some(m => m.hero_id === heroId),
          enhancedData: data.enhancedAnalytics?.[heroId] != null
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        let status = 'basic';
        if (score >= 4) status = 'rich';
        else if (score >= 3) status = 'enhanced';
        else if (score >= 2) status = 'partial';
        
        return { score, status, checks };
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