// Advanced caching service for OpenDota API responses
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 300000; // 5 minutes
    this.maxCacheSize = 1000; // Maximum number of cached items
    this.hitCount = 0;
    this.missCount = 0;
    
    // Different TTL for different data types
    this.ttlConfig = {
      'match_': 1800000,      // 30 minutes for match data
      'player_': 600000,      // 10 minutes for player data
      'heroes': 3600000,      // 1 hour for heroes list
      'constants_': 7200000,  // 2 hours for constants
      'benchmarks_': 1800000, // 30 minutes for benchmarks
      'heroStats': 3600000,   // 1 hour for hero stats
      'analysis_': 600000     // 10 minutes for analysis results
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  // Get TTL for a specific key
  getTTL(key) {
    for (const [prefix, ttl] of Object.entries(this.ttlConfig)) {
      if (key.startsWith(prefix)) {
        return ttl;
      }
    }
    return this.defaultTTL;
  }

  // Set cache item
  set(key, data, customTTL = null) {
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const ttl = customTTL || this.getTTL(key);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });

    console.log(`[CACHE] Set ${key} (TTL: ${ttl}ms)`);
  }

  // Get cache item
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access stats
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.hitCount++;

    console.log(`[CACHE] Hit ${key} (accessed ${item.accessCount} times)`);
    return item.data;
  }

  // Check if key exists and is valid
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete cache item
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[CACHE] Deleted ${key}`);
    }
    return deleted;
  }

  // Clear all cache
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    console.log(`[CACHE] Cleared all ${size} items`);
  }

  // Clear cache by prefix
  clearByPrefix(prefix) {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    console.log(`[CACHE] Cleared ${deletedCount} items with prefix '${prefix}'`);
    return deletedCount;
  }

  // Evict oldest items when cache is full
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[CACHE] Evicted oldest item: ${oldestKey}`);
    }
  }

  // Cleanup expired items
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CACHE] Cleaned up ${cleanedCount} expired items`);
    }
  }

  // Cache statistics
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests * 100).toFixed(2) : 0;
    
    // Calculate total memory usage (approximate)
    let totalMemory = 0;
    for (const item of this.cache.values()) {
      totalMemory += JSON.stringify(item.data).length;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: `${hitRate}%`,
      totalMemory: `${(totalMemory / 1024).toFixed(2)} KB`,
      items: this.getCacheItems()
    };
  }

  // Get cache items summary
  getCacheItems() {
    const items = [];
    
    for (const [key, item] of this.cache.entries()) {
      const age = Date.now() - item.timestamp;
      const remainingTTL = Math.max(0, item.ttl - age);
      
      items.push({
        key,
        age: `${Math.round(age / 1000)}s`,
        remainingTTL: `${Math.round(remainingTTL / 1000)}s`,
        accessCount: item.accessCount,
        size: `${(JSON.stringify(item.data).length / 1024).toFixed(2)} KB`
      });
    }

    return items.sort((a, b) => b.accessCount - a.accessCount);
  }

  // Smart prefetch for common patterns
  async prefetch(patterns, fetcher) {
    const prefetchPromises = patterns.map(async (pattern) => {
      if (!this.has(pattern.key)) {
        try {
          const data = await fetcher(pattern.endpoint);
          this.set(pattern.key, data, pattern.ttl);
          console.log(`[CACHE] Prefetched ${pattern.key}`);
        } catch (error) {
          console.error(`[CACHE] Prefetch failed for ${pattern.key}:`, error);
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  // Intelligent cache warming for match analysis
  async warmMatchAnalysisCache(matchId, playerAccountId, fetcher) {
    const patterns = [
      {
        key: `match_${matchId}`,
        endpoint: `/matches/${matchId}`,
        ttl: 1800000
      },
      {
        key: `heroes`,
        endpoint: '/heroes',
        ttl: 3600000
      },
      {
        key: `heroStats`,
        endpoint: '/heroStats',
        ttl: 3600000
      }
    ];

    if (playerAccountId) {
      patterns.push(
        {
          key: `player_${playerAccountId}`,
          endpoint: `/players/${playerAccountId}`,
          ttl: 600000
        },
        {
          key: `player_heroes_${playerAccountId}`,
          endpoint: `/players/${playerAccountId}/heroes`,
          ttl: 600000
        }
      );
    }

    await this.prefetch(patterns, fetcher);
  }

  // Cache compression for large objects
  compress(data) {
    // Simple compression - remove unnecessary fields for caching
    if (Array.isArray(data)) {
      return data.map(item => this.compressItem(item));
    }
    return this.compressItem(data);
  }

  compressItem(item) {
    if (!item || typeof item !== 'object') return item;
    
    // Remove common unnecessary fields to save memory
    const compressed = { ...item };
    delete compressed.__v;
    delete compressed._id;
    delete compressed.metadata;
    
    return compressed;
  }

  // Export cache for debugging
  export() {
    const exports = {};
    for (const [key, item] of this.cache.entries()) {
      exports[key] = {
        data: item.data,
        timestamp: item.timestamp,
        ttl: item.ttl,
        accessCount: item.accessCount
      };
    }
    return exports;
  }

  // Import cache from backup
  import(cacheData) {
    const now = Date.now();
    let importedCount = 0;

    for (const [key, item] of Object.entries(cacheData)) {
      // Only import non-expired items
      if (now - item.timestamp < item.ttl) {
        this.cache.set(key, {
          data: item.data,
          timestamp: item.timestamp,
          ttl: item.ttl,
          accessCount: item.accessCount || 0,
          lastAccessed: now
        });
        importedCount++;
      }
    }

    console.log(`[CACHE] Imported ${importedCount} valid items`);
    return importedCount;
  }

  // Destroy cache service
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export default new CacheService();