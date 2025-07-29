import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAppContext } from '../App';

// Mock component to provide context
const TestWrapper = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};

describe('useAppContext Hook', () => {
  it('should throw error when used outside of AppProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');

    console.error = originalError;
  });
});