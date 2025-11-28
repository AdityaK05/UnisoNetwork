-- BUDDY RAG-powered Chatbot Schema
-- Tables for chat history, documents, embeddings, skills, and knowledge base

-- Buddy Chat Sessions table
CREATE TABLE IF NOT EXISTS buddy_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    chat_type VARCHAR(50) DEFAULT 'general', -- general, academic, career, project, interview-prep
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP
);

-- Buddy Messages table
CREATE TABLE IF NOT EXISTS buddy_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES buddy_chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    -- Metadata for RAG
    rag_sources TEXT, -- JSON array of document IDs used for context
    reasoning TEXT, -- Assistant's reasoning/chain of thought
    tokens_used INTEGER, -- Token count for cost tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Documents table
CREATE TABLE IF NOT EXISTS buddy_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- pdf, docx, txt, etc.
    file_path TEXT NOT NULL, -- S3 or local path
    file_size INTEGER, -- bytes
    document_type VARCHAR(50) DEFAULT 'general', -- resume, portfolio, project, research, other
    extracted_text TEXT, -- Full text after extraction
    metadata JSONB, -- Additional metadata (pages, author, etc.)
    is_indexed BOOLEAN DEFAULT FALSE, -- Whether embeddings have been created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted Skills table
CREATE TABLE IF NOT EXISTS buddy_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50), -- technical, soft, domain, language, tool
    proficiency_level VARCHAR(20), -- beginner, intermediate, advanced, expert
    source VARCHAR(100), -- resume, document, inferred, manual
    confidence DECIMAL(3,2), -- 0-1 confidence score for extracted skills
    last_mentioned_in INTEGER REFERENCES buddy_documents(id) ON DELETE SET NULL,
    times_mentioned INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Chunks table (for RAG)
CREATE TABLE IF NOT EXISTS buddy_knowledge_chunks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES buddy_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER, -- Position in document
    content TEXT NOT NULL, -- The actual text chunk
    chunk_type VARCHAR(50), -- text, code, table, image-description
    tokens INTEGER, -- Token count for this chunk
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Embeddings table (for vector similarity search)
CREATE TABLE IF NOT EXISTS buddy_embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER NOT NULL REFERENCES buddy_knowledge_chunks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    embedding_model VARCHAR(100), -- e.g., 'claude-embed' or 'openai-small'
    embedding VECTOR(1536), -- Depends on embedding model (OpenAI: 1536, others vary)
    similarity_threshold DECIMAL(3,2), -- Minimum similarity for retrieval
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career Goals & Profiles table
CREATE TABLE IF NOT EXISTS buddy_career_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_roles TEXT, -- JSON array of target job roles
    career_goals TEXT,
    industry_interests TEXT, -- JSON array
    preferred_locations TEXT, -- JSON array
    salary_expectations VARCHAR(100),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    work_experience_years INTEGER,
    highest_education VARCHAR(100),
    additional_context TEXT, -- Any additional context for personalization
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover Letters Generated table
CREATE TABLE IF NOT EXISTS buddy_cover_letters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id INTEGER REFERENCES buddy_chats(id) ON DELETE SET NULL,
    job_title VARCHAR(200),
    company_name VARCHAR(200),
    job_description TEXT,
    generated_letter TEXT NOT NULL,
    version_number INTEGER DEFAULT 1, -- Multiple versions support
    customization_level VARCHAR(50), -- generic, moderate, highly-personalized
    context_used JSONB, -- What skills/documents were used
    user_edited_at TIMESTAMP, -- When user last edited
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buddy Context Cache table (for session optimization)
CREATE TABLE IF NOT EXISTS buddy_context_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id INTEGER REFERENCES buddy_chats(id) ON DELETE CASCADE,
    context_key VARCHAR(100), -- e.g., 'recent_skills', 'document_summary'
    context_value JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_buddy_chats_user_id ON buddy_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_chats_created_at ON buddy_chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_chat_id ON buddy_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_user_id ON buddy_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_messages_created_at ON buddy_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_documents_user_id ON buddy_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_documents_indexed ON buddy_documents(is_indexed);
CREATE INDEX IF NOT EXISTS idx_buddy_skills_user_id ON buddy_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_skills_category ON buddy_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_buddy_knowledge_chunks_user_id ON buddy_knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_knowledge_chunks_document_id ON buddy_knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_buddy_embeddings_user_id ON buddy_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_career_profiles_user_id ON buddy_career_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_cover_letters_user_id ON buddy_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_context_cache_user_id ON buddy_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_context_cache_expires_at ON buddy_context_cache(expires_at);

-- Enable vector extension for PostgreSQL (uncomment if using pgvector)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create full-text search indexes for better document retrieval
CREATE INDEX IF NOT EXISTS idx_buddy_documents_text_search ON buddy_documents USING GIN(to_tsvector('english', extracted_text));
CREATE INDEX IF NOT EXISTS idx_buddy_knowledge_chunks_text_search ON buddy_knowledge_chunks USING GIN(to_tsvector('english', content));
