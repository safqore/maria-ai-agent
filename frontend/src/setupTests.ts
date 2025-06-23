// Jest global setup for Maria AI Agent frontend
// Mocks window.location.reload to prevent jsdom errors in all tests

if (typeof window !== 'undefined' && window.location) {
  try {
    // @ts-ignore
    window.location.reload = jest.fn();
  } catch (e) {
    // If not configurable, ignore
  }
}

// Silence jsdom navigation warning for window.location.reload
const originalError = console.error;
console.error = (...args) => {
  if (
    args.some(
      arg =>
        typeof arg === 'string' &&
        arg.includes('Not implemented: navigation (except hash changes)')
    )
  ) {
    return;
  }
  originalError(...args);
};
