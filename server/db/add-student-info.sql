-- Add student information columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_admission VARCHAR(20);
