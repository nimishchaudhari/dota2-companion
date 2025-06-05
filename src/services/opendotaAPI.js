// Enhanced OpenDota API service layer for match analysis

class OpenDotaAPIService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_OPENDOTA_API_URL || 'https://api.opendota.com/api';
    this.apiKey = import.meta.env.VITE_OPENDOTA_API_KEY;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
    this.requestQueue = [];
    this.rateLimitDelay = this.apiKey ? 60 : 1000; // 60ms with key, 1s without
  }

  // Build API URL with authentication
  buildApiUrl(endpoint) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.apiKey) {
      url.searchParams.append('api_key', this.apiKey);
    }
    return url.toString();
  }

  // Rate limiting utility
  async rateLimit() {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  // Cache management
  setCacheItem(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCacheItem(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // Generic API fetch with error handling
  async fetchAPI(endpoint, useCache = true) {
    const cacheKey = endpoint;
    
    if (useCache) {
      const cached = this.getCacheItem(cacheKey);
      if (cached) return cached;
    }

    await this.rateLimit();

    try {
      const response = await fetch(this.buildApiUrl(endpoint));
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('[API] Rate limit hit, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.fetchAPI(endpoint, false);
        }
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (useCache) {
        this.setCacheItem(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`[API] Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  // Core match data
  async fetchMatch(matchId) {
    return this.fetchAPI(`/matches/${matchId}`);
  }

  // Player performance benchmarks
  async fetchBenchmarks(heroId) {
    return this.fetchAPI(`/benchmarks?hero_id=${heroId}`);
  }

  // Hero statistics for meta analysis
  async fetchHeroStats() {
    return this.fetchAPI('/heroStats');
  }

  // MMR distribution data
  async fetchDistributions() {
    return this.fetchAPI('/distributions');
  }

  // Player profile data
  async fetchPlayerProfile(accountId) {
    return this.fetchAPI(`/players/${accountId}`);
  }

  // Match logs for detailed analysis (parsed matches only)
  async fetchMatchLogs(matchId) {
    try {
      return await this.fetchAPI(`/matches/${matchId}/logs`);
    } catch (_error) {
      console.warn('[API] Match logs not available (match not parsed)');
      return null;
    }
  }

  // Game constants
  async fetchHeroes() {
    return this.fetchAPI('/heroes');
  }

  async fetchItems() {
    return this.fetchAPI('/constants/items');
  }

  async fetchGameModes() {
    return this.fetchAPI('/constants/game_mode');
  }

  // Player historical data
  async fetchPlayerMatches(accountId, options = {}) {
    const { limit = 20, heroId, gameMode, skillBracket } = options;
    let endpoint = `/players/${accountId}/matches?limit=${limit}`;
    
    if (heroId) endpoint += `&hero_id=${heroId}`;
    if (gameMode) endpoint += `&game_mode=${gameMode}`;
    if (skillBracket) endpoint += `&skill=${skillBracket}`;
    
    return this.fetchAPI(endpoint);
  }

  async fetchPlayerHeroes(accountId) {
    return this.fetchAPI(`/players/${accountId}/heroes`);
  }

  async fetchPlayerRatings(accountId) {
    return this.fetchAPI(`/players/${accountId}/ratings`);
  }

  async fetchPlayerTotals(accountId) {
    return this.fetchAPI(`/players/${accountId}/totals`);
  }

  // Team and pro data
  async fetchTeams() {
    return this.fetchAPI('/teams');
  }

  async fetchProMatches() {
    return this.fetchAPI('/proMatches');
  }

  // Batch fetch for multiple requests
  async batchFetch(requests) {
    const results = await Promise.allSettled(
      requests.map(request => {
        if (typeof request === 'string') {
          return this.fetchAPI(request);
        }
        return this.fetchAPI(request.endpoint, request.useCache);
      })
    );

    return results.map((result, index) => ({
      request: requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Enhanced match analysis data
  async fetchMatchAnalysisData(matchId, playerAccountId) {
    const requests = [
      `/matches/${matchId}`,
      `/matches/${matchId}/logs`,
      '/heroStats',
      '/distributions'
    ];

    // Add player-specific requests if account ID provided
    if (playerAccountId) {
      const playerData = await this.fetchPlayerProfile(playerAccountId);
      if (playerData?.profile?.account_id) {
        requests.push(`/players/${playerAccountId}/heroes`);
        requests.push(`/players/${playerAccountId}/ratings`);
      }
    }

    const results = await this.batchFetch(requests);
    
    return {
      match: results[0]?.data,
      logs: results[1]?.data,
      heroStats: results[2]?.data || [],
      distributions: results[3]?.data,
      playerHeroes: results[4]?.data || [],
      playerRatings: results[5]?.data || []
    };
  }

  // Search functionality
  async searchMatches(query) {
    return this.fetchAPI(`/search?q=${encodeURIComponent(query)}`);
  }

  async searchPlayers(query) {
    return this.fetchAPI(`/search?q=${encodeURIComponent(query)}`);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

export default new OpenDotaAPIService();