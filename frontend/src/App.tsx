import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatContainer from './components/ChatContainer-new';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { SessionResetModal } from './components/SessionResetModal';
import { SessionControls } from './components/SessionControls';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * Inner app component that uses session context
 */
function AppContent(): JSX.Element {
  const { state } = useSession();

  if (state.isLoading && !state.isInitialized) {
    return (
      <div className="App flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing session...</p>
        </div>
      </div>
    );
  }

  if (state.error && !state.sessionUUID) {
    return (
      <div className="App flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Error</h2>
          <p className="text-red-600 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary
        fallback={
          <div className="error-fallback flex items-center justify-center min-h-screen">
            <div className="text-center max-w-md mx-auto p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        {/* Development controls - only show in development */}
        {process.env.NODE_ENV === 'development' &&
          process.env.REACT_APP_SHOW_DEV_CONTROLS === 'true' && (
            <div className="fixed top-4 right-4 z-40 max-w-xs">
              <SessionControls />
            </div>
          )}

        {/* No longer need to pass sessionUUID as prop - components can use useSessionUUID hook */}
        <ChatContainer />

        {/* Session reset modal */}
        <SessionResetModal />
      </ErrorBoundary>
    </div>
  );
}

/**
 * Main application component for the Maria AI Agent frontend.
 *
 * This component:
 * - Provides session management via SessionProvider
 * - Sets up toast notifications for user feedback
 * - Manages loading and error states for session initialization
 * - Renders the main ChatContainer when ready
 *
 * @returns {JSX.Element} The rendered application
 */
function App(): JSX.Element {
  return (
    <SessionProvider enableNotifications={true}>
      <AppContent />

      {/* Toast notification container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: 2000,
          },
        }}
      />
    </SessionProvider>
  );
}

export default App;
