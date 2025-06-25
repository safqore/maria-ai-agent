import React from 'react';
import ChatContainer from './components/ChatContainer-new';
import { useSessionUUID } from './hooks/useSessionUUID';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * Main application component for the Maria AI Agent frontend.
 *
 * This component:
 * - Manages the user session using the useSessionUUID hook
 * - Displays appropriate loading/error states
 * - Renders the main ChatContainer when ready
 *
 * @returns {JSX.Element} The rendered application
 */
function App(): JSX.Element {
  const { sessionUUID, loading, error } = useSessionUUID();

  if (loading) {
    return (
      <div className="App">
        <p>Loading session...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="App">
        <p className="error">Session error: {error}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary
        fallback={
          <div className="error-fallback">
            <h2>Something went wrong</h2>
            <p>Please refresh the page to try again.</p>
          </div>
        }
      >
        {/* Pass sessionUUID as a prop to ChatContainer for downstream use */}
        <ChatContainer sessionUUID={sessionUUID} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
