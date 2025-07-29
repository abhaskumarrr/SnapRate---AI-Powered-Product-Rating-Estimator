/**
 * End-to-End Tests for SnapRate Application
 * Tests complete user flows, error scenarios, and responsive behavior
 * 
 * Requirements covered:
 * - 1.1: Camera capture option
 * - 1.2: File upload option  
 * - 1.3: URL input option
 * - 2.1: Product title input
 * - 3.1: Complete prediction flow
 * - 4.1: Mobile-optimized interface
 * - 4.2: Desktop-optimized interface
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as apiClient from './utils/apiClient';

// Mock the API client
vi.mock('./utils/apiClient', () => ({
  predictRating: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status, details = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  }
}));

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Helper function to create mock file
const createMockFile = (name = 'test.jpg', type = 'image/jpeg', content = 'test') => {
  return new File([content], name, { type });
};

// Helper function to simulate file input
const simulateFileInput = async (user, file) => {
  const fileInput = screen.getByRole('button', { name: /upload file/i });
  await user.click(fileInput);
  
  const hiddenFileInput = document.querySelector('input[type="file"]');
  Object.defineProperty(hiddenFileInput, 'files', {
    value: [file],
    writable: false,
  });
  fireEvent.change(hiddenFileInput);
};

// Helper function to simulate URL input
const simulateUrlInput = async (user, url) => {
  const urlButton = screen.getByRole('button', { name: /image url/i });
  await user.click(urlButton);
  
  const urlInput = screen.getByPlaceholderText(/enter image url/i);
  await user.type(urlInput, url);
  
  const confirmButton = screen.getByRole('button', { name: /load/i });
  await user.click(confirmButton);
};

// Helper function to set up complete inputs
const setupCompleteInputs = async (user, title = 'Test Product', useFile = true, imageUrl = null) => {
  // Set up title
  const titleInput = screen.getByPlaceholderText(/enter your product title/i);
  await user.clear(titleInput);
  await user.type(titleInput, title);

  // Set up image
  if (useFile) {
    const file = createMockFile();
    await simulateFileInput(user, file);
    return { file, title };
  } else if (imageUrl) {
    await simulateUrlInput(user, imageUrl);
    return { imageUrl, title };
  }
};

describe('End-to-End Tests - Complete User Flows', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Input Methods (Requirements 1.1, 1.2, 1.3)', () => {
    it('should provide camera capture option for mobile devices', async () => {
      render(<App />);

      // Look for camera capture button
      const cameraButton = screen.getByRole('button', { name: /take photo/i });
      expect(cameraButton).toBeInTheDocument();

      // Click camera button should trigger file input with capture attribute
      await user.click(cameraButton);
      
      const fileInput = document.querySelector('input[type="file"][capture="environment"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should provide file upload option from local storage', async () => {
      render(<App />);

      // Look for file upload button
      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      expect(uploadButton).toBeInTheDocument();

      // Test file upload functionality
      const file = createMockFile();
      await simulateFileInput(user, file);

      // Verify image preview is displayed
      await waitFor(() => {
        // Check for image preview element
        const imagePreview = screen.getByAltText(/product preview/i);
        expect(imagePreview).toBeInTheDocument();
      });
    });

    it('should provide URL input option', async () => {
      render(<App />);

      // Look for URL input button
      const urlButton = screen.getByRole('button', { name: /image url/i });
      expect(urlButton).toBeInTheDocument();

      // Test URL input functionality
      await user.click(urlButton);
      
      const urlInput = screen.getByPlaceholderText(/enter image url/i);
      expect(urlInput).toBeInTheDocument();

      await user.type(urlInput, 'https://example.com/image.jpg');
      
      const confirmButton = screen.getByRole('button', { name: /load/i });
      await user.click(confirmButton);

      // Verify URL input is available (the input field should be visible)
      expect(urlInput).toBeInTheDocument();
    });

    it('should validate image format and size', async () => {
      render(<App />);

      // Test invalid file type
      const invalidFile = createMockFile('test.txt', 'text/plain');
      await simulateFileInput(user, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
      });
    });

    it('should display image preview when image is successfully uploaded', async () => {
      render(<App />);

      const file = createMockFile();
      await simulateFileInput(user, file);

      await waitFor(() => {
        // Check for image preview element
        const imagePreview = screen.getByAltText(/product preview/i);
        expect(imagePreview).toBeInTheDocument();
      });
    });

    it('should display error message for invalid images', async () => {
      render(<App />);

      // Test with oversized file (mock a large file)
      const largeFile = createMockFile('large.jpg', 'image/jpeg');
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      await simulateFileInput(user, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product Title Input (Requirement 2.1)', () => {
    it('should provide text input field for product title', async () => {
      render(<App />);

      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('type', 'text');
    });

    it('should validate that title is not empty', async () => {
      render(<App />);

      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      // Try to submit empty title
      await user.click(titleInput);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should validate title character limit', async () => {
      render(<App />);

      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const longTitle = 'a'.repeat(201); // Assuming 200 char limit

      await user.type(titleInput, longTitle);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/title is too long/i)).toBeInTheDocument();
      });
    });

    it('should display error message for invalid title', async () => {
      render(<App />);

      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      // Test with only whitespace
      await user.type(titleInput, '   ');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid product title/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete User Flow (Requirement 3.1)', () => {
    it('should complete full prediction flow with file upload', async () => {
      const mockResponse = {
        rating: 4.2,
        confidence: 85,
        explanation: 'This product shows strong visual appeal with clear branding.'
      };
      
      apiClient.predictRating.mockResolvedValue(mockResponse);

      render(<App />);

      // Complete the full flow
      await setupCompleteInputs(user, 'Premium Wireless Headphones');

      // Wait for prediction button to be enabled
      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      // Click prediction button
      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      // Verify loading state
      expect(screen.getByText(/analyzing product/i)).toBeInTheDocument();

      // Verify results are displayed
      await waitFor(() => {
        expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText(/strong visual appeal/i)).toBeInTheDocument();
      });
    });

    it('should complete full prediction flow with URL input', async () => {
      const mockResponse = {
        rating: 3.8,
        confidence: 72,
        explanation: 'Good product presentation with room for improvement.'
      };
      
      apiClient.predictRating.mockResolvedValue(mockResponse);

      render(<App />);

      // Use URL input instead of file
      await setupCompleteInputs(user, 'Smartphone Case', false, 'https://example.com/phone-case.jpg');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText('3.8 / 5.0')).toBeInTheDocument();
        expect(screen.getByText('72%')).toBeInTheDocument();
      });
    });

    it('should display star rating with decimal precision', async () => {
      const mockResponse = {
        rating: 4.7,
        confidence: 92,
        explanation: 'Excellent product presentation.'
      };
      
      apiClient.predictRating.mockResolvedValue(mockResponse);

      render(<App />);

      await setupCompleteInputs(user, 'Premium Product');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText('4.7 / 5.0')).toBeInTheDocument();
        
        // Check that stars are rendered (should show 4 full stars and 1 partial)
        const stars = document.querySelectorAll('svg');
        const yellowStars = Array.from(stars).filter(star => 
          star.classList.contains('text-yellow-400')
        );
        expect(yellowStars.length).toBeGreaterThan(0);
      });
    });

    it('should display confidence score as percentage', async () => {
      const mockResponse = {
        rating: 3.5,
        confidence: 68,
        explanation: 'Average product with standard features.'
      };
      
      apiClient.predictRating.mockResolvedValue(mockResponse);

      render(<App />);

      await setupCompleteInputs(user, 'Standard Product');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText('68%')).toBeInTheDocument();
        expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
      });
    });

    it('should provide textual explanation of rating factors', async () => {
      const mockResponse = {
        rating: 2.3,
        confidence: 45,
        explanation: 'Product image quality is poor and title lacks descriptive keywords. Consider improving lighting and adding more specific product details.'
      };
      
      apiClient.predictRating.mockResolvedValue(mockResponse);

      render(<App />);

      await setupCompleteInputs(user, 'Thing');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText(/product image quality is poor/i)).toBeInTheDocument();
        expect(screen.getByText(/consider improving lighting/i)).toBeInTheDocument();
      });
    });

    it('should display loading animation during processing', async () => {
      let resolvePromise;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      apiClient.predictRating.mockReturnValue(mockPromise);

      render(<App />);

      await setupCompleteInputs(user, 'Test Product');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      // Verify loading state elements
      expect(screen.getByText(/analyzing product/i)).toBeInTheDocument();
      expect(screen.getByText(/processing your product data/i)).toBeInTheDocument();
      
      // Check for loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({
        rating: 4.0,
        confidence: 80,
        explanation: 'Good product.'
      });

      // Verify loading state is cleared
      await waitFor(() => {
        expect(screen.queryByText(/analyzing product/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new apiClient.ApiError('Failed to process image', 400);
      apiClient.predictRating.mockRejectedValue(mockError);

      render(<App />);

      await setupCompleteInputs(user, 'Test Product');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText('Prediction Failed')).toBeInTheDocument();
        expect(screen.getAllByText('Failed to process image')[0]).toBeInTheDocument();
        expect(screen.getByText(/please try again or check your inputs/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error - please check your connection');
      apiClient.predictRating.mockRejectedValue(networkError);

      render(<App />);

      await setupCompleteInputs(user, 'Test Product');

      await waitFor(() => {
        const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
        expect(predictionButton).not.toBeDisabled();
      });

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      await user.click(predictionButton);

      await waitFor(() => {
        expect(screen.getByText('Prediction Failed')).toBeInTheDocument();
        expect(screen.getAllByText('Failed to generate prediction. Please try again.')[0]).toBeInTheDocument();
      });
    });

    it('should handle missing inputs appropriately', async () => {
      render(<App />);

      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      
      // Initially disabled with no inputs
      expect(predictionButton).toBeDisabled();
      expect(screen.getByText(/please add an image and title to get started/i)).toBeInTheDocument();

      // Add only title
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      await user.type(titleInput, 'Test Product');

      await waitFor(() => {
        expect(predictionButton).toBeDisabled();
        expect(screen.getByText(/please add a product image/i)).toBeInTheDocument();
      });

      // Add only image (clear title first)
      await user.clear(titleInput);
      const file = createMockFile();
      await simulateFileInput(user, file);

      await waitFor(() => {
        expect(predictionButton).toBeDisabled();
        expect(screen.getByText(/please enter a product title/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid image formats', async () => {
      render(<App />);

      // Try uploading a non-image file
      const textFile = createMockFile('document.txt', 'text/plain');
      await simulateFileInput(user, textFile);

      await waitFor(() => {
        expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
      });
    });

    it('should handle oversized images', async () => {
      render(<App />);

      // Create a mock large file
      const largeFile = createMockFile('large-image.jpg', 'image/jpeg');
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB

      await simulateFileInput(user, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size too large/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid URLs', async () => {
      render(<App />);

      const urlButton = screen.getByRole('button', { name: /enter url/i });
      await user.click(urlButton);
      
      const urlInput = screen.getByPlaceholderText(/enter image url/i);
      await user.type(urlInput, 'not-a-valid-url');
      
      const confirmButton = screen.getByRole('button', { name: /use this url/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid image url/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Behavior (Requirements 4.1, 4.2)', () => {
    it('should display mobile-optimized interface on small screens', async () => {
      // Mock mobile viewport
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<App />);

      // Check for mobile-specific layout
      const container = document.querySelector('.container');
      expect(container).toBeInTheDocument();
      
      // Verify responsive grid layout
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
      expect(gridContainer).toHaveClass('lg:grid-cols-2');
    });

    it('should display desktop-optimized interface on large screens', async () => {
      // Mock desktop viewport
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1024px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<App />);

      // Check for desktop layout elements
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-2');
      
      // Verify proper spacing for desktop
      expect(gridContainer).toHaveClass('gap-6');
      expect(gridContainer).toHaveClass('lg:gap-8');
    });

    it('should maintain usability when window is resized', async () => {
      render(<App />);

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      fireEvent(window, new Event('resize'));

      // Verify components are still accessible
      expect(screen.getByPlaceholderText(/enter your product title/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get rating prediction/i })).toBeInTheDocument();

      // Resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      fireEvent(window, new Event('resize'));

      // Verify components are still accessible
      expect(screen.getByPlaceholderText(/enter your product title/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get rating prediction/i })).toBeInTheDocument();
    });

    it('should adapt layout for different screen orientations', async () => {
      render(<App />);

      // Test portrait orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        configurable: true,
        value: { angle: 0, type: 'portrait-primary' },
      });

      fireEvent(window, new Event('orientationchange'));

      // Verify layout adapts
      const container = document.querySelector('.container');
      expect(container).toHaveClass('px-4');

      // Test landscape orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        configurable: true,
        value: { angle: 90, type: 'landscape-primary' },
      });

      fireEvent(window, new Event('orientationchange'));

      // Verify layout still works
      expect(container).toHaveClass('px-4');
    });

    it('should maintain visual integrity across different screen sizes', async () => {
      render(<App />);

      // Test various screen sizes
      const screenSizes = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // Desktop small
        { width: 1920, height: 1080 }, // Desktop large
      ];

      for (const size of screenSizes) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height,
        });

        fireEvent(window, new Event('resize'));

        // Verify essential elements are still visible and accessible
        expect(screen.getByText('SnapRate')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your product title/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /get rating prediction/i })).toBeInTheDocument();
      }
    });
  });

  describe('PWA Functionality', () => {
    it('should support PWA capabilities', async () => {
      render(<App />);

      // Check if service worker registration is available
      expect('serviceWorker' in navigator).toBe(true);
      
      // Check for PWA manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      expect(manifestLink).toBeTruthy();
    });
  });
});