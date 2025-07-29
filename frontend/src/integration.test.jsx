/**
 * Integration tests for frontend-backend API connection
 * Tests the complete flow from user input to API response
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

// Helper function to set up inputs
const setupInputs = async (user, titleText = 'Test Product') => {
  // Set up title
  const titleInput = screen.getByPlaceholderText(/enter your product title/i);
  await user.clear(titleInput);
  await user.type(titleInput, titleText);

  // Set up image
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const fileInput = screen.getByRole('button', { name: /upload file/i });
  await user.click(fileInput);
  
  const hiddenFileInput = document.querySelector('input[type="file"]');
  Object.defineProperty(hiddenFileInput, 'files', {
    value: [file],
    writable: false,
  });
  fireEvent.change(hiddenFileInput);

  // Wait for inputs to be processed
  await waitFor(() => {
    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    expect(predictionButton).not.toBeDisabled();
  });

  return { file, titleInput };
};

describe('Frontend-Backend Integration', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should integrate Image and Title inputs with API client', async () => {
    // Mock successful API response
    const mockResponse = {
      rating: 4.2,
      confidence: 85,
      explanation: 'This product shows strong visual appeal with clear branding and professional presentation.'
    };
    
    apiClient.predictRating.mockResolvedValue(mockResponse);

    render(<App />);

    // Find and interact with title input
    const titleInput = screen.getByPlaceholderText(/enter your product title/i);
    await user.type(titleInput, 'Premium Wireless Headphones');

    // Create a mock file for image input
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Find file input (it's hidden, so we need to find it by its input type)
    const fileInput = screen.getByRole('button', { name: /upload file/i });
    await user.click(fileInput);
    
    // Get the actual file input element
    const hiddenFileInput = document.querySelector('input[type="file"]');
    
    // Simulate file selection
    Object.defineProperty(hiddenFileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenFileInput);

    // Wait for image to be processed and prediction button to be enabled
    await waitFor(() => {
      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      expect(predictionButton).not.toBeDisabled();
    });

    // Click the prediction button
    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    await user.click(predictionButton);

    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(apiClient.predictRating).toHaveBeenCalledWith({
        title: 'Premium Wireless Headphones',
        imageFile: file
      });
    });

    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText(/this product shows strong visual appeal/i)).toBeInTheDocument();
    });
  });

  it('should connect Prediction Button to API call with loading state', async () => {
    // Mock API call that takes some time
    let resolvePromise;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    apiClient.predictRating.mockReturnValue(mockPromise);

    render(<App />);

    // Set up inputs
    const titleInput = screen.getByPlaceholderText(/enter your product title/i);
    await user.type(titleInput, 'Test Product');

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /upload file/i });
    await user.click(fileInput);
    
    const hiddenFileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(hiddenFileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenFileInput);

    await waitFor(() => {
      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      expect(predictionButton).not.toBeDisabled();
    });

    // Click prediction button
    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    await user.click(predictionButton);

    // Verify loading state is shown
    expect(screen.getByText(/analyzing product/i)).toBeInTheDocument();
    expect(screen.getByText(/processing your product data/i)).toBeInTheDocument();

    // Resolve the promise
    resolvePromise({
      rating: 3.8,
      confidence: 75,
      explanation: 'Good product with room for improvement.'
    });

    // Verify loading state is cleared and results are shown
    await waitFor(() => {
      expect(screen.queryByText(/analyzing product/i)).not.toBeInTheDocument();
      expect(screen.getByText('3.8 / 5.0')).toBeInTheDocument();
    });
  });

  it('should update Result Display with API response', async () => {
    const mockResponse = {
      rating: 4.7,
      confidence: 92,
      explanation: 'Excellent product with outstanding features and presentation.'
    };
    
    apiClient.predictRating.mockResolvedValue(mockResponse);

    render(<App />);

    // Set up inputs and trigger prediction
    const titleInput = screen.getByPlaceholderText(/enter your product title/i);
    await user.type(titleInput, 'Amazing Product');

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /upload file/i });
    await user.click(fileInput);
    
    const hiddenFileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(hiddenFileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenFileInput);

    await waitFor(() => {
      const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
      expect(predictionButton).not.toBeDisabled();
    });

    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    await user.click(predictionButton);

    // Verify all response data is displayed correctly
    await waitFor(() => {
      // Check rating display
      expect(screen.getByText('4.7 / 5.0')).toBeInTheDocument();
      
      // Check confidence score
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      
      // Check explanation
      expect(screen.getByText(/excellent product with outstanding features/i)).toBeInTheDocument();
      
      // Check star rating (should show 4 full stars and 1 partial)
      const stars = document.querySelectorAll('svg');
      const yellowStars = Array.from(stars).filter(star => 
        star.classList.contains('text-yellow-400')
      );
      expect(yellowStars.length).toBeGreaterThan(0);
    });
  });

  it('should handle API errors with proper error states', async () => {
    // Mock API error
    const mockError = new apiClient.ApiError('Failed to process image', 400);
    apiClient.predictRating.mockRejectedValue(mockError);

    render(<App />);

    // Use helper function to set up inputs
    await setupInputs(user, 'Test Product');

    // Click prediction button
    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    await user.click(predictionButton);

    // Verify error state is displayed
    await waitFor(() => {
      expect(screen.getByText('Prediction Failed')).toBeInTheDocument();
      expect(screen.getAllByText('Failed to process image')[0]).toBeInTheDocument();
      expect(screen.getByText(/please try again or check your inputs/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    const networkError = new Error('Network error - please check your connection');
    apiClient.predictRating.mockRejectedValue(networkError);

    render(<App />);

    // Use helper function to set up inputs
    await setupInputs(user, 'Test Product');

    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    await user.click(predictionButton);

    // Verify generic error message is displayed for non-API errors
    await waitFor(() => {
      expect(screen.getByText('Prediction Failed')).toBeInTheDocument();
      expect(screen.getAllByText('Failed to generate prediction. Please try again.')[0]).toBeInTheDocument();
    });
  });

  it('should disable prediction button when inputs are invalid', async () => {
    render(<App />);

    const predictionButton = screen.getByRole('button', { name: /get rating prediction/i });
    
    // Initially disabled (no inputs)
    expect(predictionButton).toBeDisabled();
    expect(screen.getByText(/please add an image and title to get started/i)).toBeInTheDocument();

    // Add title only
    const titleInput = screen.getByPlaceholderText(/enter your product title/i);
    await user.type(titleInput, 'Test Product');

    await waitFor(() => {
      expect(predictionButton).toBeDisabled();
      expect(screen.getByText(/please add a product image/i)).toBeInTheDocument();
    });

    // Add image
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByRole('button', { name: /upload file/i });
    await user.click(fileInput);
    
    const hiddenFileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(hiddenFileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenFileInput);

    // Now should be enabled
    await waitFor(() => {
      expect(predictionButton).not.toBeDisabled();
      expect(screen.getByText(/ready to analyze your product/i)).toBeInTheDocument();
    });
  });
});