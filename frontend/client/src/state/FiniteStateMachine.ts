export enum States {
  WELCOME = 'WELCOME',
  OPPORTUNITIES_EXIST = 'OPPORTUNITIES_EXIST',
  USR_INIT_OPTIONS = 'USR_INIT_OPTIONS',
  ENGAGE_USR_AGAIN = 'ENGAGE_USR_AGAIN',
  COLLECTING_NAME = 'COLLECTING_NAME',
  COLLECTING_EMAIL = 'COLLECTING_EMAIL',
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  CREATE_BOT = 'CREATE_BOT',
  END_WORKFLOW = 'END_WORKFLOW',
}

export enum Transitions {
  WELCOME_COMPLETE = 'WELCOME_COMPLETE',
  YES_CLICKED = 'YES_CLICKED',
  NO_CLICKED = 'NO_CLICKED',
  OPPORTUNITIES_EXIST_COMPLETE = 'OPPORTUNITIES_EXIST_COMPLETE',
  LETS_GO_CLICKED = 'LETS_GO_CLICKED',
  MAYBE_NEXT_TIME_CLICKED = 'MAYBE_NEXT_TIME_CLICKED',
  NAME_PROVIDED = 'NAME_PROVIDED',
  EMAIL_PROVIDED = 'EMAIL_PROVIDED',
  DOCUMENTS_PROVIDED = 'DOCUMENTS_PROVIDED',
  BOT_CREATION_INITIALISED = 'BOT_CREATION_INITIALISED',
}

type State = States;
type Transition = Transitions;

export interface StateMachine {
  transition: (action: Transition) => void;
  getState: () => State;
  getResponseDisplayValue: (response: string) => string;
  canTransition: (action: Transition) => boolean;
}

const responseDisplayValues: { [key: string]: string } = {
  "YES_CLICKED": "Yes",
  "LETS_GO_CLICKED": "Let's Go",
  "NO_CLICKED": "No",
  "MAYBE_NEXT_TIME_CLICKED": "Maybe next time"
};

const stateTransitionMap: { [key in State]?: { [key in Transition]?: State } } = {
  [States.WELCOME]: {
    [Transitions.WELCOME_COMPLETE]: States.USR_INIT_OPTIONS,
  },
  [States.USR_INIT_OPTIONS]: {
    [Transitions.YES_CLICKED]: States.COLLECTING_NAME,
    [Transitions.NO_CLICKED]: States.OPPORTUNITIES_EXIST,
  },
  [States.OPPORTUNITIES_EXIST]: {
    [Transitions.OPPORTUNITIES_EXIST_COMPLETE]: States.ENGAGE_USR_AGAIN,
  },
  [States.ENGAGE_USR_AGAIN]: {
    [Transitions.LETS_GO_CLICKED]: States.COLLECTING_NAME,
    [Transitions.MAYBE_NEXT_TIME_CLICKED]: States.END_WORKFLOW,
  },
  [States.COLLECTING_NAME]: {
    [Transitions.NAME_PROVIDED]: States.UPLOAD_DOCUMENTS,
  },
  [States.UPLOAD_DOCUMENTS]: {
    [Transitions.DOCUMENTS_PROVIDED]: States.COLLECTING_EMAIL,
  },
  [States.COLLECTING_EMAIL]: {
    [Transitions.EMAIL_PROVIDED]: States.CREATE_BOT,
  },
  [States.CREATE_BOT]: {
    [Transitions.BOT_CREATION_INITIALISED]: States.END_WORKFLOW,
  }
};

class FiniteStateMachine implements StateMachine {
  private currentState: State = States.WELCOME;

  transition(action: Transition) {
    console.log(`Transitioning from ${this.currentState} with action ${action}`);
    const nextState = stateTransitionMap[this.currentState]?.[action];
    if (nextState) {
      this.currentState = nextState;
    }
    console.log(`New state: ${this.currentState}`);
  }

  canTransition(action: Transition): boolean {
    return !!stateTransitionMap[this.currentState]?.[action];
  }

  getState() {
    return this.currentState;
  }

  getResponseDisplayValue(response: string) {
    return responseDisplayValues[response] ?? response;
  }
}

export function createStateMachine(): StateMachine {
  return new FiniteStateMachine();
}