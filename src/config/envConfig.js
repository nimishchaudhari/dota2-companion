/**
 * Environment Configuration Service
 * Provides automatic environment variable configuration with fallbacks
 * Ensures the app works in all deployment environments (Vercel, local, etc.)
 */
import { getConfigValue, validateConfiguration } from './defaults.js';

class EnvironmentConfig {
  constructor() {
    this.config = this.buildConfig();
    this.validateConfig();
    this.logConfiguration();
  }

  buildConfig() {
    return {
      // API Configuration
      opendota: {
        apiUrl: getConfigValue('VITE_OPENDOTA_API_URL'),
        apiKey: getConfigValue('VITE_OPENDOTA_API_KEY'),
        rateLimit: parseInt(getConfigValue('VITE_OPENDOTA_RATE_LIMIT')),
      },
      
      steam: {
        apiUrl: getConfigValue('VITE_STEAM_API_URL'),
        apiKey: getConfigValue('VITE_STEAM_API_KEY'),
        realm: getConfigValue('VITE_STEAM_REALM'),
        returnUrl: getConfigValue('VITE_STEAM_RETURN_URL'),
        rateLimit: parseInt(getConfigValue('VITE_STEAM_RATE_LIMIT')),
      },
      
      // Authentication Configuration
      auth: {
        mode: getConfigValue('VITE_AUTH_MODE'),
        devModeEnabled: getConfigValue('VITE_DEV_MODE_ENABLED') === 'true',
        sessionTTL: parseInt(getConfigValue('VITE_SESSION_TTL')),
      },
      
      // Cache Configuration
      cache: {
        ttl: parseInt(getConfigValue('VITE_CACHE_TTL')),
        dataRefreshInterval: parseInt(getConfigValue('VITE_DATA_REFRESH_INTERVAL')),
      },
      
      // Application Configuration
      app: {
        environment: import.meta.env.MODE || 'development',
        isProduction: import.meta.env.PROD || false,
        isDevelopment: import.meta.env.DEV || true,
        debugMode: getConfigValue('VITE_DEBUG_MODE') === 'true',
        assetsDebug: getConfigValue('VITE_DEBUG_ASSETS') === 'true',
      },
      
      // Feature Flags
      features: {
        steamAuth: getConfigValue('VITE_FEATURE_STEAM_AUTH') === 'true',
        devMode: getConfigValue('VITE_FEATURE_DEV_MODE') === 'true',
        analytics: getConfigValue('VITE_FEATURE_ANALYTICS') === 'true',
        matchAnalysis: getConfigValue('VITE_FEATURE_MATCH_ANALYSIS') === 'true',
      }
    };
  }

  validateConfig() {
    const validation = validateConfiguration();
    
    this.warnings = validation.warnings.map(w => w.message);
    this.errors = validation.errors.map(e => e.message);
    this.isConfigured = validation.isValid && validation.warnings.length === 0;

    // Log warnings and errors
    if (this.warnings.length > 0) {
      console.warn('[ENV CONFIG] Configuration warnings:', this.warnings);
    }

    if (this.errors.length > 0) {
      console.error('[ENV CONFIG] Configuration errors:', this.errors);
      throw new Error('Critical environment configuration errors detected');
    }
  }

  logConfiguration() {
    if (this.config.app.debugMode) {
      console.group('[ENV CONFIG] Environment Configuration');
      console.log('Environment:', this.config.app.environment);
      console.log('Auth Mode:', this.config.auth.mode);
      console.log('OpenDota API:', this.config.opendota.apiKey ? '✓ Configured' : '✗ Using free tier');
      console.log('Steam API:', this.config.steam.apiKey ? '✓ Configured' : '✗ Not configured');
      console.log('Cache TTL:', `${this.config.cache.ttl / 1000}s`);
      console.log('Features:', this.config.features);
      console.groupEnd();
    }
  }

  // Getters for easy access
  get opendota() { return this.config.opendota; }
  get steam() { return this.config.steam; }
  get auth() { return this.config.auth; }
  get cache() { return this.config.cache; }
  get app() { return this.config.app; }
  get features() { return this.config.features; }

  // Helper methods
  isOpenDotaConfigured() {
    return Boolean(this.config.opendota.apiKey);
  }

  isSteamConfigured() {
    return Boolean(this.config.steam.apiKey);
  }

