/**
 * Tests for API Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios at the top level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {}
    }))
  }
}));

// Import after mocking
import { SnapRateApiClient, ApiError } from './apiClient';

describe('ApiError', () => {
  it('should create ApiError with message and status', () => {
    const error = new ApiError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.details).toBeNull();
    expect(error.name).toBe('ApiError');
  });

  it('should create ApiError with details', () => {
    const details = { field: 'title', error: 'Invalid title' };
    const error = new ApiError('Validation error', 422, details);
    expect(error.details).toEqual(details);
  });
});

describe('SnapRateApiClient', () => {
  let client;
  let mockAxiosInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked axios and its create method
    const axios = await import('axios');
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: {}
    };
    
    // Make axios.create return our mock instance
    vi.mocked(axios.default.create).mockReturnValue(mockAxiosInstance);
    
    client = new SnapRateApiClient();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      expect(client.config.baseURL).toBe('http://localhost:8000');
      expect(client.config.timeout).toBe(30000);
    });

    it('should create client with custom config', () => {
      const customConfig = {
        baseURL: 'https://api.example.com',
        timeout: 60000
      };
      
      const customClient = new SnapRateApiClient(customConfig);
      expect(customClient.config.baseURL).toBe('https://api.example.com');
      expect(customClient.config.timeout).toBe(60000);
    });
  });

  describe('healthCheck', () => {
    it('should make GET request to /healthcheck', async () => {
      const mockResponse = {
        data: { status: 'healthy', version: '1.0.0', timestamp: '2024-01-01T00:00:00Z' }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/healthcheck');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPredictionHealth', () => {
    it('should make GET request to /api/v1/predict/health', async () => {
      const mockResponse = {
        data: { status: 'healthy', services: {} }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getPredictionHealth();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/predict/health');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getPredictionModes', () => {
    it('should make GET request to /api/v1/predict/modes', async () => {
      const mockResponse = {
        data: { modes: {}, default: 'auto' }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getPredictionModes();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/predict/modes');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('predictRating', () => {
    const mockPredictionResponse = {
      data: {
        rating: 4.2,
        confidence: 85.5,
        explanation: 'Test explanation'
      }
    };

    it('should make POST request with title only', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockPredictionResponse);

      const result = await client.predictRating({ title: 'Test Product' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/predict',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );
      expect(result).toEqual(mockPredictionResponse.data);
    });

    it('should validate required title', async () => {
      await expect(client.predictRating({})).rejects.toThrow(ApiError);
      await expect(client.predictRating({ title: '' })).rejects.toThrow(ApiError);
      await expect(client.predictRating({ title: '   ' })).rejects.toThrow(ApiError);
    });

    it('should reject both image file and URL', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(client.predictRating({
        title: 'Test Product',
        imageFile: mockFile,
        imageUrl: 'https://example.com/image.jpg'
      })).rejects.toThrow(ApiError);
    });

    it('should validate image file type', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await expect(client.predictRating({
        title: 'Test Product',
        imageFile: mockFile
      })).rejects.toThrow(ApiError);
    });

    it('should validate image URL format', async () => {
      await expect(client.predictRating({
        title: 'Test Product',
        imageUrl: 'not-a-url'
      })).rejects.toThrow(ApiError);
    });
  });

  describe('configuration updates', () => {
    it('should update base URL', () => {
      const newBaseURL = 'https://new-api.example.com';
      client.updateBaseURL(newBaseURL);
      
      expect(client.config.baseURL).toBe(newBaseURL);
      expect(mockAxiosInstance.defaults.baseURL).toBe(newBaseURL);
    });

    it('should update timeout', () => {
      const newTimeout = 45000;
      client.updateTimeout(newTimeout);
      
      expect(client.config.timeout).toBe(newTimeout);
      expect(mockAxiosInstance.defaults.timeout).toBe(newTimeout);
    });
  });
});

describe('Input validation', () => {
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SnapRateApiClient();
  });

  it('should validate title is required', async () => {
    await expect(client.predictRating({})).rejects.toThrow('Title is required');
  });

  it('should validate title is not empty', async () => {
    await expect(client.predictRating({ title: '' })).rejects.toThrow('Title is required');
  });

  it('should validate title is not whitespace only', async () => {
    await expect(client.predictRating({ title: '   ' })).rejects.toThrow('Title is required');
  });

  it('should validate image file type', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    await expect(client.predictRating({
      title: 'Test Product',
      imageFile: invalidFile
    })).rejects.toThrow('Image must be JPEG, PNG, or WebP format');
  });

  it('should validate image file size', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    await expect(client.predictRating({
      title: 'Test Product',
      imageFile: largeFile
    })).rejects.toThrow('Image file size must be less than 5MB');
  });

  it('should validate image URL format', async () => {
    await expect(client.predictRating({
      title: 'Test Product',
      imageUrl: 'not-a-url'
    })).rejects.toThrow('Invalid image URL format');
  });

  it('should reject both image file and URL', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await expect(client.predictRating({
      title: 'Test Product',
      imageFile: mockFile,
      imageUrl: 'https://example.com/image.jpg'
    })).rejects.toThrow('Please provide either an image file or image URL, not both');
  });
});