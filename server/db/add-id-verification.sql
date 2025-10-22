-- Migration: Add Student ID Verification Fields
-- Date: 2025-10-22
-- Description: Adds columns for student ID card verification system

-- Add ID verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id_card_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_id_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS id_verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS college_name TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Create index on is_id_verified for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_id_verified ON users(is_id_verified);

-- Create index on roll_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE 'ID verification fields added successfully!';
END $$;
