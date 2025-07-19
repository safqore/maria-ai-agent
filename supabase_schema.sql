-- Complete database schema for Maria AI Agent on Supabase
-- This file recreates all existing migrations in a single script
-- Based on: 001_create_user_sessions.sql, 002_create_email_verification.sql, 003_add_performance_indexes.sql

-- =============================================================================
-- MAIN TABLE: user_sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    -- Primary key and core user data
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Timestamps for session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- User tracking and compliance
    ip_address TEXT,
    consent_user_data BOOLEAN DEFAULT FALSE,
    
    -- Email verification system
    verification_code VARCHAR(6),
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    max_verification_attempts INTEGER NOT NULL DEFAULT 3,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    resend_attempts INTEGER NOT NULL DEFAULT 0,
    max_resend_attempts INTEGER NOT NULL DEFAULT 3,
    last_resend_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Email verification indexes (from migration 002)
CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_expires_at 
ON user_sessions(verification_expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_is_email_verified 
ON user_sessions(is_email_verified);

-- Performance indexes (from migration 003)
CREATE INDEX IF NOT EXISTS idx_user_sessions_email 
ON user_sessions(email);

CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at 
ON user_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_completed_at 
ON user_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_state 
ON user_sessions(is_email_verified, completed_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_updated_at 
ON user_sessions(updated_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_consent 
ON user_sessions(consent_user_data);

-- Cleanup operations index (conditional)
CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_cleanup
ON user_sessions(verification_expires_at)
WHERE verification_expires_at IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Supabase Best Practice
-- =============================================================================

-- Enable RLS on the table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own sessions (based on UUID)
-- This is for future when we add Supabase auth
CREATE POLICY "Users can access own sessions" ON user_sessions
    FOR ALL USING (auth.uid()::text = uuid::text);

-- Policy: Allow read access for service role (for backend operations)
CREATE POLICY "Service role full access" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function on every update
CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE user_sessions IS 'User session data with email verification and consent tracking';
COMMENT ON COLUMN user_sessions.uuid IS 'Primary key - user session identifier';
COMMENT ON COLUMN user_sessions.verification_code IS '6-digit email verification code';
COMMENT ON COLUMN user_sessions.verification_attempts IS 'Number of verification attempts made';
COMMENT ON COLUMN user_sessions.is_email_verified IS 'Whether email has been successfully verified';
COMMENT ON COLUMN user_sessions.consent_user_data IS 'GDPR consent for data processing';

-- =============================================================================
-- USEFUL VIEWS FOR ANALYTICS
-- =============================================================================

-- View for active sessions (verified but not completed)
CREATE VIEW active_sessions AS
SELECT 
    uuid,
    name,
    email,
    created_at,
    updated_at,
    ip_address
FROM user_sessions
WHERE is_email_verified = true 
  AND completed_at IS NULL;

-- View for session completion statistics
CREATE VIEW session_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN is_email_verified THEN 1 END) as verified_sessions,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_sessions,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_completion_time_minutes
FROM user_sessions
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC; 