# Email Verification System

This document provides an overview of the Email Verification System implementation for the Maria AI Agent project. This system implements a secure email verification process through the chat interface with user-friendly validation and retry mechanisms.

**Last updated: [Date]**
**Status: 🟡 In Progress - Specifications Finalized ✅**

## Documentation Structure

**This folder follows a strict 6-file structure:**

- [README.md](./README.md) - Overview and main documentation (this file)
- [index.md](./index.md) - Central entry point with navigation links
- [plan.md](./plan.md) - Implementation plans and strategies
- [next-steps.md](./next-steps.md) - Upcoming tasks and priorities
- [testing.md](./testing.md) - Testing strategies and procedures
- [tracking.md](./tracking.md) - Progress tracking and milestones

**IMPORTANT:** Do not create additional files in this folder. When adding new content, update one of the six files above based on the content type.

## 🎯 Implementation Status

**The Email Verification System is currently in development as of [Date].**

### 🟡 **IN PROGRESS FEATURES**

- **Email Format Validation**: Real-time email format validation with user feedback
- **Verification Code Generation**: 6-digit numeric code generation and email sending
- **Chat Interface Integration**: Seamless integration with existing FSM chat flow

### 📋 **PLANNED FEATURES**

- **Retry Mechanism**: 3 attempts with session reset on failure
- **Code Expiration**: 10-minute expiration for verification codes
- **Email Resend**: Rate-limited resend functionality with 30-second cooldown
- **UI Improvements**: Enhanced button positioning and messaging

## Requirements & Decisions

### Core Email Verification Requirements

- **Email Format Validation**: Continuous validation with user feedback until correct format is entered
- **Verification Code**: 6-digit numeric code sent via email
- **Attempt Limits**: Maximum 3 attempts to enter correct code
- **Session Reset**: Automatic session reset after 3 failed attempts
- **Code Expiration**: Verification codes expire after 10 minutes
- **Success Message**: "Thank you for verifying your email address. We will email you once your AI agent is ready."

### Email Resend Requirements

- **Resend Button**: Available in chat interface
- **Rate Limiting**: 30-second cooldown between resend requests
- **Attempt Limit**: Maximum 3 resend attempts per session
- **Code Regeneration**: New code generated with each resend

### UI Enhancement Requirements

- **Button Position**: Move "done and continue" button to bottom of document upload area
- **Greeting Text**: More concise and personalised greeting message
- **Email Request Text**: Updated to "please enter your email address so I can notify you once your AI agent is ready"

## Overview

The Email Verification System implements several key features:

- **Email Format Validation** (🟡 In Progress)
- **Verification Code Generation and Sending** (📋 Planned)
- **Chat Interface Integration** (📋 Planned)
- **Retry and Rate Limiting** (📋 Planned)
- **Session Management** (📋 Planned)
- **UI Enhancements** (📋 Planned)

## Implementation Approach

The implementation follows a state machine architecture with clean separation of concerns:

1. **Backend Services**:

   - **Email Service** (📋 Planned): Handles email sending and verification code generation
   - **Verification Service** (📋 Planned): Manages verification attempts and session state
   - **Rate Limiting Service** (📋 Planned): Controls resend attempts and cooldown periods

2. **Frontend Components**:
   - **Email Verification Component** (📋 Planned): Handles email input and validation
   - **Verification Code Component** (📋 Planned): Manages code entry and verification
   - **FSM Integration** (🟡 In Progress): Integrates with existing chat state machine

## Implementation Decisions

### Email Verification Flow

- **FSM Integration**: Integrate with existing finite state machine for seamless user experience (🟡 In Progress)
- **Email Format Validation**: Real-time validation with continuous feedback (📋 Planned)
- **Verification Code**: 6-digit numeric for optimal user experience and mobile usability (✅ Confirmed)
- **Success Flow**: Automatic progression to next chat state after verification (✅ Confirmed)
- **SMTP Configuration**: Gmail SMTP (smtp.gmail.com:587) with App Password (✅ Confirmed)
- **Email Template**: HTML template with branding from noreply@safqore.com (✅ Confirmed)

### Security and User Experience

- **Attempt Limits**: 3 attempts to prevent abuse while allowing for user errors (📋 Planned)
- **Session Reset**: Reuse existing session reset mechanism for consistency (📋 Planned)
- **Code Expiration**: 10-minute expiration balances security with user convenience (📋 Planned)

## Directory Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── email_verification.py  # Email verification model (📋 Planned)
│   │   └── verification_code.py   # Verification code model (📋 Planned)
│   ├── routes/
│   │   └── email_verification.py  # Email verification endpoints (📋 Planned)
│   ├── services/
│   │   ├── email_service.py       # Email sending service (📋 Planned)
│   │   └── verification_service.py # Verification logic service (📋 Planned)
│   └── utils/
│       └── email_utils.py         # Email utility functions (📋 Planned)
└── migrations/
    └── 002_create_email_verification.sql # Database schema (📋 Planned)

frontend/
├── src/
│   ├── hooks/
│   │   └── useEmailVerification.ts # Email verification hook (📋 Planned)
│   ├── contexts/
│   │   └── EmailVerificationContext.tsx # Verification context (📋 Planned)
│   ├── api/
│   │   └── emailVerificationApi.ts # Email verification API client (📋 Planned)
│   └── components/
│       └── emailVerification/
│           ├── EmailInput.tsx      # Email input component (📋 Planned)
│           ├── CodeInput.tsx       # Code input component (📋 Planned)
│           └── ResendButton.tsx    # Resend button component (📋 Planned)
```

## Key Components

### Backend (📋 Planned)

- **Email Service**: Handles SMTP integration and email template management
- **Verification Service**: Manages code generation, validation, and attempt tracking
- **Rate Limiting Service**: Controls resend attempts and implements cooldown periods

### Frontend (📋 Planned)

- **Email Verification Hook**: Manages email verification state and API calls
- **Email Input Component**: Handles email input with real-time validation
- **Code Input Component**: Manages verification code entry with attempt tracking

## Current Status: 🟡 In Progress

**Delivered Features**: 10% of core requirements  
**Test Coverage**: Planned  
**Documentation**: In Progress  
**User Experience**: Designed  
**Developer Experience**: Planned

## Documentation

- [Index](index.md): Starting point for Email Verification System documentation
- [Testing Plan](testing.md): Testing strategy for email verification functionality
- [Tracking](tracking.md): Implementation progress tracking
- [Next Steps](next-steps.md): Upcoming tasks and future improvements
- [Implementation Plan](plan.md): Detailed implementation plan with code examples
