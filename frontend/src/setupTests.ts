// Jest global setup for Maria AI Agent frontend
// Mocks window.location.reload to prevent jsdom errors in all tests

// Import @testing-library/jest-dom to enable custom matchers
import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && window.location) {
  try {
    // Use type assertion to avoid TypeScript errors on read-only property
    (window.location as any).reload = jest.fn();
  } catch (e) {
    // If not configurable, ignore
  }
}

// Silence jsdom navigation warning and React act() warnings
const originalError = console.error;
console.error = (...args) => {
  // Silence navigation warning
  if (
    args.some(
      arg =>
        typeof arg === 'string' && arg.includes('Not implemented: navigation (except hash changes)')
    )
  ) {
    return;
  }
  
  // Silence React act() warnings - these happen with async hooks and don't necessarily indicate problems
  // when tests are otherwise passing
  if (
    args.some(
      arg =>
        typeof arg === 'string' && arg.includes('was not wrapped in act')
    )
  ) {
    return;
  }
  
  originalError(...args);
};
