import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonGroup from './ButtonGroup';

describe('ButtonGroup Component', () => {
  const mockButtons = [
    { text: 'Button 1', value: 'button1' },
    { text: 'Button 2', value: 'button2' },
  ];

  const mockClickHandler = jest.fn();

  beforeEach(() => {
    // Reset the mock function before each test
    mockClickHandler.mockReset();
  });

  test('renders buttons when isButtonGroupVisible is true', () => {
    render(
      <ButtonGroup
        buttons={mockButtons}
        onButtonClick={mockClickHandler}
        isButtonGroupVisible={true}
      />
    );

    // Check if buttons are rendered
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
  });

  test('does not render when isButtonGroupVisible is false', () => {
    const { container } = render(
      <ButtonGroup
        buttons={mockButtons}
        onButtonClick={mockClickHandler}
        isButtonGroupVisible={false}
      />
    );

    // Container should be empty when not visible
    expect(container.firstChild).toBeNull();
  });

  test('calls onButtonClick with correct value when button is clicked', () => {
    render(
      <ButtonGroup
        buttons={mockButtons}
        onButtonClick={mockClickHandler}
        isButtonGroupVisible={true}
      />
    );

    // Click the first button
    fireEvent.click(screen.getByText('Button 1'));

    // Check if the click handler was called with the correct value
    expect(mockClickHandler).toHaveBeenCalledWith('button1');

    // Click the second button
    fireEvent.click(screen.getByText('Button 2'));

    // Check if the click handler was called with the correct value
    expect(mockClickHandler).toHaveBeenCalledWith('button2');

    // Check if the click handler was called exactly twice
    expect(mockClickHandler).toHaveBeenCalledTimes(2);
  });
});
