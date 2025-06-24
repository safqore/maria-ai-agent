/**
 * Finite State Machine implementation for the chat workflow.
 *
 * This module provides a state machine implementation to manage the complex
 * conversational flow of the Maria AI Agent chat interface.
 */

/**
 * Enum defining all possible states in the conversation workflow.
 */
export enum States {
  /** Initial welcome message state */
  WELCOME_MSG = 'WELCOME_MSG',
  /** State for introducing opportunities to the user */
  OPPTYS_EXIST_MSG = 'OPPTYS_EXIST_MSG',
  /** State for showing initial user options */
  USR_INIT_OPTIONS = 'USR_INIT_OPTIONS',
  /** State for re-engaging the user after they've interacted */
  ENGAGE_USR_AGAIN = 'ENGAGE_USR_AGAIN',
  /** State for collecting the user's name */
  COLLECTING_NAME = 'COLLECTING_NAME',
  /** State for collecting the user's email */
  COLLECTING_EMAIL = 'COLLECTING_EMAIL',
  /** State for introducing document upload functionality */
  UPLOAD_DOCS_MSG = 'UPLOAD_DOCS_MSG',
  /** State for handling document uploads */
  UPLOAD_DOCS = 'UPLOAD_DOCS',
  /** State for initiating bot creation */
  CREATE_BOT = 'CREATE_BOT',
  /** Final state indicating the end of workflow */
  END_WORKFLOW = 'END_WORKFLOW',
}

/**
 * Enum defining all possible transitions between states.
 */
export enum Transitions {
  /** Transition when welcome message completion is detected */
  WELCOME_MSG_COMPLETE = 'WELCOME_MSG_COMPLETE',
  /** Transition when user clicks "Yes" */
  YES_CLICKED = 'YES_CLICKED',
  /** Transition when user clicks "No" */
  NO_CLICKED = 'NO_CLICKED',
  /** Transition when opportunities message completion is detected */
  OPPTYS_EXIST_MSG_COMPLETE = 'OPPTYS_EXIST_MSG_COMPLETE',
  /** Transition when user clicks "Let's Go" */
  LETS_GO_CLICKED = 'LETS_GO_CLICKED',
  /** Transition when user clicks "Maybe next time" */
  MAYBE_NEXT_TIME_CLICKED = 'MAYBE_NEXT_TIME_CLICKED',
  /** Transition when user provides their name */
  NAME_PROVIDED = 'NAME_PROVIDED',
  /** Transition when user provides their email */
  EMAIL_PROVIDED = 'EMAIL_PROVIDED',
  /** Transition when upload docs message completion is detected */
  UPLOAD_DOCS_MSG_COMPLETE = 'UPLOAD_DOCS_MSG_COMPLETE',
  /** Transition when documents have been successfully uploaded */
  DOCS_UPLOADED = 'DOCS_UPLOADED',
  /** Transition when bot creation process is started */
  BOT_CREATION_INITIALISED = 'BOT_CREATION_INITIALISED',
}

/** Type alias for States enum */
type State = States;
/** Type alias for Transitions enum */
type Transition = Transitions;

/**
 * Interface defining the public methods of the state machine.
 */
export interface StateMachine {
  /**
   * Transition the state machine to a new state based on the given action.
   * @param action The transition to perform
   * @throws Error if the transition is not valid for the current state
   */
  transition: (action: Transition) => void;

  /**
   * Get the current state of the state machine.
   * @returns The current state
   */
  getState: () => State;

  /**
   * Get the user-friendly display value for a response code.
   * @param response The response code to convert
   * @returns The user-friendly display value, or the original response if not found
   */
  getResponseDisplayValue: (response: string) => string;

  /**
   * Check if a transition is valid from the current state.
   * @param action The transition to check
   * @returns True if the transition is valid, false otherwise
   */
  canTransition: (action: Transition) => boolean;
}

/**
 * Mapping of response codes to user-friendly display values.
 * This is used to convert internal action names to text that can be shown to users.
 */