  isFullyConfigured() {
    return this.isOpenDotaConfigured() && (this.isSteamConfigured() || this.config.auth.mode === 'development');
  }

  getApiUrl(service, endpoint = '') {
    const baseUrl = this.config[service]?.apiUrl;
    if (!baseUrl) {
      throw new Error(`Unknown service: ${service}`);
    }
    return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
  }

  buildOpenDotaUrl(endpoint, params = {}) {
    const url = new URL(`${this.config.opendota.apiUrl}${endpoint}`);
    
    // Add API key if available
    if (this.config.opendota.apiKey) {
      url.searchParams.append('api_key', this.config.opendota.apiKey);
    }
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    return url.toString();
  }

  // Auto-configuration for different environments
  static autoDetectEnvironment() {
    // Check if running on Vercel
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return 'vercel';
    }
    
    // Check if running on localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'local';
    }
    
    // Check if running in production
    if (import.meta.env.PROD) {
      return 'production';
    }
    
    return 'development';
  }

  // Create environment-specific configuration suggestions
  getConfigurationSuggestions() {
    const suggestions = [];
    const environment = EnvironmentConfig.autoDetectEnvironment();

    if (!this.isOpenDotaConfigured()) {
      suggestions.push({
        type: 'warning',
        message: 'OpenDota API key not configured',
        action: environment === 'vercel' 
          ? 'Add VITE_OPENDOTA_API_KEY to Vercel environment variables'
          : 'Create .env.local with VITE_OPENDOTA_API_KEY',
        impact: 'Limited to 60 requests/minute instead of 60,000/hour'
      });
    }

    if (!this.isSteamConfigured() && this.config.auth.mode === 'production') {
      suggestions.push({
        type: 'info',
        message: 'Steam API key not configured',
        action: environment === 'vercel'
          ? 'Add VITE_STEAM_API_KEY to Vercel environment variables'
          : 'Add VITE_STEAM_API_KEY to .env.local',
        impact: 'Steam authentication features may be limited'
      });
    }

    return suggestions;
  }

  // Generate environment file template
  generateEnvTemplate(includeComments = true) {
    const template = [];
    
    if (includeComments) {
      template.push('# Dota 2 Companion - Environment Configuration');
      template.push('# Copy this to .env.local and fill in your API keys');
      template.push('');
      template.push('# OpenDota API Configuration - HIGHLY RECOMMENDED');
      template.push('# Get your API key from: https://www.opendota.com/api-keys');
      template.push('# Without API key: 60 requests/minute (free tier)');
      template.push('# With API key: 60,000 requests/hour (registered tier)');
    }
    
    template.push('VITE_OPENDOTA_API_KEY=your_opendota_api_key_here');
    template.push('');
    
    if (includeComments) {
      template.push('# Steam API Configuration (optional)');
      template.push('# Required for Steam authentication in production');
      template.push('# Get from: https://steamcommunity.com/dev/apikey');
    }
    
    template.push('VITE_STEAM_API_KEY=your_steam_api_key_here');
    template.push('');
    
    if (includeComments) {
      template.push('# Authentication Mode');
      template.push('# development: Use Account ID input (bypasses Steam)');
      template.push('# production: Use Steam OpenID authentication');
    }
    
    template.push('VITE_AUTH_MODE=development');
    template.push('');
    
    if (includeComments) {
      template.push('# Optional Configuration');
    }
    
    template.push('VITE_DEBUG_MODE=false');
    template.push('VITE_CACHE_TTL=300000');
    template.push('VITE_DATA_REFRESH_INTERVAL=600000');
    
    return template.join('\n');
  }
}

// Create and export singleton instance
const envConfig = new EnvironmentConfig();

export default envConfig;

// Named exports for convenience
export const {
  opendota,
  steam,
  auth,
  cache,
  app,
  features
} = envConfig.config;

export const isOpenDotaConfigured = () => envConfig.isOpenDotaConfigured();
export const isSteamConfigured = () => envConfig.isSteamConfigured();
export const isFullyConfigured = () => envConfig.isFullyConfigured();
export const buildOpenDotaUrl = (endpoint, params) => envConfig.buildOpenDotaUrl(endpoint, params);
export const getConfigurationSuggestions = () => envConfig.getConfigurationSuggestions();
export const generateEnvTemplate = (includeComments) => envConfig.generateEnvTemplate(includeComments);