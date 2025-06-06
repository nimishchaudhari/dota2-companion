/**
 * Enhanced Data Caching Service
 * Implements comprehensive match data caching with 1000+ game support
 * Features progressive loading, rate limit management, and intelligent storage
 */

class EnhancedDataCacheService {
  constructor() {
    this.cache = new Map();
    this.requestQueue = {
      high: [],
      medium: [],
      low: [],
      background: []
    };
    this.rateLimitManager = null;
    this.isProcessingQueue = false;
    this.listeners = new Set();
    
    // Cache configuration
    this.cacheConfig = {
      aggregated: { ttl: 5 * 60 * 1000, storage: 'session' }, // 5 minutes
      recentMatches: { ttl: 2 * 60 * 1000, storage: 'session' }, // 2 minutes
      historicalMatches: { ttl: 60 * 60 * 1000, storage: 'local' }, // 1 hour
      enhancedAnalytics: { ttl: 30 * 60 * 1000, storage: 'local' }, // 30 minutes
      staticData: { ttl: 24 * 60 * 60 * 1000, storage: 'local' } // 24 hours
    };

    this.initializeRateLimitManager();
  }

  /**
   * Initialize rate limit management based on API key availability
   */
  initializeRateLimitManager() {
    const hasApiKey = import.meta.env.VITE_OPENDOTA_API_KEY;
    
    this.rateLimitManager = {
      hasApiKey,
      maxConcurrent: hasApiKey ? 10 : 2,
      batchSize: hasApiKey ? 50 : 10,
      delayBetweenBatches: hasApiKey ? 100 : 2000,
      requestsThisMinute: 0,
      maxRequestsPerMinute: hasApiKey ? 1000 : 60,
      lastResetTime: Date.now()
    };
  }

  /**
   * Enhanced data fetching for comprehensive match history
   */
  async fetchEnhancedMatchData(accountId, options = {}) {
    const {
      maxMatches = 1000,
      batchSize = this.rateLimitManager.batchSize,
      priority = 'medium',
      onProgress = () => {}
    } = options;

    const cacheKey = `enhanced_matches_${accountId}`;
    const cached = this.getCacheItem(cacheKey, 'historicalMatches');
    
    if (cached && cached.matches.length >= maxMatches) {
      onProgress({ current: cached.matches.length, total: maxMatches, complete: true });
      return cached;
    }

    // Start progressive fetching
    return this.progressiveFetchMatches(accountId, maxMatches, batchSize, onProgress);
  }

