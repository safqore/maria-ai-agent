/**
 * Accessibility Hooks
 *
 * Custom React hooks for improving accessibility, including:
 * - Focus management
 * - Keyboard navigation
 * - ARIA attribute management
 */

import React, { useRef, useEffect, useCallback, useState, RefObject } from 'react';
import { logger } from '../utils/logger';

/**
 * Options for the useFocusTrap hook
 */
interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  active: boolean;
  /** Whether to automatically focus the first focusable element */
  autoFocus?: boolean;
  /** Function to call when focus should return to a previous element */
  onEscape?: () => void;
}

/**
 * Hook to manage a focus trap within a container element
 *
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * @returns Object with function to activate/deactivate the focus trap
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * const { activate, deactivate } = useFocusTrap(modalRef, {
 *   active: isModalOpen,
 *   autoFocus: true,
 *   onEscape: closeModal
 * });
 * ```
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, options: UseFocusTrapOptions) {
  const { active, autoFocus = true, onEscape } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ];

    const elements = containerRef.current.querySelectorAll(focusableSelectors.join(','));

    return Array.from(elements) as HTMLElement[];
  }, [containerRef]);

  /**
   * Handle tab key to keep focus within the container
   */
  const handleTabKey = useCallback(
    (e: KeyboardEvent) => {
      if (!containerRef.current || !active) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle tab and shift+tab to cycle within the container
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      } else if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    },
    [active, containerRef, getFocusableElements]
  );

  /**
   * Handle escape key
   */
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active && onEscape) {
        e.preventDefault();
        onEscape();
      }
    },
    [active, onEscape]
  );

  /**
   * Set up key event listeners
   */
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        handleTabKey(e);
      } else if (e.key === 'Escape') {
        handleEscapeKey(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, handleTabKey, handleEscapeKey]);

  /**
   * Manage focus when the trap is activated/deactivated
   */
  useEffect(() => {
    if (!active) return;

    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element when activated
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus();
        }, 0);
      }
    }

    // Restore focus when deactivated
    return () => {
      if (previousFocusRef.current) {
        try {
          previousFocusRef.current.focus();
        } catch (e) {
          logger.warn('Failed to restore focus', { error: e });
        }
      }
    };
  }, [active, autoFocus, getFocusableElements]);

  const focusTrap = {
    activate: () => {
      // No-op implementation for focus trap activation
    },
    deactivate: () => {
      // No-op implementation for focus trap deactivation
    },
  };

  return focusTrap;
}

/**
 * Options for the useAnnouncer hook
 */
interface UseAnnouncerOptions {
  /** The ARIA live region politeness setting */
  politeness?: 'polite' | 'assertive';
  /** The default timeout before clearing the announcement */
  clearTimeout?: number;
}

/**
 * Hook to create an accessible screen reader announcer
 *
 * @param options - Configuration options
 * @returns Functions to announce messages and the announcer element
 *
 * @example
 * ```tsx
 * const { announce, announcer } = useAnnouncer();
 *
 * const handleAction = () => {
 *   // Perform action
 *   announce('Action completed successfully');
 * };
 *
 * return (
 *   <div>
 *     {announcer}
 *     <button onClick={handleAction}>Perform Action</button>
 *   </div>
 * );
 * ```
 */
export function useAnnouncer(options: UseAnnouncerOptions = {}) {
  const { politeness = 'polite', clearTimeout = 5000 } = options;

  const [message, setMessage] = useState('');
  const timeoutRef = useRef<number | null>(null);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback(
    (newMessage: string, clearDelay: number = clearTimeout) => {
      setMessage(newMessage);

      // Clear previous timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      // Clear message after delay
      if (clearDelay > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setMessage('');
          timeoutRef.current = null;
        }, clearDelay);
      }
    },
    [clearTimeout]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Create the announcer element with React.createElement to avoid JSX in non-TSX files
  const announcer = React.createElement(
    'div',
    {
      'aria-live': politeness,
      'aria-atomic': 'true',
      style: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      },
    },
    message
  );

  return { announce, announcer };
}
