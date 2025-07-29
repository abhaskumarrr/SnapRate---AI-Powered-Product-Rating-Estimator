import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createContext, useContext } from 'react';
import PredictionButton from './PredictionButton';
import { predictRating } from '../utils/apiClient';

// Mock the app context
const mockAppContext = {
  image: null,
  title: '',
  isLoading: false,
  setLoading: vi.fn(),
  updatePrediction: vi.fn(),
  setError: vi.fn(),
};

// Create a mock context provider
const MockAppContext = createContext(mockAppContext);

// Mock the useAppContext hook
vi.mock('../App', () => ({
  useAppContext: () => useContext(MockAppContext),
}));

// Mock LoadingSpinner component
vi.mock('./index', () => ({
  LoadingSpinner: ({ size, color }) => (
    <div data-testid="loading-spinner" data-size={size} data-color={color}>
      Loading...
    </div>
  ),
}));

// Mock the API client
vi.mock('../utils/apiClient', () => ({
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

// Test wrapper component
const TestWrapper = ({ children, contextValue = mockAppContext }) => (
  <MockAppContext.Provider value={contextValue}>
    {children}
  </MockAppContext.Provider>
);

describe('PredictionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the prediction button', () => {
    render(
      <TestWrapper>
        <PredictionButton />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /get rating prediction/i })).toBeInTheDocument();
  });

  it('shows disabled state when no image is provided', () => {
    render(
      <TestWrapper contextValue={{ ...mockAppContext, title: 'Test Product' }}>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/please add a product image/i)).toBeInTheDocument();
  });

  it('shows disabled state when no title is provided', () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <TestWrapper contextValue={{ ...mockAppContext, image: mockImage }}>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/please add a product title/i)).toBeInTheDocument();
  });

  it('shows disabled state when both image and title are missing', () => {
    render(
      <TestWrapper>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/please add an image and title to get started/i)).toBeInTheDocument();
  });

  it('shows enabled state when both image and title are provided', () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <TestWrapper contextValue={{ ...mockAppContext, image: mockImage, title: 'Test Product' }}>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    expect(button).not.toBeDisabled();
    expect(screen.getByText(/ready to analyze your product/i)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext, 
        image: mockImage, 
        title: 'Test Product',
        isLoading: true 
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    expect(screen.getByText(/analyzing product/i)).toBeInTheDocument();
    expect(screen.getByText(/processing your product data/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls prediction handler when button is clicked', async () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockSetLoading = vi.fn();
    const mockUpdatePrediction = vi.fn();
    
    // Mock the API response
    const mockResponse = {
      rating: 4.2,
      confidence: 85.5,
      explanation: "This product shows strong visual appeal with clear imagery and a well-crafted title."
    };
    
    predictRating.mockResolvedValue(mockResponse);
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext, 
        image: mockImage, 
        title: 'Test Product',
        setLoading: mockSetLoading,
        updatePrediction: mockUpdatePrediction
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    fireEvent.click(button);

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(predictRating).toHaveBeenCalledWith({
        title: 'Test Product',
        imageFile: mockImage
      });
      expect(mockUpdatePrediction).toHaveBeenCalledWith(mockResponse);
    }, { timeout: 3000 });
  });

  it('handles errors during prediction', async () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockSetLoading = vi.fn();
    const mockSetError = vi.fn();
    
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext, 
        image: mockImage, 
        title: 'Test Product',
        setLoading: mockSetLoading,
        setError: mockSetError
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    // Mock fetch to simulate network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    fireEvent.click(button);

    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Restore mocks
    consoleSpy.mockRestore();
  }, 10000);

  it('does not trigger prediction when button is disabled', () => {
    const mockSetLoading = vi.fn();
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext,
        setLoading: mockSetLoading
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /get rating prediction/i });
    fireEvent.click(button);

    expect(mockSetLoading).not.toHaveBeenCalled();
  });

  it('shows correct loading animation dots', () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext, 
        image: mockImage, 
        title: 'Test Product',
        isLoading: true 
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    // Check for the animated dots in the loading state
    const loadingContainer = screen.getByText(/processing your product data/i).parentElement;
    const dots = loadingContainer.querySelectorAll('div[class*="bg-blue-600 rounded-full"]');
    expect(dots).toHaveLength(3);
  });

  it('displays helper text when not loading', () => {
    const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <TestWrapper contextValue={{ 
        ...mockAppContext, 
        image: mockImage, 
        title: 'Test Product'
      }}>
        <PredictionButton />
      </TestWrapper>
    );

    expect(screen.getByText(/our ai will analyze your product image and title/i)).toBeInTheDocument();
  });
});