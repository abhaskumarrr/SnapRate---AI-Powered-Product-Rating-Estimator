import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('SnapRate')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    expect(screen.getByText('AI-Powered Product Rating Estimator')).toBeInTheDocument();
  });

  it('renders the product information section', () => {
    render(<App />);
    expect(screen.getByText('Product Information')).toBeInTheDocument();
  });

  it('renders the rating prediction section', () => {
    render(<App />);
    expect(screen.getByText('Rating Prediction')).toBeInTheDocument();
  });

  it('renders components', () => {
    render(<App />);
    // Check for ImageInput component elements
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Image URL')).toBeInTheDocument();
    expect(screen.getByText('Click to upload an image')).toBeInTheDocument();
    
    // Check for TitleInput component elements
    expect(screen.getByPlaceholderText(/enter your product title/i)).toBeInTheDocument();
    expect(screen.getByText('0/200')).toBeInTheDocument();
    
    // Check for prediction button
    expect(screen.getByRole('button', { name: /get rating prediction/i })).toBeInTheDocument();
    
    // Check for ResultDisplay empty state
    expect(screen.getByText('Ready for Analysis')).toBeInTheDocument();
    expect(screen.getByText(/Upload a product image and enter a title/)).toBeInTheDocument();
  });
});