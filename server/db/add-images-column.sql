-- Add images and updated_at columns to forum_threads
ALTER TABLE forum_threads 
ADD COLUMN IF NOT EXISTS images TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at = created_at
UPDATE forum_threads SET updated_at = created_at WHERE updated_at IS NULL;
