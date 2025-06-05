// Real player IDs for testing - these are actual professional players
export const TEST_PLAYERS = {
  miracle: '105248644',    // Miracle- (Team Liquid)
  n0tail: '19672354',      // N0tail (OG)
  puppey: '87278757',      // Puppey (Team Secret)
  dendi: '111620041',      // Dendi (Legend)
  arteezy: '103940975',    // Arteezy (Evil Geniuses)
  topson: '94054712',      // Topson (OG)
  ana: '311360822',        // ana (OG)
  sumail: '111620041',     // SumaiL
  ramzes: '132851371',     // Ramzes666
  resolution: '86799300'   // Resolution
};

// Real API endpoint - using actual OpenDota API
const OPENDOTA_BASE_URL = 'https://api.opendota.com/api';

// Cache for API responses to avoid rate limiting during tests
const apiCache = new Map();

/**
 * Fetch real player data from OpenDota API
 * @param {string} playerId - The player's account ID
 * @returns {Promise<Object>} Real player data
 */
export async function fetchRealPlayerData(playerId) {
  const cacheKey = `player-${playerId}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/players/${playerId}`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch player data for ${playerId}:`, error);
    throw error;
  }
}

/**
 * Fetch real match history from OpenDota API
 * @param {string} playerId - The player's account ID
 * @param {number} limit - Number of matches to fetch (default: 20)
 * @returns {Promise<Array>} Real match data
 */
export async function fetchRealMatches(playerId, limit = 20) {
  const cacheKey = `matches-${playerId}-${limit}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/players/${playerId}/matches?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch matches for ${playerId}:`, error);
    throw error;
  }
}

/**
 * Fetch real hero statistics from OpenDota API
 * @param {string} playerId - The player's account ID
 * @returns {Promise<Array>} Real hero statistics
 */
export async function fetchRealHeroStats(playerId) {
  const cacheKey = `heroes-${playerId}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/players/${playerId}/heroes`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch hero stats for ${playerId}:`, error);
    throw error;
  }
}

/**
 * Fetch real win/loss data from OpenDota API
 * @param {string} playerId - The player's account ID
 * @returns {Promise<Object>} Real win/loss statistics
 */
export async function fetchRealWinLoss(playerId) {
  const cacheKey = `winloss-${playerId}`;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/players/${playerId}/wl`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch win/loss for ${playerId}:`, error);
    throw error;
  }
}

/**
 * Fetch real hero list from OpenDota API
 * @returns {Promise<Array>} Real hero data
 */
export async function fetchRealHeroes() {
  const cacheKey = 'heroes-list';
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${OPENDOTA_BASE_URL}/heroes`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch heroes list:', error);
    throw error;
  }
}

/**
 * Wait for player data to be loaded completely
 * @param {string} playerId - The player's account ID
 * @returns {Promise<Object>} Complete player data set
 */
export async function waitForCompletePlayerData(playerId) {
  const [player, matches, heroes, winLoss, heroList] = await Promise.all([
    fetchRealPlayerData(playerId),
    fetchRealMatches(playerId),
    fetchRealHeroStats(playerId),
    fetchRealWinLoss(playerId),
    fetchRealHeroes()
  ]);

  return {
    player,
    matches,
    heroes,
    winLoss,
    heroList
  };
}

/**
 * Measure actual render time for performance testing
 * @param {Function} callback - Function to measure
 * @returns {Promise<{result: any, duration: number}>} Result and duration in milliseconds
 */
export async function measureRenderTime(callback) {
  const start = performance.now();
  const result = await callback();
  const end = performance.now();
  
  return {
    result,
    duration: end - start
  };
}

/**
 * Measure memory usage for performance testing
 * @returns {Object} Memory usage information
 */
export function measureMemoryUsage() {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    };
  }
  return null;
}

/**
 * Clear the API cache (useful for testing cache invalidation)
 */
export function clearApiCache() {
  apiCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys())
  };
}

/**
 * Validate that data structure matches expected OpenDota API format
 * @param {Object} data - Data to validate
 * @param {string} type - Type of data (player, matches, heroes, etc.)
 * @returns {boolean} Whether data is valid
 */
export function validateDataStructure(data, type) {
  switch (type) {
    case 'player':
      return data && typeof data.account_id === 'number' && typeof data.personaname === 'string';
    
    case 'matches':
      return Array.isArray(data) && data.every(match => 
        typeof match.match_id === 'number' && 
        typeof match.player_slot === 'number' &&
        typeof match.radiant_win === 'boolean'
      );
    
    case 'heroes':
      return Array.isArray(data) && data.every(hero => 
        typeof hero.hero_id === 'number' && 
        typeof hero.games === 'number' &&
        typeof hero.win === 'number'
      );
    
    case 'winloss':
      return data && typeof data.win === 'number' && typeof data.lose === 'number';
    
    case 'herolist':
      return Array.isArray(data) && data.every(hero => 
        typeof hero.id === 'number' && 
        typeof hero.name === 'string' &&
        typeof hero.localized_name === 'string'
      );
    
    default:
      return false;
  }
}

/**
 * Create a delay for testing async operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate network conditions for testing
 * @param {Function} apiCall - API call function
 * @param {Object} conditions - Network conditions { delay: number, failureRate: number }
 * @returns {Promise} Modified API call with network simulation
 */
export async function simulateNetworkConditions(apiCall, conditions = {}) {
  const { delay: networkDelay = 0, failureRate = 0 } = conditions;
  
  // Simulate network delay
  if (networkDelay > 0) {
    await delay(networkDelay);
  }
  
  // Simulate network failures
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new Error('Simulated network failure');
  }
  
  return apiCall();
}