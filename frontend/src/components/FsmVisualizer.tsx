/**
 * FSM State Machine Visualization
 *
 * This file provides a visual representation of the FSM states and their transitions.
 * It's meant to be used for development and debugging purposes only.
 */

import React, { useEffect, useRef } from 'react';
import { StateMachine, States, Transitions } from '../state/FiniteStateMachine';

// State machine visualization styles
const styles = {
  container: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  stateItem: {
    padding: '5px',
    marginBottom: '2px',
  },
  currentState: {
    backgroundColor: '#e3f2fd',
    fontWeight: 'bold',
    border: '1px solid #2196f3',
    borderRadius: '3px',
  },
  transitionsList: {
    marginLeft: '15px',
    fontSize: '12px',
  },
  transitionItem: {
    padding: '2px',
    color: '#666',
  },
  validTransition: {
    color: '#4caf50',
  },
};

/**
 * Props for FsmVisualizer component
 */
interface FsmVisualizerProps {
  /** The FSM instance to visualize */
  fsm: StateMachine;
}

/**
 * Component to visualize FSM states and valid transitions
 *
 * This is a development tool to help understand the current state of the FSM
 * and what transitions are valid from that state.
 */
const FsmVisualizer: React.FC<FsmVisualizerProps> = ({ fsm }) => {
  const [currentState, setCurrentState] = React.useState<States>(fsm.getCurrentState());
  const [, setRenderFlag] = React.useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for state changes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const newState = fsm.getCurrentState();
      if (newState !== currentState) {
        setCurrentState(newState);
      }
      // Force re-render every 1s to catch any external state changes
      setRenderFlag(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fsm, currentState]);

  // Define valid transitions for each state
  const stateTransitions: Record<States, Transitions[]> = {
    [States.WELCOME_MSG]: [Transitions.WELCOME_MSG_COMPLETE],
    [States.USR_INIT_OPTIONS]: [Transitions.YES_CLICKED, Transitions.NO_CLICKED],
    [States.OPPTYS_EXIST_MSG]: [Transitions.OPPTYS_EXIST_MSG_COMPLETE],
    [States.ENGAGE_USR_AGAIN]: [Transitions.LETS_GO_CLICKED, Transitions.MAYBE_NEXT_TIME_CLICKED],
    [States.COLLECTING_NAME]: [Transitions.NAME_PROVIDED],
    [States.COLLECTING_EMAIL]: [Transitions.EMAIL_PROVIDED],
    [States.EMAIL_VERIFICATION_SENDING]: [
      Transitions.EMAIL_CODE_SENT,
      Transitions.EMAIL_VERIFICATION_FAILED,
    ],
    [States.EMAIL_VERIFICATION_CODE_INPUT]: [
      Transitions.EMAIL_CODE_VERIFIED,
      Transitions.EMAIL_VERIFICATION_FAILED,
    ],
    [States.EMAIL_VERIFICATION_COMPLETE]: [Transitions.BOT_CREATION_INITIALISED],
    [States.UPLOAD_DOCS_MSG]: [Transitions.UPLOAD_DOCS_MSG_COMPLETE],
    [States.UPLOAD_DOCS]: [Transitions.DOCS_UPLOADED],
    [States.CREATE_BOT]: [Transitions.BOT_CREATION_INITIALISED],
    [States.END_WORKFLOW]: [],
  };

  // Get UI state description for the current FSM state
  const getUiStateDescription = (state: States): string => {
    switch (state) {
      case States.WELCOME_MSG:
        return 'Welcome message, input disabled, no buttons';
      case States.USR_INIT_OPTIONS:
        return 'Input disabled, Yes/No buttons visible';
      case States.OPPTYS_EXIST_MSG:
        return 'Input disabled, message typing';
      case States.ENGAGE_USR_AGAIN:
        return 'Input disabled, Lets Go/Maybe next time buttons visible';
      case States.COLLECTING_NAME:
        return 'Input enabled, no buttons, collecting name';
      case States.COLLECTING_EMAIL:
        return 'Input enabled, no buttons, collecting email';
      case States.EMAIL_VERIFICATION_SENDING:
        return 'Email verification sending, input disabled, loading state';
      case States.EMAIL_VERIFICATION_CODE_INPUT:
        return 'Email verification code input, code input visible';
      case States.EMAIL_VERIFICATION_COMPLETE:
        return 'Email verification complete, proceeding to bot creation';
      case States.UPLOAD_DOCS_MSG:
        return 'Input disabled, message typing about document upload';
      case States.UPLOAD_DOCS:
        return 'File upload interface visible, input disabled';
      case States.CREATE_BOT:
        return 'Input disabled, Create Bot/End buttons visible';
      case States.END_WORKFLOW:
        return 'Conversation ended, input disabled, no buttons';
      default:
        return 'Unknown state';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>FSM Visualization</div>

      <div>Current State: {currentState}</div>
      <div>UI: {getUiStateDescription(currentState)}</div>

      <div style={{ marginTop: '10px' }}>States:</div>
      {Object.keys(States).map(stateKey => {
        const state = stateKey as keyof typeof States;
        const isCurrentState = States[state] === currentState;

        return (
          <div
            key={stateKey}
            style={{
              ...styles.stateItem,
              ...(isCurrentState ? styles.currentState : {}),
            }}
          >
            {States[state]}

            <div style={styles.transitionsList}>
              {stateTransitions[States[state]]?.map(transition => (
                <div key={transition} style={styles.transitionItem}>
                  ↳ {transition}
                </div>
              ))}
              {stateTransitions[States[state]]?.length === 0 && (
                <div style={styles.transitionItem}>No transitions</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FsmVisualizer;
