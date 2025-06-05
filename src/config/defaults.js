/**
 * Default Configuration Values
 * Provides fallback values for all environment variables to ensure the app works
 * even when environment variables are not set
 */

export const DEFAULT_CONFIG = {
  // API URLs - these should always work
  VITE_OPENDOTA_API_URL: 'https://api.opendota.com/api',
  VITE_STEAM_API_URL: 'https://api.steampowered.com',

  // Authentication settings - safe defaults
  VITE_AUTH_MODE: 'development',
  VITE_DEV_MODE_ENABLED: 'true',

  // Cache settings - reasonable defaults
  VITE_CACHE_TTL: '300000', // 5 minutes
  VITE_DATA_REFRESH_INTERVAL: '600000', // 10 minutes

  // Rate limiting - OpenDota free tier limits
  VITE_OPENDOTA_RATE_LIMIT: '60',
  VITE_STEAM_RATE_LIMIT: '100',

  // Session settings
  VITE_SESSION_TTL: '86400000', // 24 hours

  // Feature flags - enable by default for best UX
  VITE_FEATURE_STEAM_AUTH: 'true',
  VITE_FEATURE_DEV_MODE: 'true',
  VITE_FEATURE_MATCH_ANALYSIS: 'true',
  VITE_FEATURE_ANALYTICS: 'false',

  // Debug settings - off by default
  VITE_DEBUG_MODE: 'false',
  VITE_DEBUG_ASSETS: 'false'
};

/**
 * Auto-detect and configure environment-specific settings
 */
export const getEnvironmentDefaults = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  // Base defaults
  const config = { ...DEFAULT_CONFIG };

  // Vercel-specific configuration
  if (hostname.includes('vercel.app')) {
    config.VITE_STEAM_REALM = `https://${hostname}`;
    config.VITE_STEAM_RETURN_URL = `https://${hostname}/auth/steam/callback`;
    config.VITE_AUTH_MODE = 'development'; // Keep development mode for easier access
  }
  
  // Custom domain configuration (production deployments)
  else if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    config.VITE_STEAM_REALM = `https://${hostname}`;
    config.VITE_STEAM_RETURN_URL = `https://${hostname}/auth/steam/callback`;
  }

  // Local development configuration
  else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = typeof window !== 'undefined' ? window.location.port || '5173' : '5173';
    config.VITE_STEAM_REALM = `http://${hostname}:${port}`;
    config.VITE_STEAM_RETURN_URL = `http://${hostname}:${port}/auth/steam/callback`;
    config.VITE_DEBUG_MODE = 'true'; // Enable debugging in local dev
  }
  
  // Fallback for when window is not available (SSR/build time)
  else {
    config.VITE_STEAM_REALM = 'http://localhost:5173';
    config.VITE_STEAM_RETURN_URL = 'http://localhost:5173/auth/steam/callback';
  }

  // Production environment adjustments
  if (isProduction) {
    config.VITE_DEBUG_MODE = 'false'; // Always disable debug in production
    config.VITE_DEBUG_ASSETS = 'false';
  }

  // Development environment adjustments
  if (isDevelopment) {
    config.VITE_DEBUG_MODE = 'true';
    config.VITE_CACHE_TTL = '60000'; // Shorter cache for development
  }

  return config;
};

/**
 * Get configuration value with fallback
 */
export const getConfigValue = (key, fallback = null) => {
  // Try environment variable first
  const envValue = import.meta.env[key];
  if (envValue !== undefined && envValue !== '') {
    return envValue;
  }

  // Try environment-specific defaults
  const envDefaults = getEnvironmentDefaults();
  if (envDefaults[key] !== undefined) {
    return envDefaults[key];
  }

  // Try global defaults
  if (DEFAULT_CONFIG[key] !== undefined) {
    return DEFAULT_CONFIG[key];
  }

  // Use provided fallback
  return fallback;
};

/**
 * Validate configuration and provide warnings
 */
export const validateConfiguration = () => {
  const warnings = [];
  const errors = [];

  // Check critical API keys
  const openDotaKey = getConfigValue('VITE_OPENDOTA_API_KEY');
  if (!openDotaKey) {
    warnings.push({
      key: 'VITE_OPENDOTA_API_KEY',
      message: 'OpenDota API key not configured - using free tier limits',
      severity: 'warning',
      impact: 'Rate limiting may occur with heavy usage (60 req/min vs 60,000 req/hour)'
    });
  }

  const steamKey = getConfigValue('VITE_STEAM_API_KEY');
  const authMode = getConfigValue('VITE_AUTH_MODE');
  if (!steamKey && authMode === 'production') {
    warnings.push({
      key: 'VITE_STEAM_API_KEY',
      message: 'Steam API key not configured in production mode',
      severity: 'info',
      impact: 'Steam authentication features will be limited'
    });
  }

  // Check URL configuration
  const opendotaUrl = getConfigValue('VITE_OPENDOTA_API_URL');
  if (!opendotaUrl || !opendotaUrl.startsWith('https://')) {
    errors.push({
      key: 'VITE_OPENDOTA_API_URL',
      message: 'Invalid OpenDota API URL',
      severity: 'error',
      impact: 'API calls will fail'
    });
  }

  return { warnings, errors, isValid: errors.length === 0 };
};

export default {
  DEFAULT_CONFIG,
  getEnvironmentDefaults,
  getConfigValue,
  validateConfiguration
};