const responseDisplayValues: { [key: string]: string } = {
  YES_CLICKED: 'Yes',
  LETS_GO_CLICKED: "Let's Go",
  NO_CLICKED: 'No',
  MAYBE_NEXT_TIME_CLICKED: 'Maybe next time',
};

/**
 * Map defining valid state transitions.
 * Each entry maps from a current state to a set of valid transitions and their resulting states.
 */
const stateTransitionMap: { [key in State]?: { [key in Transition]?: State } } = {
  [States.WELCOME_MSG]: {
    [Transitions.WELCOME_MSG_COMPLETE]: States.USR_INIT_OPTIONS,
  },
  [States.USR_INIT_OPTIONS]: {
    [Transitions.YES_CLICKED]: States.COLLECTING_NAME,
    [Transitions.NO_CLICKED]: States.OPPTYS_EXIST_MSG,
  },
  [States.OPPTYS_EXIST_MSG]: {
    [Transitions.OPPTYS_EXIST_MSG_COMPLETE]: States.ENGAGE_USR_AGAIN,
  },
  [States.ENGAGE_USR_AGAIN]: {
    [Transitions.LETS_GO_CLICKED]: States.COLLECTING_NAME,
    [Transitions.MAYBE_NEXT_TIME_CLICKED]: States.END_WORKFLOW,
  },
  [States.COLLECTING_NAME]: {
    [Transitions.NAME_PROVIDED]: States.UPLOAD_DOCS_MSG,
  },
  [States.UPLOAD_DOCS_MSG]: {
    [Transitions.UPLOAD_DOCS_MSG_COMPLETE]: States.UPLOAD_DOCS,
  },
  [States.UPLOAD_DOCS]: {
    [Transitions.DOCS_UPLOADED]: States.COLLECTING_EMAIL,
  },
  [States.COLLECTING_EMAIL]: {
    [Transitions.EMAIL_PROVIDED]: States.CREATE_BOT,
  },
  [States.CREATE_BOT]: {
    [Transitions.BOT_CREATION_INITIALISED]: States.END_WORKFLOW,
  },
};

/**
 * Implementation of the StateMachine interface that manages state transitions
 * according to the defined state transition map.
 */
class FiniteStateMachine implements StateMachine {
  /** The current state of the machine */
  private currentState: State = States.WELCOME_MSG;

  /**
   * Transition the state machine to a new state based on the given action.
   * If the transition is valid according to the state transition map,
   * the current state is updated to the next state.
   *
   * @param action The transition to perform
   */
  transition(action: Transition) {
    console.log(`Transitioning from ${this.currentState} with action ${action}`);
    const nextState = stateTransitionMap[this.currentState]?.[action];
    if (nextState) {
      this.currentState = nextState;
    }
    console.log(`New state: ${this.currentState}`);
  }

  /**
   * Check if a transition is valid from the current state.
   *
   * @param action The transition to check
   * @returns True if the transition is valid for the current state, false otherwise
   */
  canTransition(action: Transition): boolean {
    return !!stateTransitionMap[this.currentState]?.[action];
  }

  /**
   * Get the current state of the state machine.
   *
   * @returns The current state
   */
  getState(): State {
    return this.currentState;
  }

  /**
   * Get the user-friendly display value for a response code.
   *
   * @param response The response code to convert
   * @returns The user-friendly display value, or the original response if not found
   */
  getResponseDisplayValue(response: string): string {
    return responseDisplayValues[response] ?? response;
  }
}

/**
 * Factory function to create a new state machine instance.
 *
 * This function creates and returns a new instance of the FiniteStateMachine class,
 * initialized to the default starting state (WELCOME_MSG).
 *
 * @returns A new StateMachine instance
 *
 * @example
 * const fsm = createStateMachine();
 * console.log(fsm.getState()); // "WELCOME_MSG"
 * fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
 * console.log(fsm.getState()); // "USR_INIT_OPTIONS"
 */
export function createStateMachine(): StateMachine {
  return new FiniteStateMachine();
}
