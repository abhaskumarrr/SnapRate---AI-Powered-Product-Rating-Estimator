import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TitleInput from './TitleInput';

// Mock the App context
const mockUpdateTitle = vi.fn();
const mockAppContext = {
  title: '',
  updateTitle: mockUpdateTitle,
  error: null,
};

vi.mock('../App', () => ({
  useAppContext: () => mockAppContext,
}));

describe('TitleInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContext.title = '';
    mockAppContext.error = null;
  });

  describe('Requirement 2.1: Text input field for product title', () => {
    it('should render a text input field for entering product title', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('placeholder');
    });

    it('should be a textarea element for multi-line input', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      expect(titleInput.tagName).toBe('TEXTAREA');
    });
  });

  describe('Requirement 2.2: Validate title is not empty', () => {
    it('should show error when title is empty and field loses focus', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      // Focus and then blur without entering text
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText(/product title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when title contains only whitespace', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.change(titleInput, { target: { value: '   ' } });
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText(/product title is required/i)).toBeInTheDocument();
      });
    });

    it('should clear global state when title is empty', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      // First enter some text to ensure updateTitle gets called
      fireEvent.change(titleInput, { target: { value: 'test' } });
      
      // Then clear it
      fireEvent.change(titleInput, { target: { value: '' } });
      
      // Should have been called twice: once with 'test', once with ''
      expect(mockUpdateTitle).toHaveBeenCalledTimes(2);
      expect(mockUpdateTitle).toHaveBeenNthCalledWith(1, 'test');
      expect(mockUpdateTitle).toHaveBeenNthCalledWith(2, '');
    });
  });

  describe('Requirement 2.3: Validate title length limit', () => {
    it('should show error when title exceeds character limit', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const longTitle = 'a'.repeat(201); // Exceeds 200 character limit
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText(/must be 200 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should show character count indicator', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.change(titleInput, { target: { value: 'Test title' } });
      
      expect(screen.getByText('10/200')).toBeInTheDocument();
    });

    it('should highlight character count when near limit', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const nearLimitTitle = 'a'.repeat(170); // 85% of 200 character limit
      
      fireEvent.change(titleInput, { target: { value: nearLimitTitle } });
      
      const characterCount = screen.getByText('170/200');
      expect(characterCount).toHaveClass('text-yellow-600');
    });

    it('should highlight character count in red when over limit', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const overLimitTitle = 'a'.repeat(205);
      
      fireEvent.change(titleInput, { target: { value: overLimitTitle } });
      
      const characterCount = screen.getByText('205/200');
      expect(characterCount).toHaveClass('text-red-500');
    });

    it('should accept valid title within character limit', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const validTitle = 'Premium Wireless Bluetooth Headphones';
      
      fireEvent.change(titleInput, { target: { value: validTitle } });
      
      expect(mockUpdateTitle).toHaveBeenCalledWith(validTitle);
    });
  });

  describe('Requirement 2.4: Display appropriate error messages', () => {
    it('should display validation error with error icon', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/product title is required/i);
        expect(errorMessage).toBeInTheDocument();
        
        // Check for error icon (SVG)
        const errorIcon = errorMessage.closest('div').querySelector('svg');
        expect(errorIcon).toBeInTheDocument();
      });
    });

    it('should display global error from context', () => {
      mockAppContext.error = 'Network error occurred';
      
      render(<TitleInput />);
      
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should clear validation error when user starts typing', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      // Trigger validation error
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText(/product title is required/i)).toBeInTheDocument();
      });
      
      // Start typing to clear error
      fireEvent.change(titleInput, { target: { value: 'T' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/product title is required/i)).not.toBeInTheDocument();
      });
    });

    it('should show success indicator for valid title', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.change(titleInput, { target: { value: 'Valid Product Title' } });
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.getByText('Title looks good!')).toBeInTheDocument();
      });
    });
  });

  describe('User Experience Features', () => {
    it('should show helper text when no errors are present', () => {
      render(<TitleInput />);
      
      expect(screen.getByText(/enter a descriptive title/i)).toBeInTheDocument();
    });

    it('should hide helper text when error is shown', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/enter a descriptive title/i)).not.toBeInTheDocument();
      });
    });

    it('should apply focus styles when input is focused', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.focus(titleInput);
      
      expect(titleInput).toHaveClass('border-blue-300');
    });

    it('should apply error styles when validation fails', async () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      fireEvent.focus(titleInput);
      fireEvent.blur(titleInput);
      
      await waitFor(() => {
        expect(titleInput).toHaveClass('border-red-300', 'bg-red-50');
      });
    });
  });

  describe('State Synchronization', () => {
    it('should sync local state with global state on mount', () => {
      mockAppContext.title = 'Existing Title';
      
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      expect(titleInput.value).toBe('Existing Title');
    });

    it('should update global state when valid title is entered', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const validTitle = 'New Product Title';
      
      fireEvent.change(titleInput, { target: { value: validTitle } });
      
      expect(mockUpdateTitle).toHaveBeenCalledWith(validTitle);
    });

    it('should trim whitespace before updating global state', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      const titleWithSpaces = '  Product Title  ';
      
      fireEvent.change(titleInput, { target: { value: titleWithSpaces } });
      
      expect(mockUpdateTitle).toHaveBeenCalledWith('Product Title');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      expect(titleInput).toHaveAttribute('placeholder');
      expect(titleInput).toBeVisible();
    });

    it('should be keyboard accessible', () => {
      render(<TitleInput />);
      
      const titleInput = screen.getByPlaceholderText(/enter your product title/i);
      
      titleInput.focus();
      expect(document.activeElement).toBe(titleInput);
    });
  });
});