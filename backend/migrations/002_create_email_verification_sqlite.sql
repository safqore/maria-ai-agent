-- SQLite-compatible migration to add email verification fields
-- SQLite doesn't support IF NOT EXISTS in ALTER TABLE, so we'll use separate statements

ALTER TABLE user_sessions ADD COLUMN verification_code VARCHAR(6);
ALTER TABLE user_sessions ADD COLUMN verification_attempts INTEGER DEFAULT 0;
ALTER TABLE user_sessions ADD COLUMN max_verification_attempts INTEGER DEFAULT 3;
ALTER TABLE user_sessions ADD COLUMN verification_expires_at TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN is_email_verified BOOLEAN DEFAULT 0;
ALTER TABLE user_sessions ADD COLUMN resend_attempts INTEGER DEFAULT 0;
ALTER TABLE user_sessions ADD COLUMN max_resend_attempts INTEGER DEFAULT 3;
ALTER TABLE user_sessions ADD COLUMN last_resend_at TIMESTAMP;

-- Create indexes
CREATE INDEX idx_user_sessions_verification_expires_at ON user_sessions(verification_expires_at);
CREATE INDEX idx_user_sessions_is_email_verified ON user_sessions(is_email_verified); 