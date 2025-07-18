/**
 * FsmVisualizer Component
 *
 * This component visualizes the current state of the finite state machine
 * and its possible transitions. It's intended for development use only.
 *
 * @module components/development
 */

import React, { useEffect, useState } from 'react';
import { StateMachine, States, Transitions } from '../../state/FiniteStateMachine';
import { useChat } from '../../contexts/ChatContext';

interface FsmVisualizerProps {
  fsm: StateMachine;
}

const stateColors: Record<States, string> = {
  [States.WELCOME_MSG]: '#e6f7ff',
  [States.USR_INIT_OPTIONS]: '#d9f7be',
  [States.OPPTYS_EXIST_MSG]: '#fff7e6',
  [States.ENGAGE_USR_AGAIN]: '#f9f0ff',
  [States.COLLECTING_NAME]: '#e6fffb',
  [States.UPLOAD_DOCS_MSG]: '#fcffe6',
  [States.UPLOAD_DOCS]: '#fff1f0',
  [States.COLLECTING_EMAIL]: '#f4ffb8',
  [States.EMAIL_VERIFICATION_SENDING]: '#fff2e8',
  [States.EMAIL_VERIFICATION_CODE_INPUT]: '#fff7e6',
  [States.EMAIL_VERIFICATION_COMPLETE]: '#f6ffed',
  [States.CREATE_BOT]: '#e6f7ff',
  [States.END_WORKFLOW]: '#f0f5ff',
};

/**
 * Style object for the visualizer container
 */
const visualizerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '10px',
  right: '10px',
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid #ccc',
  borderRadius: '5px',
  padding: '10px',
  width: '300px',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  fontSize: '12px',
  maxHeight: '400px',
  overflow: 'auto',
};

/**
 * Style for the current state display
 */
const currentStateStyle = (stateColor: string): React.CSSProperties => ({
  padding: '5px',
  marginBottom: '10px',
  backgroundColor: stateColor,
  borderRadius: '3px',
  fontWeight: 'bold',
});

/**
 * Style for the transitions list
 */
const transitionsListStyle: React.CSSProperties = {
  listStyleType: 'none',
  padding: 0,
  margin: 0,
};

/**
 * Style for each transition item
 */
const transitionItemStyle = (available: boolean): React.CSSProperties => ({
  padding: '3px',
  marginBottom: '2px',
  backgroundColor: available ? '#f6ffed' : '#fff1f0',
  color: available ? '#389e0d' : '#cf1322',
  borderRadius: '3px',
  cursor: available ? 'pointer' : 'not-allowed',
});

/**
 * Component to visualize the FSM state and transitions
 */
const FsmVisualizer: React.FC<FsmVisualizerProps> = ({ fsm }) => {
  const { state: chatState } = useChat();
  const [availableTransitions, setAvailableTransitions] = useState<Transitions[]>([]);
  const [showVisualizer, setShowVisualizer] = useState(process.env.NODE_ENV === 'development');

  useEffect(() => {
    // Update available transitions when FSM state changes
    const transitions = Object.values(Transitions).filter(transition =>
      fsm.canTransition(transition as Transitions)
    ) as Transitions[];

    setAvailableTransitions(transitions);
  }, [fsm, chatState.currentFsmState]);

  if (!showVisualizer) {
    return null;
  }

  const currentState = chatState.currentFsmState || States.WELCOME_MSG;

  const handleTransitionClick = (transition: Transitions) => {
    if (fsm.canTransition(transition)) {
      console.log(`[FSM] Manually triggering transition: ${transition}`);
      fsm.transition(transition);
    }
  };

  const toggleVisualizer = () => {
    setShowVisualizer(!showVisualizer);
  };

  return (
    <div style={visualizerStyle} data-testid="fsm-visualizer">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: '0' }}>FSM Visualizer</h3>
        <button
          onClick={toggleVisualizer}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          X
        </button>
      </div>

      <div style={currentStateStyle(stateColors[currentState] || '#f0f0f0')}>
        Current State: {currentState}
      </div>

      <div>
        <h4 style={{ margin: '5px 0' }}>Available Transitions:</h4>
        <ul style={transitionsListStyle}>
          {availableTransitions.map(transition => (
            <li
              key={transition}
              style={transitionItemStyle(true)}
              onClick={() => handleTransitionClick(transition)}
            >
              {transition}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '10px' }}>
        <h4 style={{ margin: '5px 0' }}>Unavailable Transitions:</h4>
        <ul style={transitionsListStyle}>
          {Object.values(Transitions)
            .filter(transition => !availableTransitions.includes(transition as Transitions))
            .map(transition => (
              <li key={transition} style={transitionItemStyle(false)}>
                {transition}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default FsmVisualizer;
