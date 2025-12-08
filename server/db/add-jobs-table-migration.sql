-- Add jobs table if it doesn't exist (for existing databases)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    location VARCHAR(100),
    job_type VARCHAR(50), -- full-time, part-time, contract, remote
    experience_level VARCHAR(50), -- entry, mid, senior
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    apply_link TEXT,
    posted_date DATE,
    deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
