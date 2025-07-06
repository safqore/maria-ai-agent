/**
 * Types related to interactive buttons in the chat interface
 */

/**
 * Button object for interactive chat options
 */
export interface Button {
  /** Text to display on the button */
  text: string;
  /** Value to return when the button is clicked */
  value: string;
  /** Optional additional CSS classes */
  className?: string;
}
