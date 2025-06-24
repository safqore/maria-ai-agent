import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** The child components to render */
  children: ReactNode;
  /** Custom fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Optional callback to run when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error: Error | null;
}

/**
 * Component that catches JavaScript errors in its child component tree and displays a fallback UI.
 *
 * This prevents the entire application from crashing when errors occur in a specific component.
 * It also provides hooks for error reporting and custom error UIs.
 *
 * @example
 * <ErrorBoundary
 *   fallback={<p>Something went wrong. Please try again.</p>}
 *   onError={(error) => console.error('Caught error:', error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error occurs to show the fallback UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error details and call the onError callback if provided
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Render the fallback UI if an error occurred, otherwise render children
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, use a default fallback UI
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try again later.</p>
          {this.state.error && (
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    // If no error occurred, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
