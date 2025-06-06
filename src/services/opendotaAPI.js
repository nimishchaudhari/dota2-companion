/**
 * Enhanced OpenDota API Service
 * Provides intelligent rate limiting, batch requests, and comprehensive error handling
 */

class OpenDotaAPIService {
  constructor() {
    this.baseURL = 'https://api.opendota.com/api';
    this.apiKey = import.meta.env.VITE_OPENDOTA_API_KEY;
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1000; // 1 second between requests for free tier
    this.maxRetries = 3;
    
    // Track API stats
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Make authenticated API request with rate limiting
   */
  async makeRequest(endpoint, params = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Build URL with parameters
      const url = new URL(`${this.baseURL}${endpoint}`);
      
      // Add API key if available
      if (this.apiKey) {
        url.searchParams.append('api_key', this.apiKey);
      }
      
      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });

      console.log(`[OpenDota API] Making request to: ${url.pathname}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dota2Companion/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update stats
      this.stats.successfulRequests++;
      const responseTime = Date.now() - startTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) / 
        this.stats.successfulRequests;

      return data;
    } catch (error) {
      this.stats.failedRequests++;
      console.error(`[OpenDota API] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Batch multiple API requests with intelligent queuing
   */
  async batchRequests(requests) {
    const results = await Promise.allSettled(
      requests.map(async ({ endpoint, params }, index) => {
        // Add delay between requests for rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
        return this.makeRequest(endpoint, params);
      })
    );

    return results.map((result, index) => ({
      ...requests[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * Get match details with comprehensive data
   */
  async getMatch(matchId) {
    return this.makeRequest(`/matches/${matchId}`);
  }

  /**
   * Get hero performance benchmarks
   */
  async getBenchmarks(heroId) {
    return this.makeRequest('/benchmarks', { hero_id: heroId });
  }

  /**
   * Get hero statistics for meta analysis
   */
  async getHeroStats() {
    return this.makeRequest('/heroStats');
  }

  /**
   * Get MMR distributions for ranking context
   */
  async getDistributions() {
    return this.makeRequest('/distributions');
  }

  /**
   * Get player profile data
   */
  async getPlayer(accountId) {
    return this.makeRequest(`/players/${accountId}`);
  }

  /**
   * Get player recent matches
   */
  async getPlayerMatches(accountId, params = {}) {
    return this.makeRequest(`/players/${accountId}/matches`, params);
  }

  /**
   * Get match logs (for parsed matches)
   */
  async getMatchLogs(matchId) {
    try {
      return await this.makeRequest(`/matches/${matchId}/logs`);
    } catch (error) {
      console.warn(`[OpenDota API] Logs not available for match ${matchId}:`, error.message);
      return null;
    }
  }

  /**
   * Get constants (heroes, items, etc.)
   */
  async getConstants(resource) {
    return this.makeRequest(`/constants/${resource}`);
  }

  /**
   * Get comprehensive match analysis data
   */
  async getMatchAnalysisData(matchId, accountId) {
    console.log(`[OpenDota API] Fetching comprehensive match analysis for match ${matchId}, player ${accountId}`);
    
    // First get basic match data
    const matchData = await this.getMatch(matchId);
    
    // Find user's player data to get hero ID
    const userPlayer = matchData.players?.find(p => p.account_id === parseInt(accountId));
    const heroId = userPlayer?.hero_id;

    // Batch additional requests
    const additionalRequests = [
      { endpoint: '/heroStats', params: {}, key: 'heroStats' },
      { endpoint: '/distributions', params: {}, key: 'distributions' },
      { endpoint: '/constants/heroes', params: {}, key: 'heroes' },
      { endpoint: '/constants/items', params: {}, key: 'items' }
    ];

    // Add hero-specific requests if we have a hero ID
    if (heroId) {
      additionalRequests.push(
        { endpoint: '/benchmarks', params: { hero_id: heroId }, key: 'benchmarks' }
      );
    }

    // Add logs request (may fail for unparsed matches)
    additionalRequests.push(
      { endpoint: `/matches/${matchId}/logs`, params: {}, key: 'logs' }
    );

    const batchResults = await this.batchRequests(additionalRequests);
    
    // Compile results
    const analysisData = {
      match: matchData,
      userPlayer,
      heroId,
      ...Object.fromEntries(
        batchResults
          .filter(result => result.success)
          .map(result => [result.key, result.data])
      )
    };

    // Add failed requests info
    const failedRequests = batchResults.filter(result => !result.success);
    if (failedRequests.length > 0) {
      analysisData.warnings = failedRequests.map(req => 
        `Failed to load ${req.key}: ${req.error?.message || 'Unknown error'}`
      );
    }

    console.log(`[OpenDota API] Match analysis data compiled:`, {
      matchId,
      userHero: heroId,
      dataLoaded: Object.keys(analysisData).filter(k => k !== 'warnings'),
      warnings: analysisData.warnings?.length || 0
    });

    return analysisData;
  }

  /**
   * Get API usage statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      hasApiKey: !!this.apiKey,
      rateLimitDelay: this.rateLimitDelay
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }
}

// Create singleton instance
const openDotaAPI = new OpenDotaAPIService();

export default openDotaAPI;