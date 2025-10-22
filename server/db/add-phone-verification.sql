-- Add phone verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS otp_cooldown TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_sid TEXT;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Update existing users to have phone_verified = false
UPDATE users SET phone_verified = FALSE WHERE phone_verified IS NULL;
