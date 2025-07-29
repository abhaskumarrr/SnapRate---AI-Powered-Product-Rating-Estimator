/**
 * Environment variable utility for type-safe access to environment variables
 * 
 * This module provides a centralized way to access environment variables with
 * proper type checking and default values. It ensures consistent access to
 * configuration values throughout the application.
 */

/**
 * Get an environment variable with type checking
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable value or default
 */
export const getEnvString = (key, defaultValue = '') => {
  const value = import.meta.env[key];
  return value !== undefined ? String(value) : defaultValue;
};

/**
 * Get a boolean environment variable
 * @param {string} key - The environment variable key
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean} The environment variable as boolean
 */
export const getEnvBoolean = (key, defaultValue = false) => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Get a numeric environment variable
 * @param {string} key - The environment variable key
 * @param {number} defaultValue - Default value if not found
 * @returns {number} The environment variable as number
 */
export const getEnvNumber = (key, defaultValue = 0) => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Get a URL environment variable with validation
 * @param {string} key - The environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable as a valid URL string
 */
export const getEnvUrl = (key, defaultValue = '') => {
  const value = getEnvString(key, defaultValue);
  if (!value) return defaultValue;
  
  try {
    // Validate URL format
    new URL(value);
    return value;
  } catch (e) {
    // Log warning in development but fall back to default in production
    if (import.meta.env.DEV) {
      console.warn(`Invalid URL in environment variable ${key}: ${value}`);
    }
    return defaultValue;
  }
};

/**
 * Environment configuration object with typed access to all env vars
 */
export const env = {
  // API Configuration
  apiBaseUrl: getEnvUrl('VITE_API_BASE_URL', 'http://localhost:8000'),
  
  // Environment
  nodeEnv: getEnvString('VITE_NODE_ENV', 'development'),
  isProduction: getEnvString('VITE_NODE_ENV') === 'production',
  isDevelopment: getEnvString('VITE_NODE_ENV') === 'development',
  isStaging: getEnvString('VITE_NODE_ENV') === 'staging',
  
  // Feature flags
  enablePwa: getEnvBoolean('VITE_ENABLE_PWA', false),
  enableAnalytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),
  enableAdvancedAi: getEnvBoolean('VITE_ENABLE_ADVANCED_AI', false),
  
  // Performance settings
  imageCompressionQuality: getEnvNumber('VITE_IMAGE_COMPRESSION_QUALITY', 0.9),
  maxImageSize: getEnvNumber('VITE_MAX_IMAGE_SIZE', 10485760), // 10MB default
  optimizeImages: getEnvBoolean('VITE_OPTIMIZE_IMAGES', true),
  cacheTimeout: getEnvNumber('VITE_CACHE_TIMEOUT', 3600), // 1 hour default
  
  // Error reporting
  errorReporting: {
    enabled: getEnvBoolean('VITE_ERROR_REPORTING_ENABLED', false),
    url: getEnvUrl('VITE_ERROR_REPORTING_URL', ''),
  },
  
  // Development settings
  debug: {
    enableLogging: getEnvBoolean('VITE_ENABLE_DEBUG_LOGGING', true),
    useMockApi: getEnvBoolean('VITE_USE_MOCK_API', false),
  },
  
  /**
   * Get all environment variables as a flat object (for debugging)
   * @returns {Object} All environment variables
   */
  getAll() {
    return {
      apiBaseUrl: this.apiBaseUrl,
      nodeEnv: this.nodeEnv,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      isStaging: this.isStaging,
      enablePwa: this.enablePwa,
      enableAnalytics: this.enableAnalytics,
      enableAdvancedAi: this.enableAdvancedAi,
      imageCompressionQuality: this.imageCompressionQuality,
      maxImageSize: this.maxImageSize,
      optimizeImages: this.optimizeImages,
      cacheTimeout: this.cacheTimeout,
      errorReportingEnabled: this.errorReporting.enabled,
      errorReportingUrl: this.errorReporting.url,
      enableDebugLogging: this.debug.enableLogging,
      useMockApi: this.debug.useMockApi,
    };
  },
};

// Add a debug log method that only logs in development or when debug logging is enabled
export const debugLog = (...args) => {
  if (env.debug.enableLogging) {
    console.log('[SnapRate]', ...args);
  }
};

export default env;