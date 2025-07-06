-- SQL migration to add performance indexes for common query patterns
-- Supports lazy loading strategy with selective eager loading optimization

-- Index on email for user lookups (frequently used in session validation)
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(email);

-- Index on created_at for temporal queries (session cleanup, analytics)
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

-- Index on completed_at for session completion tracking
CREATE INDEX IF NOT EXISTS idx_user_sessions_completed_at ON user_sessions(completed_at);

-- Composite index for session state queries (active vs completed sessions)
CREATE INDEX IF NOT EXISTS idx_user_sessions_state ON user_sessions(is_email_verified, completed_at);

-- Index on updated_at for session activity tracking
CREATE INDEX IF NOT EXISTS idx_user_sessions_updated_at ON user_sessions(updated_at);

-- Performance optimization: Index for cleanup operations (expired verification codes)
CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_cleanup
ON user_sessions(verification_expires_at)
WHERE verification_expires_at IS NOT NULL;

-- Performance optimization: Index for consent tracking
CREATE INDEX IF NOT EXISTS idx_user_sessions_consent ON user_sessions(consent_user_data);
