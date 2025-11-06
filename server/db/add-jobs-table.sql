-- Add jobs table for Admin & Placement Coordinator Job Portal
-- This table stores job/internship listings posted by admins and coordinators

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  job_type VARCHAR(20) CHECK (job_type IN ('Internship', 'Full-time', 'Part-time')) NOT NULL,
  salary_range VARCHAR(100),
  skills_required TEXT[],
  application_deadline DATE,
  application_link TEXT,
  posted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('Active', 'Closed')) DEFAULT 'Active',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add role column to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student' 
    CHECK (role IN ('student', 'admin', 'coordinator'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add some sample data (optional)
-- UPDATE users SET role = 'admin' WHERE email LIKE '%@admin%' OR id = 1;
