-- Add face verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_face_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMP;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_face_verified ON users(is_face_verified);
