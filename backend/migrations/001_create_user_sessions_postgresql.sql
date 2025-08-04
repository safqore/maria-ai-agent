-- SQL migration for user_sessions table (PostgreSQL version)
CREATE TABLE IF NOT EXISTS user_sessions (
    uuid VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address TEXT,
    consent_user_data BOOLEAN DEFAULT FALSE
); 