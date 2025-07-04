# Finite State Machine (FSM) Documentation

This document provides information about the Finite State Machine implementation used in the Maria AI Agent chat interface.

## Overview

The FSM manages the conversational flow of the chat interface, ensuring that the user progresses through the intended conversation path. It defines various states and the permitted transitions between them.

## States

The chat interface can be in one of the following states:

- **WELCOME_MSG**: The initial state when the chat begins
- **USR_INIT_OPTIONS**: Presents the user with initial options (Yes/No)
- **OPPTYS_EXIST_MSG**: Shows a message about available opportunities
- **ENGAGE_USR_AGAIN**: Attempts to re-engage the user
- **COLLECTING_NAME**: Collects the user's name
- **UPLOAD_DOCS_MSG**: Shows a message about document upload
- **UPLOAD_DOCS**: Document upload interface is shown
- **COLLECTING_EMAIL**: Collects the user's email address
- **CREATE_BOT**: Ask the user if they want to create a bot
- **END_WORKFLOW**: End state of the conversation

## Transitions

Transitions move the FSM from one state to another:

- **WELCOME_MSG_COMPLETE**: Welcome message has been shown
- **YES_CLICKED**: User clicked "Yes" button
- **NO_CLICKED**: User clicked "No" button
- **OPPTYS_EXIST_MSG_COMPLETE**: Opportunities message has been shown
- **LETS_GO_CLICKED**: User clicked "Let's Go" button
- **MAYBE_NEXT_TIME_CLICKED**: User clicked "Maybe next time" button
- **NAME_PROVIDED**: User has provided their name
- **UPLOAD_DOCS_MSG_COMPLETE**: Upload document message has been shown
- **DOCS_UPLOADED**: Documents have been uploaded
- **EMAIL_PROVIDED**: User has provided their email
- **BOT_CREATION_INITIALISED**: Bot creation has started

## FSM Integration with React Context

The FSM is integrated with React Context through the `useChatStateMachineAdapter` hook, which bridges the gap between the state machine and the React component state.

### Adapter Pattern

The adapter pattern is used to:

1. Allow the FSM to communicate with React components
2. Enable react components to trigger FSM transitions
3. Synchronize FSM state with React Context state

### Usage

To use the FSM in a component:

```tsx
const App: React.FC = () => {
  // Create FSM instance
  const fsm = createStateMachine();

  return (
    <ChatProvider fsm={fsm}>
      <ChatContainer />
      {process.env.NODE_ENV === 'development' && <FsmVisualizer fsm={fsm} />}
    </ChatProvider>
  );
};
```

Inside a component that needs FSM functionality:

```tsx
const ChatComponent: React.FC = () => {
  const { buttonClickHandler, processTextInputHandler } = useChatStateMachineAdapter(fsm);

  // Use the adapter methods to interact with the FSM
  const handleButtonClick = (value: string) => {
    buttonClickHandler(value);
  };

  return (
    // Component JSX
  );
};
```

## Development Tools

### FSM Visualizer

The project includes an `FsmVisualizer` component that shows:

- Current FSM state
- Available transitions
- Unavailable transitions

This component is only shown in development mode and helps debug state transitions.

## Best Practices

When working with the FSM:

1. Use the adapter to interact with the FSM instead of direct calls
2. Update the FSM state definition when adding new conversation paths
3. Keep FSM transitions synchronized with UI state
4. Test FSM transitions thoroughly to ensure conversation flows correctly
