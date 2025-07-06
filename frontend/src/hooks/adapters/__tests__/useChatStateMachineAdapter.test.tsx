import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import useChatStateMachineAdapter from '../useChatStateMachineAdapter';
import { ChatProvider } from '../../../contexts/ChatContext';
import { StateMachine, States, Transitions } from '../../../state/FiniteStateMachine';

// Mock the state machine
const mockFsm = {
  getCurrentState: jest.fn().mockReturnValue(States.WELCOME_MSG),
  reset: jest.fn(),
  transition: jest.fn(),
  canTransition: jest.fn().mockReturnValue(true),
  getResponseDisplayValue: jest.fn().mockImplementation(val => val),
  getState: jest.fn().mockReturnValue(States.WELCOME_MSG),
} as unknown as StateMachine;

// Wrapper component to provide the ChatContext
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatProvider fsm={mockFsm}>{children}</ChatProvider>
);

describe('useChatStateMachineAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with the FSM state', () => {
    const { result } = renderHook(() => useChatStateMachineAdapter(mockFsm), {
      wrapper: TestWrapper,
    });

    expect(result.current.fsm).toBe(mockFsm);
    expect(mockFsm.getCurrentState).toHaveBeenCalled();
  });

  it('should provide getCurrentState method', () => {
    const { result } = renderHook(() => useChatStateMachineAdapter(mockFsm), {
      wrapper: TestWrapper,
    });

    expect(result.current.getCurrentState()).toBe(States.WELCOME_MSG);
    expect(mockFsm.getCurrentState).toHaveBeenCalled();
  });

  it('should provide performTransition method', () => {
    const { result } = renderHook(() => useChatStateMachineAdapter(mockFsm), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.performTransition(Transitions.WELCOME_MSG_COMPLETE);
    });

    expect(mockFsm.canTransition).toHaveBeenCalledWith(Transitions.WELCOME_MSG_COMPLETE);
    expect(mockFsm.transition).toHaveBeenCalledWith(Transitions.WELCOME_MSG_COMPLETE);
  });

  it('should provide reset method', () => {
    const { result } = renderHook(() => useChatStateMachineAdapter(mockFsm), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.reset();
    });

    expect(mockFsm.reset).toHaveBeenCalled();
  });

  it('should provide canTransition method', () => {
    const { result } = renderHook(() => useChatStateMachineAdapter(mockFsm), {
      wrapper: TestWrapper,
    });

    expect(result.current.canTransition(Transitions.WELCOME_MSG_COMPLETE)).toBe(true);
    expect(mockFsm.canTransition).toHaveBeenCalledWith(Transitions.WELCOME_MSG_COMPLETE);
  });
});
