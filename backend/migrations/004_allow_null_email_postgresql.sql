-- Migration to allow NULL values for email field to support partial sessions
-- PostgreSQL version - just modify the column constraint

-- Drop the NOT NULL constraint from the email column
ALTER TABLE user_sessions ALTER COLUMN email DROP NOT NULL; 