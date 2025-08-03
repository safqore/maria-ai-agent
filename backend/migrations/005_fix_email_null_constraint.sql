-- Migration to fix email field constraint to allow NULL values
-- This migration ensures the email field can be NULL to support partial sessions

-- For SQLite, we need to recreate the table since it doesn't support MODIFY COLUMN
-- Create a temporary table with the correct schema
CREATE TABLE user_sessions_new (
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address TEXT,
    consent_user_data BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_attempts INTEGER NOT NULL DEFAULT 0,
    max_verification_attempts INTEGER NOT NULL DEFAULT 3,
    verification_expires_at TIMESTAMP,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    resend_attempts INTEGER NOT NULL DEFAULT 0,
    max_resend_attempts INTEGER NOT NULL DEFAULT 3,
    last_resend_at TIMESTAMP
);

-- Copy data from old table to new table
INSERT INTO user_sessions_new 
SELECT uuid, name, email, created_at, updated_at, completed_at, ip_address, consent_user_data,
       verification_code, verification_attempts, max_verification_attempts, verification_expires_at,
       is_email_verified, resend_attempts, max_resend_attempts, last_resend_at
FROM user_sessions;

-- Drop the old table
DROP TABLE user_sessions;

-- Rename the new table
ALTER TABLE user_sessions_new RENAME TO user_sessions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_verification_expires_at ON user_sessions(verification_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_email_verified ON user_sessions(is_email_verified); 