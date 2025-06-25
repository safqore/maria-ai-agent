# Maria AI Agent Refactoring Next Steps

This document outlines the detailed tasks for the upcoming phases of the Maria AI Agent refactoring project.

## Phase 5: Context and Global State Refinements (June 26-30, 2025)

### Step 1: Finalize ChatContext and Adapters (June 26, 2025)

#### Consolidate Context Interfaces

```typescript
// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message, ChatState, ChatAction } from '../types';

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  // Add additional helper methods here
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  handleButtonClick: (action: string) => void;
}

const initialState: ChatState = {
  messages: [],
  isInputDisabled: false,
  isLoading: false,
  error: null,
};

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  // Implementation of reducer logic
};

export const ChatProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Implementation of provider with business logic
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
```

#### Tasks:
- [ ] Review all context types and interfaces for consistency
- [ ] Add proper JSDoc documentation to all interfaces
- [ ] Ensure all methods have proper TypeScript return types
- [ ] Add unit tests for all context-related logic

#### State Machine Integration

```typescript
// src/hooks/adapters/useFsmAdapter.ts
import { useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useFiniteStateMachine } from '../useFiniteStateMachine';

export function useFsmAdapter() {
  const fsm = useFiniteStateMachine();
  const { state, dispatch } = useChat();

  // Connect FSM state changes to Context
  useEffect(() => {
    // Implementation connecting FSM state to Context state
  }, [fsm.currentState]);

  // Connect Context actions to FSM transitions
  useEffect(() => {
    // Implementation connecting Context actions to FSM transitions
  }, [state.messages]);

  return {
    // Return combined interface
  };
}
```

#### Tasks:
- [ ] Create proper adapter layer between state machine and contexts
- [ ] Ensure FSM state changes trigger appropriate context updates
- [ ] Document the relationship between FSM states and UI changes
- [ ] Add visualization of state transitions for development use

#### Optimize Context Performance

```typescript
// Example optimization
import React, { useMemo } from 'react';
import { useChat } from '../contexts/ChatContext';

export const ChatMessageCount: React.FC = React.memo(() => {
  const { state } = useChat();

  const messageCount = useMemo(() => {
    return state.messages.length;
  }, [state.messages.length]);

  return <div>Total messages: {messageCount}</div>;
});
```

#### Tasks:
- [ ] Use React.memo for components that only read from context
- [ ] Split context if needed to avoid unnecessary re-renders
- [ ] Implement useMemo for complex derived state
- [ ] Add performance measurements to ensure efficiency

### Step 2: Add Data Fetching Layer (June 27, 2025)

#### API Data Fetching System

```typescript
// src/hooks/api/useFetch.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../../api/config';

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseFetchOptions {
  immediate?: boolean;
  initialData?: any;
}

export function useFetch<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseFetchOptions = {}
) {
  // Implementation
}
```

#### Tasks:
- [ ] Implement proper loading states in contexts
- [ ] Add request cancellation for network requests
- [ ] Create standardized error handling for API responses
- [ ] Make API endpoints configurable via environment variables

#### Session Management Improvements

```typescript
// src/hooks/useSessionManager.ts
import { useSessionUUID } from './useSessionUUID';

export function useSessionManager() {
  const { sessionUUID, resetSession } = useSessionUUID();

  // Implementation of session management logic
}
```

#### Tasks:
- [ ] Implement proper session restoration logic
- [ ] Add automatic session expiration handling
- [ ] Ensure all API calls include proper session headers
- [ ] Create a retry mechanism for failed requests

### Step 3: Cross-cutting Concerns (June 27, 2025)

#### Logging and Analytics

```typescript
// src/utils/logging.ts
export const logger = {
  info: (message: string, data?: any) => {
    // Implementation
  },
  error: (error: Error, context?: any) => {
    // Implementation
  },
  warn: (message: string, data?: any) => {
    // Implementation
  }
};
```

