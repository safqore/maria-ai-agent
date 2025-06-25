import React from 'react';

/**
 * Represents a clickable button in the ButtonGroup
 */
interface Button {
  /** Text displayed on the button */
  readonly text: string;
  /** Value passed to the click handler when button is clicked */
  readonly value: string;
}

/**
 * Props for the ButtonGroup component
 */
interface ButtonGroupProps {
  /** Array of buttons to render */
  readonly buttons: readonly Button[];
  /** Function called when a button is clicked, with the button value as parameter */
  readonly onButtonClick: (value: string) => void;
  /** Controls whether the button group is displayed */
  readonly isButtonGroupVisible: boolean;
}

/**
 * Component that renders a group of buttons for user interaction
 * 
 * ButtonGroup displays a set of buttons that trigger actions when clicked.
 * It only renders when isButtonGroupVisible is true, otherwise renders nothing.
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  onButtonClick,
  isButtonGroupVisible,
}) => {
  // Don't render anything if the buttons shouldn't be visible
  if (!isButtonGroupVisible) {
    return null;
  }

  return (
    <div className="button-container">
      {buttons.map((button, index) => (
        <button 
          key={index} 
          className="chat-button" 
          onClick={() => onButtonClick(button.value)}
          data-testid={`chat-button-${index}`}
        >
          {button.text}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;
