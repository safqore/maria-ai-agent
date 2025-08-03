-- Migration to allow NULL values for email field to support partial sessions
-- SQLite doesn't support MODIFY COLUMN, so we need to recreate the table

-- Create a temporary table with the new schema
CREATE TABLE user_sessions_new (
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address TEXT,
    consent_user_data BOOLEAN DEFAULT FALSE
);

-- Copy data from old table to new table
INSERT INTO user_sessions_new 
SELECT uuid, name, email, created_at, updated_at, completed_at, ip_address, consent_user_data 
FROM user_sessions;

-- Drop the old table
DROP TABLE user_sessions;

-- Rename the new table
ALTER TABLE user_sessions_new RENAME TO user_sessions; 