import React from 'react';
import { States, Transitions } from '../../state/FiniteStateMachine';
import { useChat } from '../../contexts/ChatContext';

/**
 * CSS styles for the visualizer components
 */
const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#00ff00',
    fontFamily: 'monospace',
    padding: '15px',
    borderRadius: '5px',
    maxWidth: '300px',
    zIndex: 1000,
  },
  sectionHeading: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#ffffff',
  },
  stateDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '5px',
    marginBottom: '10px',
    borderRadius: '3px',
    fontWeight: 'bold' as const,
  },
  transitionsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  transitionItem: {
    margin: '2px 0',
    fontSize: '12px',
  },
};

/**
 * Props for the FSM Visualizer component
 */
interface FsmVisualizerProps {
  /** Whether to show the visualizer (defaults to true in dev, false in prod) */
  isVisible?: boolean;
}

/**
 * A component that visualizes the current state of the FSM for development purposes.
 * This component is intended for debugging and development use only.
 *
 * @param {FsmVisualizerProps} props - Component props
 * @returns {React.ReactElement | null} The visualizer component or null if not visible
 */
const FsmVisualizer: React.FC<FsmVisualizerProps> = ({
  isVisible = process.env.NODE_ENV !== 'production',
}) => {
  const { state } = useChat();
  const { currentFsmState } = state;

  // Don't render in production unless explicitly enabled
  if (!isVisible) {
    return null;
  }

  // Map that defines valid state transitions for visualization
  const stateTransitionMap: { [key in States]?: Transitions[] } = {
    [States.WELCOME_MSG]: [Transitions.WELCOME_MSG_COMPLETE],
    [States.USR_INIT_OPTIONS]: [Transitions.YES_CLICKED, Transitions.NO_CLICKED],
    [States.OPPTYS_EXIST_MSG]: [Transitions.OPPTYS_EXIST_MSG_COMPLETE],
    [States.ENGAGE_USR_AGAIN]: [Transitions.LETS_GO_CLICKED, Transitions.MAYBE_NEXT_TIME_CLICKED],
    [States.COLLECTING_NAME]: [Transitions.NAME_PROVIDED],
    [States.UPLOAD_DOCS_MSG]: [Transitions.UPLOAD_DOCS_MSG_COMPLETE],
    [States.UPLOAD_DOCS]: [Transitions.DOCS_UPLOADED],
    [States.COLLECTING_EMAIL]: [Transitions.EMAIL_PROVIDED],
    [States.CREATE_BOT]: [Transitions.BOT_CREATION_INITIALISED],
  };

  // Get available transitions for current state
  const availableTransitions = currentFsmState ? stateTransitionMap[currentFsmState] || [] : [];

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionHeading}>FSM Visualizer (Dev Only)</h3>
      <div style={styles.stateDisplay}>Current State: {currentFsmState || 'Unknown'}</div>
      <h3 style={styles.sectionHeading}>Available Transitions:</h3>
      <ul style={styles.transitionsList}>
        {availableTransitions.map(transition => (
          <li style={styles.transitionItem} key={transition}>
            {transition}
          </li>
        ))}
        {availableTransitions.length === 0 && <li style={styles.transitionItem}>None</li>}
      </ul>
    </div>
  );
};

export default FsmVisualizer;
