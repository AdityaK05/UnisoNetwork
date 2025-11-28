import pool from '../db/index';

/**
 * Storage layer for BUDDY - handles all database operations
 */

interface BUDDYChat {
  id: number;
  user_id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
}

interface BUDDYMessage {
  id: number;
  chat_id: number;
  user_id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: Date;
}

interface BUDDYDocument {
  id: number;
  user_id: number;
  file_name: string;
  file_type: string;
  file_url: string;
  extracted_text?: string;
  file_size?: number;
  created_at: Date;
}

interface ExtractedSkill {
  id: number;
  user_id: number;
  skill: string;
  skill_category: string;
  proficiency_level?: string;
  source: string;
  created_at: Date;
}

class BUDDYStorage {
  /**
   * Create a new chat session
   */
  async createChat(userId: number, title: string): Promise<BUDDYChat> {
    const result = await pool.query(
      'INSERT INTO buddy_chats (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title]
    );
    return result.rows[0];
  }

  /**
   * Get all chats for a user
   */
  async getUserChats(userId: number): Promise<BUDDYChat[]> {
    const result = await pool.query(
      'SELECT * FROM buddy_chats WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Get a specific chat
   */
  async getChat(chatId: number): Promise<BUDDYChat | null> {
    const result = await pool.query(
      'SELECT * FROM buddy_chats WHERE id = $1',
      [chatId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update chat title or timestamp
   */
  async updateChat(
    chatId: number,
    updates: { title?: string; updated_at?: Date }
  ): Promise<BUDDYChat> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.updated_at !== undefined) {
      fields.push(`updated_at = $${paramCount++}`);
      values.push(updates.updated_at);
    }

    values.push(chatId);

    const query = `UPDATE buddy_chats SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a chat
   */
  async deleteChat(chatId: number): Promise<void> {
    await pool.query('DELETE FROM buddy_chats WHERE id = $1', [chatId]);
  }

  /**
   * Add a message to a chat
   */
  async addMessage(
    chatId: number,
    userId: number,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<BUDDYMessage> {
    const result = await pool.query(
      'INSERT INTO buddy_messages (chat_id, user_id, role, content, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [chatId, userId, role, content, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  /**
   * Get messages for a chat
   */
  async getChatMessages(chatId: number, limit: number = 100): Promise<BUDDYMessage[]> {
    const result = await pool.query(
      'SELECT * FROM buddy_messages WHERE chat_id = $1 ORDER BY created_at ASC LIMIT $2',
      [chatId, limit]
    );
    return result.rows;
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    userId: number,
    fileName: string,
    fileType: string,
    fileUrl: string,
    extractedText?: string,
    fileSize?: number
  ): Promise<BUDDYDocument> {
    const result = await pool.query(
      `INSERT INTO buddy_documents (user_id, file_name, file_type, file_url, extracted_text, file_size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, fileName, fileType, fileUrl, extractedText || null, fileSize || 0]
    );
    return result.rows[0];
  }

  /**
   * Get user documents
   */
  async getUserDocuments(userId: number): Promise<BUDDYDocument[]> {
    const result = await pool.query(
      'SELECT * FROM buddy_documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Get a document
   */
  async getDocument(documentId: number): Promise<BUDDYDocument | null> {
    const result = await pool.query(
      'SELECT * FROM buddy_documents WHERE id = $1',
      [documentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: number): Promise<void> {
    await pool.query('DELETE FROM buddy_documents WHERE id = $1', [documentId]);
  }

  /**
   * Save extracted skills
   */
  async saveSkills(
    userId: number,
    skills: Array<{
      skill: string;
      category: string;
      proficiency?: string;
      source: string;
    }>
  ): Promise<ExtractedSkill[]> {
    const result = await pool.query(
      `INSERT INTO buddy_extracted_skills (user_id, skill, skill_category, proficiency_level, source)
       VALUES ${skills.map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`).join(', ')}
       RETURNING *`,
      skills.flatMap(s => [userId, s.skill, s.category, s.proficiency || null, s.source])
    );
    return result.rows;
  }

  /**
   * Get user skills
   */
  async getUserSkills(userId: number): Promise<ExtractedSkill[]> {
    const result = await pool.query(
      `SELECT * FROM buddy_extracted_skills WHERE user_id = $1 ORDER BY skill_category`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Save cover letter
   */
  async saveCoverLetter(
    userId: number,
    jobTitle: string,
    companyName: string,
    content: string
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO buddy_cover_letters (user_id, job_title, company_name, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, jobTitle, companyName, content]
    );
    return result.rows[0];
  }

  /**
   * Get user cover letters
   */
  async getUserCoverLetters(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM buddy_cover_letters WHERE user_id = $1 ORDER BY generated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Save context memory
   */
  async saveContextMemory(
    userId: number,
    contextType: string,
    contextData: any
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO buddy_context_memory (user_id, context_type, context_data)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, contextType, JSON.stringify(contextData)]
    );
    return result.rows[0];
  }

  /**
   * Get context memory for user
   */
  async getContextMemory(userId: number, contextType?: string): Promise<any[]> {
    if (contextType) {
      const result = await pool.query(
        `SELECT * FROM buddy_context_memory WHERE user_id = $1 AND context_type = $2 ORDER BY updated_at DESC`,
        [userId, contextType]
      );
      return result.rows;
    }

    const result = await pool.query(
      `SELECT * FROM buddy_context_memory WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

export const buddyStorage = new BUDDYStorage();
