import React from 'react';
import { useSession } from '../contexts/SessionContext';

/**
 * Props for SessionResetModal component
 */
interface SessionResetModalProps {
  /** Additional CSS class names */
  className?: string;
  /** Custom title for the modal */
  title?: string;
  /** Custom message for the modal */
  message?: string;
  /** Custom confirm button text */
  confirmText?: string;
  /** Custom cancel button text */
  cancelText?: string;
}

/**
 * Modal component for confirming session reset
 *
 * This component provides a confirmation dialog when users attempt to reset their session.
 * It includes:
 * - Clear warning about data loss
 * - Confirmation and cancellation options
 * - Keyboard accessibility (Escape to close)
 * - Focus management
 */
export function SessionResetModal({
  className = '',
  title = 'Reset Session',
  message = 'Are you sure you want to reset your session? This will clear all chat history and start a new session. This action cannot be undone.',
  confirmText = 'Reset Session',
  cancelText = 'Cancel',
}: SessionResetModalProps) {
  const { state, confirmResetSession, hideResetModal } = useSession();

  // Don't render if modal is not visible
  if (!state.isResetModalVisible) {
    return null;
  }

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideResetModal();
    }
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      hideResetModal();
    }
  };

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    confirmResetSession();
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    hideResetModal();
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-reset-title"
      aria-describedby="session-reset-message"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="session-reset-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p id="session-reset-message" className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={state.isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={state.isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Resetting...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
