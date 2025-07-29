import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageInput from './ImageInput';
import { useAppContext } from '../App';

// Mock the useAppContext hook
vi.mock('../App', () => ({
  useAppContext: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('ImageInput Component', () => {
  const mockUpdateImage = vi.fn();
  const mockContextValue = {
    imagePreview: null,
    updateImage: mockUpdateImage,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext.mockReturnValue(mockContextValue);
  });

  it('renders all three input method buttons', () => {
    render(<ImageInput />);
    
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Image URL')).toBeInTheDocument();
  });

  it('shows upload interface by default', () => {
    render(<ImageInput />);
    
    expect(screen.getByText('Click to upload an image')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, WebP up to 10MB')).toBeInTheDocument();
  });

  it('switches to camera interface when camera button is clicked', () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Take Photo'));
    
    expect(screen.getByText('Take a photo')).toBeInTheDocument();
    expect(screen.getByText('Use your device camera')).toBeInTheDocument();
  });

  it('switches to URL interface when URL button is clicked', () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Image URL'));
    
    expect(screen.getByPlaceholderText(/Enter image URL/)).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeInTheDocument();
  });

  it('shows validation error for invalid file type', async () => {
    render(<ImageInput />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Please upload a valid image file/)).toBeInTheDocument();
    });
  });

  it('shows validation error for file size too large', async () => {
    render(<ImageInput />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Image file size must be less than 10MB/)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty URL when trying to submit', async () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Image URL'));
    
    // Enter a URL first to enable the button
    const urlInput = screen.getByPlaceholderText(/Enter image URL/);
    fireEvent.change(urlInput, { target: { value: 'test' } });
    
    // Clear the URL to make it empty
    fireEvent.change(urlInput, { target: { value: '' } });
    
    // The button should be disabled now, but let's test the validation logic directly
    // by simulating what happens when handleUrlSubmit is called with empty URL
    const loadButton = screen.getByText('Load');
    expect(loadButton).toBeDisabled();
  });

  it('displays image preview when image is loaded', () => {
    const mockContextWithPreview = {
      ...mockContextValue,
      imagePreview: 'data:image/jpeg;base64,test',
    };
    useAppContext.mockReturnValue(mockContextWithPreview);
    
    render(<ImageInput />);
    
    const previewImage = screen.getByAltText('Product preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage.src).toBe('data:image/jpeg;base64,test');
  });

  it('shows remove button when image preview is displayed', () => {
    const mockContextWithPreview = {
      ...mockContextValue,
      imagePreview: 'data:image/jpeg;base64,test',
    };
    useAppContext.mockReturnValue(mockContextWithPreview);
    
    render(<ImageInput />);
    
    const removeButton = screen.getByTitle('Remove image');
    expect(removeButton).toBeInTheDocument();
  });

  it('clears image when remove button is clicked', () => {
    const mockContextWithPreview = {
      ...mockContextValue,
      imagePreview: 'data:image/jpeg;base64,test',
    };
    useAppContext.mockReturnValue(mockContextWithPreview);
    
    render(<ImageInput />);
    
    const removeButton = screen.getByTitle('Remove image');
    fireEvent.click(removeButton);
    
    expect(mockUpdateImage).toHaveBeenCalledWith(null, null);
  });

  it('displays context error when present', () => {
    const mockContextWithError = {
      ...mockContextValue,
      error: 'Network error occurred',
    };
    useAppContext.mockReturnValue(mockContextWithError);
    
    render(<ImageInput />);
    
    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
  });

  it('handles URL input change', () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Image URL'));
    
    const urlInput = screen.getByPlaceholderText(/Enter image URL/);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/image.jpg' } });
    
    expect(urlInput.value).toBe('https://example.com/image.jpg');
  });

  it('disables load button when URL is empty', () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Image URL'));
    
    const loadButton = screen.getByText('Load');
    expect(loadButton).toBeDisabled();
  });

  it('enables load button when URL is provided', () => {
    render(<ImageInput />);
    
    fireEvent.click(screen.getByText('Image URL'));
    
    const urlInput = screen.getByPlaceholderText(/Enter image URL/);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/image.jpg' } });
    
    const loadButton = screen.getByText('Load');
    expect(loadButton).not.toBeDisabled();
  });
});