# Email Verification System - Next Steps

**Status: Ready for Implementation**  
**Critical Blockers: SMTP Configuration + Database Migration**

## 🔴 **CRITICAL BLOCKERS** 

### Blocker 1: SMTP Configuration
- **Impact**: Cannot implement email sending functionality
- **Required**: Gmail SMTP credentials and configuration
- **Action**: Set up Gmail app password and configure .env variables
- **Status**: ✅ **CLARIFIED** - User will add Gmail credentials to .env before regression testing

### Blocker 2: Database Migration
- **Impact**: Cannot implement EmailVerification model
- **Required**: Create email_verifications table using SQLite
- **Action**: Run Alembic migration script following existing patterns
- **Status**: ✅ **CLARIFIED** - Simple migration script, following existing Alembic pattern

## 🟢 **READY TO IMPLEMENT** (After Blockers Resolved)

### Phase 1: Backend Foundation ✅ **ALIGNED WITH EXISTING PATTERNS**
1. **EmailVerification Model** - SQLAlchemy model following existing model patterns
2. **EmailVerificationRepository** - Repository extending BaseRepository pattern
3. **Email Service** - Code generation and SMTP integration with bcrypt hashing
4. **Verification Service** - Core verification logic using TransactionContext

### Phase 2: API Endpoints ✅ **ALIGNED WITH EXISTING PATTERNS**
1. **Email Verification Routes** - POST /verify-email, /verify-code, /resend-code
2. **Input Validation** - Email format validation and error handling using existing errors.py
3. **FSM Integration** - API responses with nextTransition property (not nextState)
4. **Session Integration** - Connect with existing session system via SessionContext

### Phase 3: Frontend Components ✅ **ALIGNED WITH EXISTING PATTERNS**
1. **Email Verification Hook** - useEmailVerification with SessionContext integration
2. **UI Components** - Email input, code input, resend button following existing patterns
3. **FSM Integration** - Add verification states to existing FiniteStateMachine.ts
4. **Session Reset** - Use SessionContext.resetSession() instead of window.reload

## 📋 **TECHNICAL SPECIFICATIONS - ALIGNED WITH EXISTING PATTERNS**

### Repository Pattern ✅ **ALIGNED**
- **EmailVerificationRepository**: Extends BaseRepository<EmailVerification>
- **Factory Integration**: get_email_verification_repository() in factory.py
- **Database Access**: All operations through repository layer (no direct db_session queries)
- **Follows Pattern**: Same structure as UserSessionRepository

### Transaction Management ✅ **ALIGNED**
- **TransactionContext**: All database operations use existing TransactionContext
- **Atomic Operations**: Email verification operations are atomic
- **Error Handling**: Proper rollback following existing service patterns
- **Follows Pattern**: Same as SessionService transaction handling

### Session Integration ✅ **ALIGNED**
- **SessionContext**: Use existing SessionContext.resetSession() for session resets
- **Modal Integration**: Leverage existing SessionResetModal for user confirmation
- **No window.reload**: Eliminated direct page reloads in favor of SessionContext
- **Follows Pattern**: Same as existing session management in FileUpload

### FSM Integration ✅ **ALIGNED**
- **nextTransition**: API responses use nextTransition property (not nextState)
- **Transition Handling**: Follow existing ChatContext pattern for FSM integration
- **State Management**: Integrate with existing FiniteStateMachine.ts
- **Follows Pattern**: Same as existing chat FSM transitions

### Database Strategy ✅ **ALIGNED**
- **SQLite**: Use SQLite for all environments (following questions-and-assumptions.md)
- **Alembic**: Use existing Alembic migration system
- **Test Database**: maria_ai_test.db following existing pattern
- **Follows Pattern**: Same as existing database configuration

### Security Implementation ✅ **ALIGNED**
- **Email Hashing**: bcrypt with salt rounds=12
- **Audit Logging**: Use existing audit_utils.log_audit_event pattern
- **Data Retention**: 24-hour auto-cleanup via repository cleanup method
- **Error Handling**: Follow existing errors.py structured error pattern

### Testing Setup ✅ **ALIGNED**
- **Development Email**: Personal email address in .env for testing
- **Test Database**: SQLite (maria_ai_test.db) following existing setup
- **Migration Tests**: Automatic migration before tests using existing patterns
- **Repository Tests**: Follow UserSessionRepository test patterns

## 🎯 **IMPLEMENTATION DEPENDENCIES - RESOLVED**

### ✅ **Pattern Alignment Completed**
- **Repository Pattern**: EmailVerificationRepository follows BaseRepository
- **Transaction Management**: All operations use TransactionContext
- **Session Management**: Integration with SessionContext (no window.reload)
- **FSM Integration**: nextTransition property pattern followed
- **Database Configuration**: SQLite for all environments confirmed
- **Error Handling**: Structured errors following existing patterns

### ✅ **No More Conflicts**
- **Session Reset**: Now uses SessionContext instead of window.location.reload
- **Database Access**: Now uses repository pattern instead of direct queries
- **FSM Integration**: Now uses nextTransition instead of direct state changes
- **Testing Database**: Now uses SQLite instead of PostgreSQL
- **Transaction Boundaries**: Now uses TransactionContext instead of direct sessions

## 🚀 **IMPLEMENTATION TIMELINE** (After Blockers Resolved)

- **Week 1**: Backend Foundation (repository, model, services with TransactionContext)
- **Week 2**: API Endpoints (routes with nextTransition integration)
- **Week 3**: Frontend Components (hooks with SessionContext integration)
- **Week 4**: Testing following existing patterns, optimization, deployment

## 📊 **SUCCESS CRITERIA - ALIGNED WITH EXISTING PATTERNS**

### Phase 1 Success
- EmailVerificationRepository follows BaseRepository pattern
- Email service using bcrypt and proper error handling
- Verification service using TransactionContext for atomic operations

### Phase 2 Success
- All endpoints return nextTransition for FSM integration
- Proper error responses following existing errors.py structure
- Session integration working with SessionContext

### Phase 3 Success
- Components using SessionContext for session management
- FSM integration working with nextTransition pattern
- User experience consistent with existing session patterns

## 🔄 **NEXT STEPS**

1. **Set up Gmail App Password** - Configure SMTP credentials in .env
2. **Create Alembic Migration** - Add email_verifications table to SQLite
3. **Implement Repository** - Create EmailVerificationRepository extending BaseRepository
4. **Update Factory** - Add get_email_verification_repository() to factory.py
5. **Begin Implementation** - Start with EmailVerification model following existing patterns

**All technical specifications are now aligned with existing patterns and eliminate all identified conflicts.**