  /**
   * Progressive match fetching with intelligent batching
   */
  async progressiveFetchMatches(accountId, maxMatches, batchSize, onProgress) {
    const result = {
      matches: [],
      totalFetched: 0,
      isComplete: false,
      lastFetchedMatchId: null,
      fetchProgress: { current: 0, total: maxMatches },
      lastUpdated: new Date().toISOString()
    };

    let offset = 0;
    const totalBatches = Math.ceil(maxMatches / batchSize);

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        // Rate limit check
        await this.checkRateLimit();

        const batchMatches = await this.fetchMatchBatch(accountId, offset, batchSize);
        
        if (!batchMatches || batchMatches.length === 0) {
          result.isComplete = true;
          break;
        }

        result.matches.push(...batchMatches);
        result.totalFetched = result.matches.length;
        result.fetchProgress.current = result.totalFetched;
        
        if (batchMatches.length > 0) {
          result.lastFetchedMatchId = batchMatches[batchMatches.length - 1].match_id;
        }

        // Progress callback
        onProgress({
          current: result.totalFetched,
          total: maxMatches,
          batch: batch + 1,
          totalBatches,
          complete: false
        });

        offset += batchSize;

        // Stop if we've reached the desired number of matches
        if (result.totalFetched >= maxMatches) {
          result.isComplete = true;
          break;
        }

        // Delay between batches to respect rate limits
        if (batch < totalBatches - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.rateLimitManager.delayBetweenBatches)
          );
        }
      }

      // Cache the results
      const cacheKey = `enhanced_matches_${accountId}`;
      this.setCacheItem(cacheKey, result, 'historicalMatches');

      onProgress({
        current: result.totalFetched,
        total: maxMatches,
        complete: true
      });

      return result;

    } catch (error) {
      console.error('Progressive match fetching failed:', error);
      throw error;
    }
  }

  /**
   * Fetch a batch of matches with proper API integration
   */
  async fetchMatchBatch(accountId, offset, limit) {
    const url = `https://api.opendota.com/api/players/${accountId}/matches`;
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString()
    });

    // Add API key if available
    const apiKey = import.meta.env.VITE_OPENDOTA_API_KEY;
    if (apiKey) {
      params.append('api_key', apiKey);
    }

    const response = await fetch(`${url}?${params}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.fetchMatchBatch(accountId, offset, limit);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    this.rateLimitManager.requestsThisMinute++;
    return response.json();
  }

  /**
   * Calculate comprehensive hero analytics from match data
   */
  calculateHeroAnalytics(matches, heroId) {
    const heroMatches = matches.filter(match => match.hero_id === heroId);
    
    if (heroMatches.length === 0) {
      return {
        heroId,
        games: 0,
        winRate: 0,
        averageKDA: 0,
        averageGPM: 0,
        averageXPM: 0,
        averageLastHits: 0,
        dataQuality: 'no-data'
      };
    }

    // Calculate comprehensive statistics
    const stats = {
      heroId,
      games: heroMatches.length,
      wins: heroMatches.filter(m => (m.radiant_win && m.player_slot < 128) || (!m.radiant_win && m.player_slot >= 128)).length,
      totalKills: heroMatches.reduce((sum, m) => sum + (m.kills || 0), 0),
      totalDeaths: heroMatches.reduce((sum, m) => sum + (m.deaths || 1), 0), // Avoid division by zero
      totalAssists: heroMatches.reduce((sum, m) => sum + (m.assists || 0), 0),
      totalGPM: heroMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0),
      totalXPM: heroMatches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0),
      totalLastHits: heroMatches.reduce((sum, m) => sum + (m.last_hits || 0), 0),
      totalHeroDamage: heroMatches.reduce((sum, m) => sum + (m.hero_damage || 0), 0)
    };

    // Calculate averages and derived metrics
    const analytics = {
      heroId,
      games: stats.games,
      winRate: (stats.wins / stats.games) * 100,
      averageKDA: (stats.totalKills + stats.totalAssists) / stats.totalDeaths,
      averageGPM: stats.totalGPM / stats.games,
      averageXPM: stats.totalXPM / stats.games,
      averageLastHits: stats.totalLastHits / stats.games,
      averageHeroDamage: stats.totalHeroDamage / stats.games,
      lastUpdated: new Date().toISOString(),
      dataQuality: this.assessDataQuality(heroMatches),
      
      // Recent performance (last 20% of games)
      recentPerformance: this.calculateRecentPerformance(heroMatches),
      
      // Performance trends
      performanceTrends: this.calculatePerformanceTrends(heroMatches),
      
      // Role analysis
      roleAnalysis: this.analyzePlayerRole(heroMatches)
    };

    return analytics;
  }

  /**
   * Calculate recent performance metrics
   */
  calculateRecentPerformance(matches) {
    const recentCount = Math.max(1, Math.floor(matches.length * 0.2)); // Last 20% of games
    const recentMatches = matches.slice(-recentCount);
    
    if (recentMatches.length === 0) return null;

    const recentWins = recentMatches.filter(m => 
      (m.radiant_win && m.player_slot < 128) || (!m.radiant_win && m.player_slot >= 128)
    ).length;

    return {
      games: recentMatches.length,
      wins: recentWins,
      winRate: (recentWins / recentMatches.length) * 100,
      averageGPM: recentMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / recentMatches.length,
      momentum: recentWins / recentMatches.length > 0.6 ? 'positive' : 
                recentWins / recentMatches.length < 0.4 ? 'negative' : 'neutral'
    };
  }

  /**
   * Calculate performance trends over time
   */
  calculatePerformanceTrends(matches) {
    if (matches.length < 10) return null;

    const halfPoint = Math.floor(matches.length / 2);
    const earlyMatches = matches.slice(0, halfPoint);
    const lateMatches = matches.slice(halfPoint);

    const earlyAvgGPM = earlyMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / earlyMatches.length;
    const lateAvgGPM = lateMatches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / lateMatches.length;
    
    const earlyWinRate = earlyMatches.filter(m => 
      (m.radiant_win && m.player_slot < 128) || (!m.radiant_win && m.player_slot >= 128)
    ).length / earlyMatches.length;
    
    const lateWinRate = lateMatches.filter(m => 
      (m.radiant_win && m.player_slot < 128) || (!m.radiant_win && m.player_slot >= 128)
    ).length / lateMatches.length;

    return {
      gpmTrend: ((lateAvgGPM - earlyAvgGPM) / earlyAvgGPM * 100).toFixed(1) + '%',
      winRateTrend: ((lateWinRate - earlyWinRate) * 100).toFixed(1) + '%',
      improving: lateAvgGPM > earlyAvgGPM && lateWinRate > earlyWinRate
    };
  }

  /**
   * Analyze player role based on match patterns
   */
  analyzePlayerRole(matches) {
    if (matches.length === 0) return { role: 'Unknown', confidence: 0 };

    const averageGPM = matches.reduce((sum, m) => sum + (m.gold_per_min || 0), 0) / matches.length;
    const averageXPM = matches.reduce((sum, m) => sum + (m.xp_per_min || 0), 0) / matches.length;
    const averageLastHits = matches.reduce((sum, m) => sum + (m.last_hits || 0), 0) / matches.length;

    // Role classification based on performance patterns
    if (averageGPM > 500 && averageLastHits > 200) {
      return { role: 'Core', confidence: 85, reasoning: 'High farm priority' };
    } else if (averageGPM < 300 && averageLastHits < 50) {
      return { role: 'Support', confidence: 80, reasoning: 'Low farm priority' };
    } else {
      return { role: 'Semi-Core', confidence: 60, reasoning: 'Mixed farm patterns' };
    }
  }

  /**
   * Assess data quality based on available information
   */
  assessDataQuality(matches) {
    if (matches.length === 0) return 'no-data';
    if (matches.length < 5) return 'insufficient';
    if (matches.length < 20) return 'limited';
    if (matches.length < 50) return 'good';
    return 'excellent';
  }

  /**
   * Rate limit checking and management
   */
  async checkRateLimit() {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.rateLimitManager.lastResetTime > 60000) {
      this.rateLimitManager.requestsThisMinute = 0;
      this.rateLimitManager.lastResetTime = now;
    }

    // Check if we're approaching rate limits
    if (this.rateLimitManager.requestsThisMinute >= this.rateLimitManager.maxRequestsPerMinute - 5) {
      const waitTime = 60000 - (now - this.rateLimitManager.lastResetTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Cache management with TTL and storage strategies
   */
  getCacheItem(key, type = 'aggregated') {
    const config = this.cacheConfig[type];
    const storage = config.storage === 'local' ? localStorage : sessionStorage;
    
    try {
      const item = storage.getItem(key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      
      // Check TTL
      if (Date.now() - timestamp > config.ttl) {
        storage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error getting cache item ${key}:`, error);
      return null;
    }
  }

  setCacheItem(key, data, type = 'aggregated') {
    const config = this.cacheConfig[type];
    const storage = config.storage === 'local' ? localStorage : sessionStorage;
    
    try {
      const item = {
        data,
        timestamp: Date.now()
      };
      storage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Error setting cache item ${key}:`, error);
    }
  }

  /**
   * Clear expired cache items
   */
  clearExpiredCache() {
    const storages = [localStorage, sessionStorage];
    
    storages.forEach(storage => {
      const keys = Object.keys(storage);
      keys.forEach(key => {
        try {
          const item = storage.getItem(key);
          if (item) {
            const { timestamp } = JSON.parse(item);
            // If older than 24 hours, remove
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
              storage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid item, remove it
          storage.removeItem(key);
        }
      });
    });
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const stats = {
      localStorage: {
        items: Object.keys(localStorage).length,
        size: new Blob(Object.values(localStorage)).size
      },
      sessionStorage: {
        items: Object.keys(sessionStorage).length,
        size: new Blob(Object.values(sessionStorage)).size
      },
      rateLimitStatus: {
        ...this.rateLimitManager,
        nextReset: new Date(this.rateLimitManager.lastResetTime + 60000).toISOString()
      }
    };

    return stats;
  }

  /**
   * Event listener system for cache updates
   */
  addEventListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in cache listener:', error);
      }
    });
  }
}

// Create singleton instance
const enhancedDataCacheService = new EnhancedDataCacheService();

// Initialize cache cleanup on startup
enhancedDataCacheService.clearExpiredCache();

export default enhancedDataCacheService;