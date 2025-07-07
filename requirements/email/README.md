# Email Verification System

This document provides an overview of the Email Verification System implementation for the Maria AI Agent project. This system implements a secure email verification process through the chat interface with user-friendly validation and retry mechanisms.

**Last updated: December 2024**
**Status: 📋 Ready for Implementation - All Specifications Finalized ✅**

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

**The Email Verification System is ready for implementation with FSM integration clarified as of December 2024.**

### 📋 **READY FOR IMPLEMENTATION**

- **Documentation**: All requirements, architecture, and implementation plans complete
- **Testing Strategy**: Comprehensive testing approach defined
- **Code Examples**: Detailed implementation code provided in plan.md
- **FSM Integration**: Email verification states and flow clarified
- **Dependencies Identified**: SMTP configuration and database migration requirements clear

### 🚀 **IMPLEMENTATION PHASES**

- **Phase 1 - Backend Foundation**: EmailVerification model, Email Service, Verification Service
- **Phase 2 - API Layer**: Email verification endpoints and validation
- **Phase 3 - Frontend Integration**: React components and FSM integration
- **Phase 4 - Testing & Deployment**: End-to-end testing and production deployment

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

- **Email Format Validation** (✅ Confirmed) - Blocking validation until correct format entered
- **Verification Code Generation and Sending** (📋 Planned) - 6-digit numeric codes via email
- **Chat Interface Integration** (✅ Confirmed) - Additional FSM states for verification flow
- **Retry and Rate Limiting** (📋 Planned) - 3 attempts with 30-second cooldown
- **Session Management** (📋 Planned) - Integration with existing session system
- **UI Enhancements** (📋 Planned) - Button positioning and messaging improvements

## Implementation Approach

The implementation follows a state machine architecture with clean separation of concerns:

1. **Backend Services**:

   - **Email Service** (📋 Planned): Handles email sending and verification code generation
   - **Verification Service** (📋 Planned): Manages verification attempts and session state
   - **Rate Limiting Service** (📋 Planned): Controls resend attempts and cooldown periods

2. **Frontend Components**:
   - **Email Verification Component** (📋 Planned): Handles email input and validation
   - **Verification Code Component** (📋 Planned): Manages code entry and verification
   - **FSM Integration** (✅ Confirmed): Additional states added to existing chat state machine

## FSM Integration Design

The email verification flow integrates with the existing FSM by adding new states:

- **COLLECTING_EMAIL** - Initial email input state (existing)
- **EMAIL_FORMAT_VALIDATION** - Email format validation state (new)
- **EMAIL_VERIFICATION** - 6-digit code entry state (new)
- **EMAIL_VERIFIED** - Successful verification state (new)
- **CREATE_BOT** - Final state (existing)

**Flow**: User enters email → Format validation (blocks until valid) → Verification code sent → User enters code → Verification complete → Proceed to bot creation

## Configuration & Environment Management

### SMTP Configuration (✅ Confirmed)

- **Gmail Account**: Configurable via .env file for flexibility
- **Environment Consistency**: Same Gmail account across dev/staging/production
- **Subject Prefixes**: Environment-specific email subject prefixes
  - **DEV**: `[DEV] Email Verification - Maria AI Agent`
  - **UAT**: `[UAT] Email Verification - Maria AI Agent`
  - **PROD**: `Email Verification - Maria AI Agent` (no prefix)
- **Rate Limits**: Standard Gmail quotas (will address as encountered)
- **Deployment**: CI/CD during off-peak times
- **Reliability**: Depend on Gmail SMTP - no fallback plan needed

### Environment Variables

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@safqore.com
SMTP_FROM_NAME=Maria AI Agent

# Environment
NODE_ENV=development|staging|production
EMAIL_SUBJECT_PREFIX=[DEV]|[UAT]|
```

## Data Privacy & Security Compliance

### Proposed Security Defaults

- **Data Retention**: Email addresses and verification codes automatically deleted after 24 hours
- **Email Encryption**: Email addresses hashed using bcrypt before database storage
- **Audit Logging**: All verification attempts logged with timestamp, IP, and outcome
- **GDPR Compliance**: 
  - Data processing consent implied through email verification initiation
  - Right to be forgotten: automatic cleanup after 24 hours
  - Data portability: minimal data collection (only email and verification status)
- **Sensitive Data Protection**: No email addresses or verification codes in application logs
- **Session Security**: Email verification tied to secure session tokens

### Security Monitoring

- **Failed Verification Attempts**: Alert after 10 failed attempts from same IP
- **Email Delivery Failures**: Immediate alert for SMTP failures
- **Database Anomalies**: Monitor for unusual verification patterns
- **Rate Limiting**: Track and alert on rate limit violations

## Error Handling & Edge Cases

### System Resilience

- **Email Delivery Failures**: 
  - Immediate user notification with retry option
  - System alerts for SMTP failures (showstopper scenario)
  - Detailed error logging for debugging
- **Database Unavailability**: 
  - Graceful degradation with user-friendly error messages
  - Automatic retry mechanism with exponential backoff
  - Cache verification state temporarily in session storage
- **System Downtime**: 
  - Verification codes remain valid across system restarts
  - Session persistence maintains verification state
  - Clear user communication about temporary unavailability

### User Experience Edge Cases

- **Browser Refresh**: Email remains unverified, handled by session cleanup
- **Code Expiration**: Clear messaging and easy resend functionality
- **Maximum Attempts**: Graceful session reset with clear explanation
- **Network Issues**: Retry mechanisms with user feedback

## Implementation Decisions

### Email Verification Flow

- **FSM Integration**: Additional states added to existing FSM for email verification flow (✅ Confirmed)
- **Email Format Validation**: Blocking validation - user cannot proceed until valid email format is entered (✅ Confirmed)
- **Verification Code**: 6-digit numeric for optimal user experience and mobile usability (✅ Confirmed)
- **Success Flow**: Automatic progression to next chat state after verification (✅ Confirmed)
- **SMTP Configuration**: Gmail SMTP (smtp.gmail.com:587) configurable via .env file (✅ Confirmed)
- **Email Template**: HTML template with environment-specific subject prefixes (✅ Confirmed)
- **Environment Handling**: [DEV]/[UAT] prefixes for lower environments, no prefix for PROD (✅ Confirmed)
- **Email Delivery**: Reliable delivery required - silent failures are showstoppers (✅ Confirmed)

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

## Current Status: 📋 Ready for Implementation

**Documentation**: 100% Complete ✅  
**Implementation**: 0% Complete - Ready to Start  
**Test Coverage**: Planned  
**User Experience**: Designed  
**Developer Experience**: Planned

## Documentation

- [Index](index.md): Starting point for Email Verification System documentation
- [Testing Plan](testing.md): Testing strategy for email verification functionality
- [Tracking](tracking.md): Implementation progress tracking
- [Next Steps](next-steps.md): Upcoming tasks and future improvements
- [Implementation Plan](plan.md): Detailed implementation plan with code examples