#### Tasks:
- [ ] Implement proper error logging
- [ ] Add user interaction analytics
- [ ] Create performance monitoring hooks
- [ ] Ensure all logs are properly anonymized

#### Accessibility Improvements

```typescript
// src/hooks/useA11y.ts
import { useRef, useEffect } from 'react';

export function useA11y() {
  // Implementation of accessibility helpers
}
```

#### Tasks:
- [ ] Run a comprehensive accessibility audit
- [ ] Ensure proper keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Add proper focus management

### Step 4: Final Integration and Testing (June 28, 2025)

#### End-to-End Testing

```typescript
// cypress/integration/chat.spec.ts
describe('Chat Flow', () => {
  it('should display welcome message on load', () => {
    // Test implementation
  });

  it('should allow sending a message', () => {
    // Test implementation
  });
});
```

#### Tasks:
- [ ] Create comprehensive E2E tests with Cypress
- [ ] Test all critical user flows
- [ ] Add visual regression tests
- [ ] Create automated performance benchmarks

#### Documentation Updates

```typescript
/**
 * ChatContainer is the main component that orchestrates the chat UI.
 * It handles state management and coordinates between subcomponents.
 *
 * @example
 * ```tsx
 * <ChatProvider>
 *   <ChatContainer />
 * </ChatProvider>
 * ```
 */
```

#### Tasks:
- [ ] Update component API documentation
- [ ] Create architectural diagrams
- [ ] Document state management patterns
- [ ] Add setup instructions for new developers

## Phase 4: Backend Improvements - Higher Risk (Weeks 9-11)

### Step 1: Implement SQLAlchemy ORM

#### Tasks:
- [ ] Set up SQLAlchemy configuration
- [ ] Create database models
- [ ] Replace direct database connections with ORM
- [ ] Update service layer to use SQLAlchemy models
- [ ] Create database migrations
- [ ] Verify all functionality works as before

### Step 2: Improve Route Organization

#### Tasks:
- [ ] Convert route functions to class-based views
- [ ] Apply decorators for common functionality
- [ ] Implement proper request/response validation
- [ ] Update tests to work with new route structure
- [ ] Document API endpoints

## Reference Implementations

### Context Pattern Example

```typescript
// Complete example of a well-structured context
import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Message } from '../types';
import { ChatApi } from '../api/chatApi';

interface ChatState {
  messages: Message[];
  isInputDisabled: boolean;
  isLoading: boolean;
  error: Error | null;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_INPUT_DISABLED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null };

const initialState: ChatState = {
  messages: [],
  isInputDisabled: false,
  isLoading: false,
  error: null,
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string, sessionId: string) => Promise<void>;
} | undefined>(undefined);

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_INPUT_DISABLED':
      return {
        ...state,
        isInputDisabled: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export const ChatProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const sendMessage = useCallback(async (content: string, sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_INPUT_DISABLED', payload: true });

      const botResponse = await ChatApi.sendMessage(content, sessionId);
      dispatch({ type: 'ADD_MESSAGE', payload: botResponse });
      dispatch({ type: 'SET_INPUT_DISABLED', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
};
```

### API Service Pattern Example

```typescript
// src/api/chatApi.ts
import { API_BASE_URL } from './config';
import { ApiError } from './config';
import { Message } from '../types';

interface SendMessageRequest {
  content: string;
  sessionId: string;
}

interface SendMessageResponse {
  message: Message;
}

export const ChatApi = {
  /**
   * Send a message to the chat API and receive a response.
   *
   * @param content - The message content to send
   * @param sessionId - The session UUID
   * @returns A Promise resolving to the bot's response message
   * @throws ApiError if the request fails
   */
  sendMessage: async (content: string, sessionId: string): Promise<Message> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.message || 'Failed to send message', response.status, errorData);
      }

      const data: SendMessageResponse = await response.json();
      return data.message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, { originalError: error });
    }
  },
};
```
