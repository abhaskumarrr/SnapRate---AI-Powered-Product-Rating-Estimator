import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Context Integration', () => {
  it('should render the app with context provider', () => {
    render(<App />);
    
    // Verify that the app renders without context errors
    expect(screen.getByText('SnapRate')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Product Rating Estimator')).toBeInTheDocument();
  });

  it('should have responsive layout classes', () => {
    render(<App />);
    
    // Check for responsive container classes
    const container = screen.getByText('SnapRate').closest('.container');
    expect(container).toHaveClass('mx-auto', 'px-4');
    
    // Check for responsive grid layout
    const gridContainer = screen.getByText('Product Information').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });

  it('should have proper semantic structure', () => {
    render(<App />);
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SnapRate');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
  });
});