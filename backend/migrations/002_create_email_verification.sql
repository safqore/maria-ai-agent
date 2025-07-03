-- SQL migration to add email verification fields to user_sessions table
-- Adds email verification functionality directly to the user_sessions table

ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS max_verification_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS resend_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS max_resend_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_resend_at TIMESTAMP;

-- Create index on verification_expires_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_expires_at ON user_sessions(verification_expires_at);

-- Create index on is_email_verified for query optimization
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_email_verified ON user_sessions(is_email_verified); 