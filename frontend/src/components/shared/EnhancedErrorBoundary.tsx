import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError, ApiErrorType } from '../../api/config';

/**
 * Props for EnhancedErrorBoundary component
 */
interface EnhancedErrorBoundaryProps {
  /** The child components to render */
  children: ReactNode;
  /** Custom fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Optional callback to run when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo, correlationId?: string) => void;
  /** Whether to show detailed error information (for development) */
  showDetails?: boolean;
  /** Context name for better error reporting */
  context?: string;
}

/**
 * State for EnhancedErrorBoundary component
 */
interface EnhancedErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
  /** Error info from React */
  errorInfo: ErrorInfo | null;
  /** Correlation ID for tracking */
  correlationId?: string;
  /** Retry count for error recovery */
  retryCount: number;
}

/**
 * Enhanced Error Boundary component with correlation ID tracking and better error reporting.
 *
 * This component catches JavaScript errors in its child component tree, displays a fallback UI,
 * and provides enhanced error reporting with correlation IDs for better debugging.
 *
 * @example
 * <EnhancedErrorBoundary
 *   context="Chat"
 *   fallback={<p>Chat is temporarily unavailable</p>}
 *   onError={(error, errorInfo, correlationId) => {
 *     console.error('Chat error:', error, 'Correlation ID:', correlationId);
 *   }}
 *   showDetails={process.env.NODE_ENV === 'development'}
 * >
 *   <ChatComponent />
 * </EnhancedErrorBoundary>
 */
export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: undefined,
      retryCount: 0,
    };
  }

  /**
   * Update state when an error occurs to show the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    // Extract correlation ID from API errors
    let correlationId: string | undefined;
    if (error instanceof ApiError && error.details?.correlationId) {
      correlationId = error.details.correlationId;
    }

    return {
      hasError: true,
      error,
      correlationId,
    };
  }

  /**
   * Log error details and call the onError callback if provided
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { context, onError } = this.props;
    const { correlationId } = this.state;

    // Update state with error info
    this.setState({ errorInfo });

    // Enhanced error logging
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: context || 'Unknown',
      correlationId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console with structured data
    console.group(`🚨 Error Boundary: ${context || 'Component'} Error`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    if (correlationId) {
      console.error('Correlation ID:', correlationId);
    }
    console.groupEnd();

    // Call the onError callback if provided
    if (onError) {
      onError(error, errorInfo, correlationId);
    }

    // Report to external error tracking service (if available)
    this.reportError(errorDetails);
  }

  /**
   * Report error to external tracking service
   */
  private reportError = (errorDetails: any): void => {
    // This is where you'd integrate with error tracking services like Sentry, LogRocket, etc.
    // For now, we'll just log it
    try {
      // Example: Send to backend error tracking endpoint
      fetch('/api/v1/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'frontend_error',
          details: errorDetails,
        }),
      }).catch(() => {
        // Silently fail - don't cause additional errors
      });
    } catch (e) {
      // Silently fail - error reporting shouldn't break the app
    }
  };

  /**
   * Handle retry functionality
   */
  private handleRetry = (): void => {
    const { retryCount } = this.state;

    if (retryCount >= 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: undefined,
      retryCount: retryCount + 1,
    });
  };

  /**
   * Handle component refresh
   */
  private handleRefresh = (): void => {
    window.location.reload();
  };

  /**
   * Get user-friendly error message based on error type
   */
  private getUserFriendlyMessage(): string {
    const { error } = this.state;
    const { context } = this.props;

    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.NETWORK:
          return `Network connection issue in ${
            context || 'the application'
          }. Please check your internet connection.`;
        case ApiErrorType.TIMEOUT:
          return `Request timeout in ${
            context || 'the application'
          }. The server is taking too long to respond.`;
        case ApiErrorType.UNAUTHORIZED:
          return `Authentication required for ${
            context || 'this feature'
          }. Please refresh and try again.`;
        case ApiErrorType.SERVER:
          return `Server error in ${context || 'the application'}. Our team has been notified.`;
        case ApiErrorType.VALIDATION:
          return `Invalid data in ${
            context || 'the application'
          }. Please check your input and try again.`;
        default:
          return `An error occurred in ${context || 'the application'}. Please try again.`;
      }
    }

    // Generic error message
    return `Something went wrong in ${context || 'the application'}. Please try again.`;
  }

  /**
   * Render the fallback UI if an error occurred, otherwise render children
   */
  render(): ReactNode {
    const { hasError, error, errorInfo, correlationId, retryCount } = this.state;
    const { fallback, showDetails, context } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, use an enhanced default fallback UI
      return (
        <div
          className="error-boundary"
          role="alert"
          style={{
            padding: '20px',
            margin: '10px',
            border: '2px solid #ff4444',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#333',
          }}
        >
          <h2 style={{ color: '#d32f2f', marginTop: 0 }}>
            🚨 {context ? `${context} Error` : 'Application Error'}
          </h2>

          <p style={{ fontSize: '16px', marginBottom: '16px' }}>{this.getUserFriendlyMessage()}</p>

          {correlationId && (
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              <strong>Error ID:</strong> <code>{correlationId}</code>
              <br />
              <small>Please include this ID when reporting the issue.</small>
            </p>
          )}

          <div style={{ marginBottom: '16px' }}>
            {retryCount < 3 && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  marginRight: '8px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Try Again ({3 - retryCount} attempts left)
              </button>
            )}

            <button
              onClick={this.handleRefresh}
              style={{
                padding: '8px 16px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>

          {showDetails && error && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Technical Details (Development)
              </summary>
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                <div>
                  <strong>Error:</strong> {error.toString()}
                </div>
                {error.stack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Stack Trace:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Component Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    // If no error occurred, render children normally
    return this.props.children;
  }

  /**
   * Clean up timeouts when component unmounts
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
}

export default EnhancedErrorBoundary;
