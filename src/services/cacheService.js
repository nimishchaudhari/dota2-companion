/**
 * Cache Service
 * Advanced caching system with TTL management, cleanup, and performance statistics
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.accessCount = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Store item in cache with TTL
   */
  set(key, value, ttlMs = 5 * 60 * 1000) { // Default 5 minutes
    const now = Date.now();
    const expiresAt = now + ttlMs;
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    this.cache.set(key, value);
    this.ttlMap.set(key, expiresAt);
    this.accessCount.set(key, 0);
    
    this.stats.totalSize += this._estimateSize(value);
    
    console.log(`[Cache] Stored ${key} (expires in ${Math.round(ttlMs / 1000)}s)`);
  }

  /**
   * Get item from cache
   */
  get(key) {
    const now = Date.now();
    
    // Check if key exists and is not expired
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    const expiresAt = this.ttlMap.get(key);
    if (expiresAt && now > expiresAt) {
      // Expired
      this.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    
    // Update access count
    const currentCount = this.accessCount.get(key) || 0;
    this.accessCount.set(key, currentCount + 1);
    
    this.stats.hits++;
    console.log(`[Cache] Hit ${key} (accessed ${currentCount + 1} times)`);
    
    return this.cache.get(key);
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.stats.totalSize -= this._estimateSize(value);
      
      this.cache.delete(key);
      this.ttlMap.delete(key);
      this.accessCount.delete(key);
      
      console.log(`[Cache] Deleted ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const now = Date.now();
    const expiresAt = this.ttlMap.get(key);
    
    if (expiresAt && now > expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get or set pattern with async loading
   */
  async getOrSet(key, asyncLoader, ttlMs = 5 * 60 * 1000) {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    console.log(`[Cache] Loading ${key} via async loader`);
    
    try {
      const value = await asyncLoader();
      this.set(key, value, ttlMs);
      return value;
    } catch (error) {
      console.error(`[Cache] Failed to load ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        this.stats.evictions++;
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired items`);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttlMap.clear();
    this.accessCount.clear();
    this.stats.totalSize = 0;
    
    console.log(`[Cache] Cleared ${size} items`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : '0.00';
    
    return {
      ...this.stats,
      entries: this.cache.size,
      hitRate: `${hitRate}%`,
      averageSize: this.cache.size > 0 ? `${Math.round(this.stats.totalSize / this.cache.size)}B` : '0B',
      totalSizeKB: `${Math.round(this.stats.totalSize / 1024)}KB`
    };
  }

  /**
   * Get items sorted by access frequency
   */
  getPopularItems(limit = 10) {
    return Array.from(this.accessCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, accessCount: count }));
  }

  /**
   * Get items by TTL (soonest to expire first)
   */
  getExpirationOrder(limit = 10) {
    const now = Date.now();
    
    return Array.from(this.ttlMap.entries())
      .map(([key, expiresAt]) => ({
        key,
        expiresAt,
        expiresIn: Math.max(0, expiresAt - now),
        expired: expiresAt <= now
      }))
      .sort((a, b) => a.expiresAt - b.expiresAt)
      .slice(0, limit);
  }

  /**
   * Estimate memory size of a value
   */
  _estimateSize(value) {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default estimate for non-serializable objects
    }
  }

  /**
   * Set cache with tags for grouped operations
   */
  setWithTags(key, value, tags = [], ttlMs = 5 * 60 * 1000) {
    this.set(key, value, ttlMs);
    
    // Store tags mapping
    if (!this.tagMap) {
      this.tagMap = new Map();
    }
    
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag).add(key);
    });
  }

  /**
   * Clear all items with specific tag
   */
  clearByTag(tag) {
    if (!this.tagMap || !this.tagMap.has(tag)) {
      return 0;
    }
    
    const keys = this.tagMap.get(tag);
    let cleared = 0;
    
    keys.forEach(key => {
      if (this.delete(key)) {
        cleared++;
      }
    });
    
    this.tagMap.delete(tag);
    console.log(`[Cache] Cleared ${cleared} items with tag: ${tag}`);
    
    return cleared;
  }

  /**
   * Get all tags
   */
  getTags() {
    return this.tagMap ? Array.from(this.tagMap.keys()) : [];
  }

  /**
   * Destroy cache service
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheService.destroy();
  });
}

export default cacheService;