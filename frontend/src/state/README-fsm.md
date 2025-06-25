# Finite State Machine Documentation

This document provides an overview of the state machine implementation used in the Maria AI Agent chat interface. 

## Overview

The Finite State Machine (FSM) manages the conversational flow of the chat interface, ensuring a consistent user experience and maintaining the correct sequence of interactions.

## States

The FSM defines the following states:

| State | Description |
|-------|-------------|
| `WELCOME_MSG` | Initial welcome message state |
| `OPPTYS_EXIST_MSG` | State for introducing opportunities to the user |
| `USR_INIT_OPTIONS` | State for showing initial user options |
| `ENGAGE_USR_AGAIN` | State for re-engaging the user after they've interacted |
| `COLLECTING_NAME` | State for collecting the user's name |
| `COLLECTING_EMAIL` | State for collecting the user's email |
| `UPLOAD_DOCS_MSG` | State for introducing document upload functionality |
| `UPLOAD_DOCS` | State for handling document uploads |
| `CREATE_BOT` | State for initiating bot creation |
| `END_WORKFLOW` | Final state indicating the end of workflow |

## Transitions

Transitions between states are triggered by the following events:

| Transition | Description |
|------------|-------------|
| `WELCOME_MSG_COMPLETE` | Triggered when welcome message display is complete |
| `YES_CLICKED` | Triggered when user clicks "Yes" button |
| `NO_CLICKED` | Triggered when user clicks "No" button |
| `OPPTYS_EXIST_MSG_COMPLETE` | Triggered when opportunities message display is complete |
| `LETS_GO_CLICKED` | Triggered when user clicks "Let's Go" button |
| `MAYBE_NEXT_TIME_CLICKED` | Triggered when user clicks "Maybe next time" button |
| `NAME_PROVIDED` | Triggered when user provides their name |
| `EMAIL_PROVIDED` | Triggered when user provides their email |
| `UPLOAD_DOCS_MSG_COMPLETE` | Triggered when document upload message display is complete |
| `UPLOAD_DOCS_COMPLETE` | Triggered when document upload is complete |
| `CREATE_BOT_CLICKED` | Triggered when user initiates bot creation |
| `END_WORKFLOW_CLICKED` | Triggered when user ends the workflow |

## Conversation Flow

The typical conversation flow follows this sequence:

1. **Welcome (WELCOME_MSG)**
   - System shows welcome message
   - When message display is complete → USR_INIT_OPTIONS

2. **Initial Options (USR_INIT_OPTIONS)**
   - System shows buttons: "Yes" and "No"
   - If "Yes" clicked → OPPTYS_EXIST_MSG
   - If "No" clicked → END_WORKFLOW

3. **Opportunities Exist (OPPTYS_EXIST_MSG)**
   - System explains opportunities
   - When message display is complete → show "Let's Go" and "Maybe next time" buttons
   - If "Let's Go" clicked → COLLECTING_NAME
   - If "Maybe next time" clicked → END_WORKFLOW

4. **Collecting Name (COLLECTING_NAME)**
   - System asks for user's name
   - When name is provided → COLLECTING_EMAIL

5. **Collecting Email (COLLECTING_EMAIL)**
   - System asks for user's email
   - When email is provided → UPLOAD_DOCS_MSG

6. **Upload Documents Message (UPLOAD_DOCS_MSG)**
   - System explains document upload
   - When message display is complete → UPLOAD_DOCS

7. **Upload Documents (UPLOAD_DOCS)**
   - System shows file upload interface
   - When upload is complete → CREATE_BOT

8. **Create Bot (CREATE_BOT)**
   - System shows bot creation interface
   - When bot creation is initiated → END_WORKFLOW

9. **End Workflow (END_WORKFLOW)**
   - System shows completion message
   - Conversation is complete

## Integration with React Context

The FSM is integrated with React Context through an adapter layer that:

1. Translates FSM state changes into Context updates
2. Routes Context actions to appropriate FSM transitions
3. Maintains synchronization between the two state management approaches

This integration ensures a clean separation of concerns while preserving the application's behavior during the refactoring process.
