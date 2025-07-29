/**
 * API Client for SnapRate application
 * Handles communication with the backend API
 */

import axios from 'axios';
import { env } from './env';

// Default configuration
const DEFAULT_CONFIG = {
  baseURL: env.apiBaseUrl,
  timeout: 30000, // 30 seconds for image uploads
  headers: {
    'Content-Type': 'application/json',
  },
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryDelayMultiplier: 2, // Exponential backoff
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * API Client class
 */
class SnapRateApiClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = axios.create(this.config);
    
    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
          config.params = { ...config.params, _t: Date.now() };
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Transform axios errors to our custom ApiError
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;
          const message = data?.message || data?.detail || `HTTP ${status} Error`;
          const details = data?.details || data?.errors || null;
          
          throw new ApiError(message, status, details);
        } else if (error.request) {
          // Network error
          throw new ApiError('Network error - please check your connection', 0);
        } else {
          // Other error
          throw new ApiError(error.message || 'An unexpected error occurred', 0);
        }
      }
    );
  }

  /**
   * Retry wrapper for API calls
   */
  async withRetry(apiCall, retries = RETRY_CONFIG.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except for 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === retries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.retryDelayMultiplier, attempt);
        await sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    return this.withRetry(async () => {
      const response = await this.client.get('/healthcheck');
      return response.data;
    });
  }

  /**
   * Get prediction service health
   */
  async getPredictionHealth() {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/v1/predict/health');
      return response.data;
    });
  }

  /**
   * Get available prediction modes
   */
  async getPredictionModes() {
    return this.withRetry(async () => {
      const response = await this.client.get('/api/v1/predict/modes');
      return response.data;
    });
  }

  /**
   * Predict product rating
   * @param {Object} params - Prediction parameters
   * @param {string} params.title - Product title (required)
   * @param {File} params.imageFile - Image file (optional)
   * @param {string} params.imageUrl - Image URL (optional)
   * @param {string} params.mode - Prediction mode (optional, defaults to 'auto')
   * @returns {Promise<Object>} Prediction response
   */
  async predictRating({ title, imageFile, imageUrl, mode = 'auto' }) {
    // Validate inputs
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ApiError('Title is required and must be a non-empty string', 400);
    }

    if (imageFile && imageUrl) {
      throw new ApiError('Please provide either an image file or image URL, not both', 400);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('mode', mode);

    if (imageFile) {
      // Validate image file
      if (!imageFile instanceof File) {
        throw new ApiError('Image must be a valid File object', 400);
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        throw new ApiError('Image must be JPEG, PNG, or WebP format', 400);
      }
      
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        throw new ApiError('Image file size must be less than 5MB', 400);
      }
      
      formData.append('image', imageFile);
    } else if (imageUrl) {
      // Basic URL validation
      try {
        new URL(imageUrl);
        formData.append('image_url', imageUrl);
      } catch {
        throw new ApiError('Invalid image URL format', 400);
      }
    }

    // Make API call with retry
    return this.withRetry(async () => {
      const response = await this.client.post('/api/v1/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Longer timeout for image processing
        timeout: 60000, // 60 seconds
      });
      
      return response.data;
    });
  }

  /**
   * Update base URL (useful for environment switching)
   */
  updateBaseURL(baseURL) {
    this.config.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Update timeout
   */
  updateTimeout(timeout) {
    this.config.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }
}

// Create and export default instance
const apiClient = new SnapRateApiClient();

export default apiClient;

// Export the class for custom instances
export { SnapRateApiClient };

// Export convenience methods
export const healthCheck = () => apiClient.healthCheck();
export const getPredictionHealth = () => apiClient.getPredictionHealth();
export const getPredictionModes = () => apiClient.getPredictionModes();
export const predictRating = (params) => apiClient.predictRating(params);