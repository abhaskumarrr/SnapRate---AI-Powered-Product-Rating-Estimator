import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResultDisplay from './ResultDisplay';

describe('ResultDisplay', () => {
  const mockProps = {
    rating: 4.2,
    confidence: 85,
    explanation: 'This product has excellent visual appeal with high-quality imagery and compelling title that suggests premium quality.',
    animated: false // Disable animations for testing
  };

  describe('Star Rating Display', () => {
    it('displays correct number of full stars for whole number rating', () => {
      const { container } = render(<ResultDisplay rating={4.0} animated={false} />);
      
      // Should have 5 SVG elements (stars)
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(5);
      
      // Should display the correct rating text
      expect(screen.getByText('4.0 / 5.0')).toBeInTheDocument();
    });

    it('displays partial stars for decimal ratings', () => {
      render(<ResultDisplay rating={3.7} animated={false} />);
      
      // Should display rating with partial star
      expect(screen.getByText('3.7 / 5.0')).toBeInTheDocument();
    });

    it('displays rating with decimal precision', () => {
      render(<ResultDisplay {...mockProps} />);
      
      expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
    });

    it('handles edge case ratings correctly', () => {
      // Test minimum rating
      render(<ResultDisplay rating={1.0} animated={false} />);
      expect(screen.getByText('1.0 / 5.0')).toBeInTheDocument();

      // Test maximum rating
      render(<ResultDisplay rating={5.0} animated={false} />);
      expect(screen.getByText('5.0 / 5.0')).toBeInTheDocument();
    });
  });

  describe('Confidence Score Display', () => {
    it('displays confidence score as percentage', () => {
      render(<ResultDisplay confidence={85} animated={false} />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('shows high confidence label for scores >= 80', () => {
      render(<ResultDisplay confidence={85} animated={false} />);
      
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('shows medium confidence label for scores 60-79', () => {
      render(<ResultDisplay confidence={70} animated={false} />);
      
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('shows low confidence label for scores < 60', () => {
      render(<ResultDisplay confidence={45} animated={false} />);
      
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });

    it('applies correct styling based on confidence level', () => {
      const { rerender } = render(<ResultDisplay confidence={85} animated={false} />);
      
      // High confidence should have green styling
      expect(screen.getByText('High Confidence').parentElement).toHaveClass('text-green-600', 'bg-green-100');

      rerender(<ResultDisplay confidence={70} animated={false} />);
      // Medium confidence should have yellow styling
      expect(screen.getByText('Medium Confidence').parentElement).toHaveClass('text-yellow-600', 'bg-yellow-100');

      rerender(<ResultDisplay confidence={45} animated={false} />);
      // Low confidence should have red styling
      expect(screen.getByText('Low Confidence').parentElement).toHaveClass('text-red-600', 'bg-red-100');
    });
  });

  describe('Explanation Text Display', () => {
    it('displays explanation text with proper heading', () => {
      render(<ResultDisplay explanation={mockProps.explanation} animated={false} />);
      
      expect(screen.getByText('Rating Explanation')).toBeInTheDocument();
      expect(screen.getByText(mockProps.explanation)).toBeInTheDocument();
    });

    it('applies proper styling to explanation section', () => {
      render(<ResultDisplay explanation={mockProps.explanation} animated={false} />);
      
      const explanationContainer = screen.getByText(mockProps.explanation).closest('div');
      expect(explanationContainer).toHaveClass('bg-gray-50', 'rounded-lg', 'p-4', 'border', 'border-gray-200');
    });
  });

  describe('Component Rendering Logic', () => {
    it('renders nothing when no props are provided', () => {
      const { container } = render(<ResultDisplay />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders only rating section when only rating is provided', () => {
      render(<ResultDisplay rating={4.2} animated={false} />);
      
      expect(screen.getByText('Predicted Rating')).toBeInTheDocument();
      expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
      expect(screen.queryByText('High Confidence')).not.toBeInTheDocument();
      expect(screen.queryByText('Rating Explanation')).not.toBeInTheDocument();
    });

    it('renders only confidence section when only confidence is provided', () => {
      render(<ResultDisplay confidence={85} animated={false} />);
      
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.queryByText('Predicted Rating')).not.toBeInTheDocument();
      expect(screen.queryByText('Rating Explanation')).not.toBeInTheDocument();
    });

    it('renders only explanation section when only explanation is provided', () => {
      render(<ResultDisplay explanation={mockProps.explanation} animated={false} />);
      
      expect(screen.getByText('Rating Explanation')).toBeInTheDocument();
      expect(screen.queryByText('Predicted Rating')).not.toBeInTheDocument();
      expect(screen.queryByText('High Confidence')).not.toBeInTheDocument();
    });

    it('renders all sections when all props are provided', () => {
      render(<ResultDisplay {...mockProps} />);
      
      expect(screen.getByText('Predicted Rating')).toBeInTheDocument();
      expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Rating Explanation')).toBeInTheDocument();
      expect(screen.getByText(mockProps.explanation)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className when provided', () => {
      const customClass = 'custom-result-class';
      const { container } = render(
        <ResultDisplay rating={4.2} className={customClass} animated={false} />
      );
      
      expect(container.firstChild).toHaveClass(customClass);
    });

    it('maintains proper spacing between sections', () => {
      const { container } = render(<ResultDisplay {...mockProps} />);
      
      expect(container.firstChild).toHaveClass('space-y-6');
    });
  });

  describe('Animation Props', () => {
    it('accepts animated prop and passes it to child components', () => {
      // This test ensures the animated prop is properly handled
      // The actual animation testing would require more complex setup with framer-motion
      render(<ResultDisplay {...mockProps} animated={true} />);
      
      // Component should render without errors when animated is true
      expect(screen.getByText('Predicted Rating')).toBeInTheDocument();
    });

    it('works correctly when animated is false', () => {
      render(<ResultDisplay {...mockProps} animated={false} />);
      
      expect(screen.getByText('Predicted Rating')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Rating Explanation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ResultDisplay {...mockProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Predicted Rating');
      
      const subHeading = screen.getByRole('heading', { level: 3 });
      expect(subHeading).toHaveTextContent('Rating Explanation');
    });

    it('provides meaningful text content for screen readers', () => {
      render(<ResultDisplay {...mockProps} />);
      
      // Rating value should be clearly displayed
      expect(screen.getByText('4.2 / 5.0')).toBeInTheDocument();
      
      // Confidence information should be clear
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
});