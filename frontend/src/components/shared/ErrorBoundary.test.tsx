import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

// Create a component that throws an error for testing
const BrokenComponent = ({ shouldThrow }: { shouldThrow: boolean }): JSX.Element => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Component working correctly</div>;
};

// Suppress console.error during tests to avoid noisy output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component working correctly')).toBeInTheDocument();
  });

  it('renders default fallback when an error occurs', () => {
    // Using jest.spyOn to mock the console.error for this specific test
    jest.spyOn(console, 'error').mockImplementation(message => {
      /* suppress error logs during test */
    });

    // We need to suppress the error boundary warning in React
    const spy = jest.spyOn(global.console, 'error');
    spy.mockImplementation(message => {
      /* suppress error logs during test */
    });

    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/the application encountered an error/i)).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    // Suppress error boundary warning
    const spy = jest.spyOn(global.console, 'error');
    spy.mockImplementation(message => {
      /* suppress error logs during test */
    });

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('calls onError callback when an error occurs', () => {
    // Suppress error boundary warning
    const spy = jest.spyOn(global.console, 'error');
    spy.mockImplementation(message => {
      /* suppress error logs during test */
    });

    const handleError = jest.fn();

    render(
      <ErrorBoundary onError={handleError}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );

    spy.mockRestore();
  });
});
