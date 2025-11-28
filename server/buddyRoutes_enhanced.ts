import { Express, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import BUDDYService from './services/buddyService_enhanced';
import DocumentIngestionService from './services/documentIngestion';
import SkillExtractorService from './services/skillExtractor';
import CoverLetterService from './services/coverLetter';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

interface AuthRequest extends Request {
  user?: any;
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Multer configuration for file uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads/buddy-documents/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Authentication Middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Missing token' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// BUDDY Service instances per user (with session management)
const buddyInstances = new Map<number, BUDDYService>();

function getBUDDYService(userId: number): BUDDYService {
  if (!buddyInstances.has(userId)) {
    buddyInstances.set(userId, new BUDDYService(userId));
  }
  return buddyInstances.get(userId)!;
}

/**
 * Register all BUDDY routes
 */
export async function registerBuddyRoutes(app: Express): Promise<void> {
  // ========================================
  // CHAT MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * GET /api/buddy/chats
   * Get all chat sessions for the current user
   */
  app.get('/api/buddy/chats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, title, chat_type, created_at, updated_at, last_message_at
         FROM buddy_chats
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [req.user.id]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chats' });
    }
  });

  /**
   * POST /api/buddy/chats
   * Create a new chat session
   */
  app.post('/api/buddy/chats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { title, chat_type } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      const result = await pool.query(
        `INSERT INTO buddy_chats (user_id, title, chat_type)
         VALUES ($1, $2, $3)
         RETURNING id, title, chat_type, created_at`,
        [req.user.id, title, chat_type || 'general']
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ success: false, message: 'Failed to create chat' });
    }
  });

  /**
   * DELETE /api/buddy/chats/:chatId
   * Delete a chat session
   */
  app.delete('/api/buddy/chats/:chatId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;

      // Verify ownership
      const chatResult = await pool.query(
        'SELECT user_id FROM buddy_chats WHERE id = $1',
        [chatId]
      );

      if (chatResult.rows.length === 0 || chatResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await pool.query('DELETE FROM buddy_chats WHERE id = $1', [chatId]);
      res.json({ success: true, message: 'Chat deleted' });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ success: false, message: 'Failed to delete chat' });
    }
  });

  // ========================================
  // MESSAGE ENDPOINTS
  // ========================================

  /**
   * GET /api/buddy/chats/:chatId/messages
   * Get messages for a specific chat
   */
  app.get('/api/buddy/chats/:chatId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;

      const result = await pool.query(
        `SELECT id, role, content, rag_sources, created_at
         FROM buddy_messages
         WHERE chat_id = $1 AND user_id = $2
         ORDER BY created_at ASC`,
        [chatId, req.user.id]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
  });

  /**
   * POST /api/buddy/chats/:chatId/messages
   * Send a message and get AI response (with RAG)
   */
  app.post('/api/buddy/chats/:chatId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      // Verify chat ownership
      const chatResult = await pool.query(
        'SELECT user_id FROM buddy_chats WHERE id = $1',
        [chatId]
      );

      if (chatResult.rows.length === 0 || chatResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Store user message
      await pool.query(
        `INSERT INTO buddy_messages (chat_id, user_id, role, content)
         VALUES ($1, $2, 'user', $3)`,
        [chatId, req.user.id, content]
      );

      // Get BUDDY service for user
      const buddy = getBUDDYService(req.user.id);

      // Get user context
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      await buddy.initializeContext(req.user.id, userResult.rows[0]);

      // Get response from BUDDY with RAG
      const response = await buddy.chat(content);

      // Store assistant message with RAG sources
      const messageResult = await pool.query(
        `INSERT INTO buddy_messages (chat_id, user_id, role, content, rag_sources)
         VALUES ($1, $2, 'assistant', $3, $4)
         RETURNING id, role, content, created_at`,
        [
          chatId,
          req.user.id,
          response.message,
          JSON.stringify(response.ragSources || []),
        ]
      );

      // Update chat's last message time
      await pool.query(
        `UPDATE buddy_chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [chatId]
      );

      res.json({ success: true, data: messageResult.rows[0] });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  });

  // ========================================
  // DOCUMENT MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * GET /api/buddy/documents
   * Get all uploaded documents for the user
   */
  app.get('/api/buddy/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, file_name, file_type, document_type, is_indexed, created_at
         FROM buddy_documents
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch documents' });
    }
  });

  /**
   * POST /api/buddy/documents/upload
   * Upload and ingest a document
   */
  app.post(
    '/api/buddy/documents/upload',
    authMiddleware,
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { document_type } = req.body;
        const fileName = req.file.originalname;
        const filePath = req.file.path;

        // Store document record in database
        const docResult = await pool.query(
          `INSERT INTO buddy_documents (user_id, file_name, file_type, file_path, file_size, document_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            req.user.id,
            fileName,
            path.extname(fileName).toLowerCase().slice(1),
            filePath,
            req.file.size,
            document_type || 'general',
          ]
        );

        const documentId = docResult.rows[0].id;

        // Ingest document asynchronously
        const ingestionService = new DocumentIngestionService();

        if (document_type === 'resume') {
          await ingestionService.processResume(req.user.id, documentId, filePath, fileName);
        } else {
          await ingestionService.ingestDocument(req.user.id, documentId, filePath, fileName, document_type);
        }

        // Extract skills from document
        const skillExtractor = new SkillExtractorService();
        const text = fs.readFileSync(filePath, 'utf-8');
        await skillExtractor.extractSkillsFromDocument(req.user.id, text, documentId);

        res.json({ success: true, data: { documentId, message: 'Document uploaded and indexed' } });
      } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, message: 'Failed to upload document' });
      }
    }
  );

  /**
   * DELETE /api/buddy/documents/:documentId
   * Delete a document
   */
  app.delete('/api/buddy/documents/:documentId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { documentId } = req.params;

      // Verify ownership
      const docResult = await pool.query(
        'SELECT user_id, file_path FROM buddy_documents WHERE id = $1',
        [documentId]
      );

      if (docResult.rows.length === 0 || docResult.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Delete file
      try {
        fs.unlinkSync(docResult.rows[0].file_path);
      } catch (e) {
        console.warn('Could not delete physical file:', e);
      }

      // Delete from database
      await pool.query('DELETE FROM buddy_documents WHERE id = $1', [documentId]);

      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, message: 'Failed to delete document' });
    }
  });

  // ========================================
  // SKILL MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * GET /api/buddy/skills
   * Get user's skill profile
   */
  app.get('/api/buddy/skills', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const skillExtractor = new SkillExtractorService();
      const profile = await skillExtractor.getUserSkillProfile(req.user.id);

      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch skills' });
    }
  });

  /**
   * GET /api/buddy/skills/top
   * Get top skills for the user
   */
  app.get('/api/buddy/skills/top', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { limit } = req.query;
      const skillExtractor = new SkillExtractorService();
      const skills = await skillExtractor.getTopSkills(req.user.id, parseInt(limit as string) || 10);

      res.json({ success: true, data: skills });
    } catch (error) {
      console.error('Error fetching top skills:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch top skills' });
    }
  });

  /**
   * GET /api/buddy/skills/recommendations
   * Get skill recommendations
   */
  app.get('/api/buddy/skills/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { targetRole } = req.query;
      const skillExtractor = new SkillExtractorService();
      const recommendations = await skillExtractor.getSkillRecommendations(
        req.user.id,
        targetRole as string
      );

      res.json({ success: true, data: recommendations });
    } catch (error) {
      console.error('Error getting skill recommendations:', error);
      res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
  });

  /**
   * POST /api/buddy/skills
   * Add a custom skill
   */
  app.post('/api/buddy/skills', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { skill, category, proficiencyLevel } = req.body;

      if (!skill || !category) {
        return res.status(400).json({ success: false, message: 'Skill and category are required' });
      }

      const skillExtractor = new SkillExtractorService();
      await skillExtractor.addCustomSkill(req.user.id, skill, category, proficiencyLevel || 'intermediate');

      res.json({ success: true, message: 'Skill added' });
    } catch (error) {
      console.error('Error adding skill:', error);
      res.status(500).json({ success: false, message: 'Failed to add skill' });
    }
  });

  /**
   * PUT /api/buddy/skills/:skillName
   * Update skill proficiency
   */
  app.put('/api/buddy/skills/:skillName', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { skillName } = req.params;
      const { proficiencyLevel } = req.body;

      if (!proficiencyLevel) {
        return res.status(400).json({ success: false, message: 'Proficiency level is required' });
      }

      const skillExtractor = new SkillExtractorService();
      await skillExtractor.updateSkillProficiency(req.user.id, skillName, proficiencyLevel);

      res.json({ success: true, message: 'Skill updated' });
    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({ success: false, message: 'Failed to update skill' });
    }
  });

  /**
   * DELETE /api/buddy/skills/:skillName
   * Remove a skill
   */
  app.delete('/api/buddy/skills/:skillName', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { skillName } = req.params;
      const skillExtractor = new SkillExtractorService();
      await skillExtractor.removeSkill(req.user.id, skillName);

      res.json({ success: true, message: 'Skill removed' });
    } catch (error) {
      console.error('Error removing skill:', error);
      res.status(500).json({ success: false, message: 'Failed to remove skill' });
    }
  });

  // ========================================
  // COVER LETTER ENDPOINTS
  // ========================================

  /**
   * POST /api/buddy/cover-letters
   * Generate a cover letter
   */
  app.post('/api/buddy/cover-letters', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId, jobTitle, company, jobDescription, customizationLevel } = req.body;

      if (!jobTitle || !company) {
        return res.status(400).json({ success: false, message: 'Job title and company are required' });
      }

      const coverLetterService = new CoverLetterService();
      const result = await coverLetterService.generateCoverLetter(req.user.id, chatId || 0, {
        jobTitle,
        company,
        jobDescription: jobDescription || '',
        customizationLevel: customizationLevel || 'moderate',
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      res.status(500).json({ success: false, message: 'Failed to generate cover letter' });
    }
  });

  /**
   * GET /api/buddy/cover-letters
   * Get user's cover letters
   */
  app.get('/api/buddy/cover-letters', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { limit } = req.query;
      const coverLetterService = new CoverLetterService();
      const letters = await coverLetterService.getUserCoverLetters(req.user.id, parseInt(limit as string) || 20);

      res.json({ success: true, data: letters });
    } catch (error) {
      console.error('Error fetching cover letters:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cover letters' });
    }
  });

  /**
   * GET /api/buddy/cover-letters/:letterId
   * Get a specific cover letter
   */
  app.get('/api/buddy/cover-letters/:letterId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { letterId } = req.params;
      const coverLetterService = new CoverLetterService();
      const letter = await coverLetterService.getCoverLetter(parseInt(letterId), req.user.id);

      res.json({ success: true, data: letter });
    } catch (error) {
      console.error('Error fetching cover letter:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cover letter' });
    }
  });

  /**
   * PUT /api/buddy/cover-letters/:letterId
   * Update a cover letter
   */
  app.put('/api/buddy/cover-letters/:letterId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { letterId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ success: false, message: 'Content is required' });
      }

      const coverLetterService = new CoverLetterService();
      await coverLetterService.updateCoverLetter(parseInt(letterId), req.user.id, content);

      res.json({ success: true, message: 'Cover letter updated' });
    } catch (error) {
      console.error('Error updating cover letter:', error);
      res.status(500).json({ success: false, message: 'Failed to update cover letter' });
    }
  });

  /**
   * DELETE /api/buddy/cover-letters/:letterId
   * Delete a cover letter
   */
  app.delete('/api/buddy/cover-letters/:letterId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { letterId } = req.params;
      const coverLetterService = new CoverLetterService();
      await coverLetterService.deleteCoverLetter(parseInt(letterId), req.user.id);

      res.json({ success: true, message: 'Cover letter deleted' });
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      res.status(500).json({ success: false, message: 'Failed to delete cover letter' });
    }
  });

  /**
   * GET /api/buddy/cover-letters/:letterId/suggestions
   * Get improvement suggestions for a cover letter
   */
  app.get('/api/buddy/cover-letters/:letterId/suggestions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { letterId } = req.params;
      const coverLetterService = new CoverLetterService();
      const suggestions = await coverLetterService.getSuggestions(parseInt(letterId), req.user.id);

      res.json({ success: true, data: suggestions });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to get suggestions' });
    }
  });

  // ========================================
  // PROJECT IDEAS ENDPOINT
  // ========================================

  /**
   * GET /api/buddy/project-ideas
   * Generate project ideas based on user profile
   */
  app.get('/api/buddy/project-ideas', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { count } = req.query;
      const buddy = getBUDDYService(req.user.id);

      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      await buddy.initializeContext(req.user.id, userResult.rows[0]);

      const ideas = await buddy.generateProjectIdeas(parseInt(count as string) || 5);

      res.json({ success: true, data: ideas });
    } catch (error) {
      console.error('Error generating project ideas:', error);
      res.status(500).json({ success: false, message: 'Failed to generate project ideas' });
    }
  });

  console.log('✅ BUDDY routes registered successfully');
}
