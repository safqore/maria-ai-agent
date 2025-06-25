import { useState, useCallback, useEffect } from 'react';
import { StateMachine, States, Transitions } from '../../state/FiniteStateMachine';
import { useChat } from '../../contexts/ChatContext';

/**
 * Hook that connects the state machine with the React Context
 * 
 * This adapter provides bidirectional communication between the FSM and Context:
 * 1. FSM state changes trigger Context updates
 * 2. Context actions can trigger FSM transitions
 * 
 * @param {StateMachine} fsm - The finite state machine instance
 * @returns {Object} Functions to interact with both context and FSM
 */
const useChatStateMachineAdapter = (fsm: StateMachine) => {
  // Get chat context functions and state
  const { 
    state,
    addUserMessage, 
    addBotMessage, 
    setInputDisabled,
    setButtonGroupVisible,
    setMessageTypingComplete,
    updateFsmState,
    handleButtonClick,
    sendMessage
  } = useChat();
  
  // Local state for tracking user information
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Sync FSM state to context
  useEffect(() => {
    const currentFsmState = fsm.getCurrentState();
    updateFsmState(currentFsmState);
    
    // Configure UI based on state
    switch (currentFsmState) {
      case States.WELCOME_MSG:
        setInputDisabled(true);
        setButtonGroupVisible(false);
        break;
        
      case States.USR_INIT_OPTIONS:
        setInputDisabled(true);
        setButtonGroupVisible(true);
        addBotMessage('Would you like to learn about our AI services?', [
          { text: 'Yes', value: 'yes' },
          { text: 'No', value: 'no' }
        ]);
        break;
        
      case States.OPPTYS_EXIST_MSG:
        setInputDisabled(true);
        setButtonGroupVisible(false);
        addBotMessage('We have several opportunities to help your business with AI!');
        // Transition after message is shown
        setTimeout(() => {
          fsm.transition(Transitions.OPPTYS_EXIST_MSG_COMPLETE);
        }, 2000);
        break;
        
      case States.COLLECTING_NAME:
        setInputDisabled(false);
        setButtonGroupVisible(false);
        addBotMessage('Great! Let\'s get started. What\'s your name?');
        break;
        
      case States.COLLECTING_EMAIL:
        setInputDisabled(false);
        setButtonGroupVisible(false);
        addBotMessage(`Thanks ${userName}! What's your email address?`);
        break;
        
      case States.UPLOAD_DOCS_MSG:
        setInputDisabled(true);
        setButtonGroupVisible(false);
        addBotMessage(`We've saved your contact info. Now you can upload documents to help us understand your needs better.`);
        // Transition after message is shown
        setTimeout(() => {
          fsm.transition(Transitions.UPLOAD_DOCS_MSG_COMPLETE);
        }, 2000);
        break;
        
      case States.UPLOAD_DOCS:
        setInputDisabled(true);
        setButtonGroupVisible(true);
        addBotMessage('Please upload your documents:', [
          { text: 'Upload Complete', value: 'upload-complete' }
        ]);
        break;
        
      case States.CREATE_BOT:
        setInputDisabled(true);
        setButtonGroupVisible(true);
        addBotMessage('Your documents are being processed. Would you like to create a custom bot?', [
          { text: 'Create Bot', value: 'create-bot' },
          { text: 'Maybe Later', value: 'end-workflow' }
        ]);
        break;
        
      case States.END_WORKFLOW:
        setInputDisabled(true);
        setButtonGroupVisible(false);
        addBotMessage('Thank you! We\'ll be in touch soon.');
        break;
    }
  }, [fsm.getCurrentState()]);
  
  /**
   * Handle typing complete events
   */
  const typingCompleteHandler = useCallback((messageId: number) => {
    setMessageTypingComplete(messageId);
    
    // If it was the welcome message, proceed to initial options
    if (messageId === 0) {
      fsm.transition(Transitions.WELCOME_MSG_COMPLETE);
    }
  }, [fsm, setMessageTypingComplete]);
  
  /**
   * Handles text processing in collect name or email states
   */
  const processTextInputHandler = useCallback((userInput: string) => {
    const currentFsmState = fsm.getCurrentState();
    
    if (currentFsmState === States.COLLECTING_NAME) {
      setUserName(userInput);
      // Add the message and trigger FSM transition
      sendMessage(userInput);
    } 
    else if (currentFsmState === States.COLLECTING_EMAIL) {
      setUserEmail(userInput);
      // Add the message and trigger FSM transition
      sendMessage(userInput);
    }
    else {
      // General message handling
      sendMessage(userInput);
    }
  }, [fsm, sendMessage]);
  
  /**
   * Handle file upload events
   */
  const fileUploadHandler = useCallback((file: File) => {
    addBotMessage(`Received file: ${file.name}`);
    
    // Only process in UPLOAD_DOCS state
    if (fsm.getCurrentState() === States.UPLOAD_DOCS) {
      // Simulate successful upload
      setTimeout(() => {
        addBotMessage('File uploaded successfully!');
        fsm.transition(Transitions.DOCS_UPLOADED);
      }, 1500);
    }
  }, [fsm, addBotMessage]);
  
  return {
    fsm,
    buttonClickHandler: handleButtonClick,
    typingCompleteHandler,
    processTextInputHandler,
    fileUploadHandler,
    state
  };
};

export default useChatStateMachineAdapter;
