import React from 'react';

interface Button {
  text: string;
  value: string;
}

interface ButtonGroupProps {
  buttons: Button[];
  onButtonClick: (value: string) => void;
  isButtonGroupVisible: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  onButtonClick,
  isButtonGroupVisible,
}) => {
  console.log('ButtonGroup rendering with visibility:', isButtonGroupVisible, buttons);
  if (!isButtonGroupVisible) {
    return null;
  }

  return (
    <div className="button-container">
      {buttons.map((button, index) => (
        <button key={index} className="chat-button" onClick={() => onButtonClick(button.value)}>
          {button.text}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;
