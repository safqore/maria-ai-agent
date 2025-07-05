import React from 'react';
import { useSession } from '../contexts/SessionContext';

/**
 * Props for SessionControls component
 */
interface SessionControlsProps {
  /** Additional CSS class names */
  className?: string;
  /** Whether to show the session UUID */
  showUUID?: boolean;
}

/**
 * Development component for testing session functionality
 *
 * This component provides manual controls for:
 * - Viewing current session UUID
 * - Resetting the session
 * - Viewing session state
 *
 * Useful for testing and development purposes.
 */
export function SessionControls({ className = '', showUUID = true }: SessionControlsProps) {
  const { state, resetSession, clearError, showResetModal } = useSession();

  return (
    <div className={`session-controls p-4 bg-gray-100 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Session Controls</h3>

      {/* Session UUID Display */}
      {showUUID && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Session UUID:</label>
          <code className="block p-2 bg-white border rounded text-sm font-mono break-all">
            {state.sessionUUID || 'Not initialized'}
          </code>
        </div>
      )}

      {/* Session Status */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              state.isLoading
                ? 'bg-yellow-500'
                : state.error
                ? 'bg-red-500'
                : state.sessionUUID
                ? 'bg-green-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-sm">
            {state.isLoading
              ? 'Loading...'
              : state.error
              ? 'Error'
              : state.sessionUUID
              ? 'Active'
              : 'Not initialized'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Error:</label>
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {state.error}
          </div>
          <button
            onClick={clearError}
            className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
          >
            Clear error
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={showResetModal}
          disabled={state.isLoading}
          className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset Session (with confirmation)
        </button>

        <button
          onClick={() => resetSession(false)}
          disabled={state.isLoading}
          className="w-full px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset Session (immediate)
        </button>
      </div>

      {/* Modal Status */}
      {state.isResetModalVisible && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          Modal is visible
        </div>
      )}
    </div>
  );
}
