-- SQL migration for user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address TEXT,
    consent_user_data BOOLEAN DEFAULT FALSE
);
