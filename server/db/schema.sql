-- PostgreSQL schema for UnisoNetwork

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    website TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
    id SERIAL PRIMARY KEY,
    role VARCHAR(100) NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    location VARCHAR(100),
    type VARCHAR(50), -- full-time, part-time, internship, contract
    domain VARCHAR(50), -- tech, design, marketing, etc.
    description TEXT,
    requirements TEXT,
    salary_range VARCHAR(100),
    apply_link TEXT,
    posted_date DATE,
    deadline DATE,
    logo TEXT,
    company_color VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forums table (Real Talks)
CREATE TABLE IF NOT EXISTS forums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table (Community)
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- study, project, social, etc.
    privacy VARCHAR(20) DEFAULT 'public', -- public, private
    max_members INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    event_date TIMESTAMP,
    event_type VARCHAR(50), -- workshop, seminar, networking, etc.
    organizer VARCHAR(100),
    registration_link TEXT,
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    resource_url TEXT NOT NULL,
    description TEXT,
    resource_type VARCHAR(50), -- pdf, link, video, etc.
    category VARCHAR(50), -- academic, career, skill-building, etc.
    tags TEXT, -- JSON array of tags
    upvotes INTEGER DEFAULT 0,
    posted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_internships_company_id ON internships(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_type ON internships(type);
CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- Insert sample companies
INSERT INTO companies (name, logo_url, website, description) VALUES
('Google', '/logos/google.png', 'https://google.com', 'Technology giant focusing on search, cloud, and AI'),
('Microsoft', '/logos/microsoft.png', 'https://microsoft.com', 'Software, cloud services, and productivity tools'),
('Meta', '/logos/meta.png', 'https://meta.com', 'Social technology company building the metaverse'),
('Netflix', '/logos/netflix.png', 'https://netflix.com', 'Entertainment streaming and content platform'),
('Amazon', '/logos/amazon.png', 'https://amazon.com', 'E-commerce, cloud computing, and digital services'),
('Apple', '/logos/apple.png', 'https://apple.com', 'Consumer electronics, software, and services');
