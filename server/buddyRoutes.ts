import { Express, Request, Response, NextFunction } from 'express';
import { buddyStorage } from './services/buddyStorage';
import BUDDYService from './services/buddyService';
import multer from 'multer';
import path from 'path';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

// Middleware for authentication
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });
  
  try {
    // @ts-ignore
    import('jsonwebtoken').then(jwt => {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      req.user = decoded;
      next();
    });
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Setup multer for document uploads
const upload = multer({
  dest: 'uploads/buddy-documents/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOCX, DOC, TXT, XLS, XLSX'));
    }
  },
});

// Store BUDDY service instances per user (in production, use cache/session)
const buddyInstances = new Map<number, BUDDYService>();

function getBUDDYService(userId: number): BUDDYService {
  if (!buddyInstances.has(userId)) {
    buddyInstances.set(userId, new BUDDYService());
  }
  return buddyInstances.get(userId)!;
}

export async function registerBuddyRoutes(app: Express): Promise<void> {
  /**
   * GET /api/buddy/chats
   * Get all chat sessions for the current user
   */
  app.get('/api/buddy/chats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const chats = await buddyStorage.getUserChats(req.user.id);
      res.json({ success: true, data: chats });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chats', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/chats
   * Create a new chat session
   */
  app.post('/api/buddy/chats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      const chat = await buddyStorage.createChat(req.user.id, title);
      res.json({ success: true, data: chat });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ success: false, message: 'Failed to create chat', error: (error as Error).message });
    }
  });

  /**
   * GET /api/buddy/chats/:chatId/messages
   * Get messages for a specific chat
   */
  app.get('/api/buddy/chats/:chatId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const messages = await buddyStorage.getChatMessages(Number(chatId));
      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch messages', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/chats/:chatId/messages
   * Send a message and get BUDDY response
   */
  app.post('/api/buddy/chats/:chatId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      // Verify chat belongs to user
      const chat = await buddyStorage.getChat(Number(chatId));
      if (!chat || chat.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Add user message to database
      await buddyStorage.addMessage(Number(chatId), req.user.id, 'user', message);

      // Get BUDDY service for this user
      const buddy = getBUDDYService(req.user.id);

      // Get response from BUDDY
      const response = await buddy.chat(message);

      // Add assistant message to database
      const assistantMsg = await buddyStorage.addMessage(Number(chatId), req.user.id, 'assistant', response);

      // Update chat timestamp
      await buddyStorage.updateChat(Number(chatId), { updated_at: new Date() });

      res.json({ success: true, data: { message: assistantMsg.content } });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ success: false, message: 'Failed to process message', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/documents/upload
   * Upload a document for analysis
   */
  app.post('/api/buddy/documents/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { filename, mimetype, size, path: filePath } = req.file;
      const fileType = mimetype.split('/')[1] || 'unknown';

      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      const fileUrl = `/uploads/buddy-documents/${filename}`;

      const document = await buddyStorage.uploadDocument(
        req.user.id,
        filename,
        fileType,
        fileUrl,
        undefined, // extracted_text would be populated after parsing
        size
      );

      res.json({ success: true, data: document });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ success: false, message: 'Failed to upload document', error: (error as Error).message });
    }
  });

  /**
   * GET /api/buddy/documents
   * Get all uploaded documents for the user
   */
  app.get('/api/buddy/documents', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const documents = await buddyStorage.getUserDocuments(req.user.id);
      res.json({ success: true, data: documents });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch documents', error: (error as Error).message });
    }
  });

  /**
   * DELETE /api/buddy/documents/:documentId
   * Delete a document
   */
  app.delete('/api/buddy/documents/:documentId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { documentId } = req.params;
      const document = await buddyStorage.getDocument(Number(documentId));

      if (!document || document.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await buddyStorage.deleteDocument(Number(documentId));
      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, message: 'Failed to delete document', error: (error as Error).message });
    }
  });

  /**
   * GET /api/buddy/skills
   * Get extracted skills for the user
   */
  app.get('/api/buddy/skills', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const skills = await buddyStorage.getUserSkills(req.user.id);
      res.json({ success: true, data: skills });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch skills', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/cover-letter
   * Generate a personalized cover letter
   */
  app.post('/api/buddy/cover-letter', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { jobTitle, companyName, jobDescription } = req.body;

      if (!jobTitle || !companyName) {
        return res.status(400).json({ success: false, message: 'Job title and company name are required' });
      }

      const buddy = getBUDDYService(req.user.id);
      const coverLetter = await buddy.generateCoverLetter(jobTitle, companyName, jobDescription);

      // Save to database
      await buddyStorage.saveCoverLetter(req.user.id, jobTitle, companyName, coverLetter);

      res.json({ success: true, data: { coverLetter } });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      res.status(500).json({ success: false, message: 'Failed to generate cover letter', error: (error as Error).message });
    }
  });

  /**
   * GET /api/buddy/cover-letters
   * Get all generated cover letters for the user
   */
  app.get('/api/buddy/cover-letters', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const coverLetters = await buddyStorage.getUserCoverLetters(req.user.id);
      res.json({ success: true, data: coverLetters });
    } catch (error) {
      console.error('Error fetching cover letters:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cover letters', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/skill-suggestions
   * Get skill suggestions based on profile and career goals
   */
  app.post('/api/buddy/skill-suggestions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { careerGoal } = req.body;

      const buddy = getBUDDYService(req.user.id);
      const suggestions = await buddy.getSkillSuggestions(careerGoal);

      res.json({ success: true, data: { suggestions } });
    } catch (error) {
      console.error('Error getting skill suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to get suggestions', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/project-ideas
   * Get project ideas based on skills
   */
  app.post('/api/buddy/project-ideas', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { numberOfIdeas } = req.body;

      const buddy = getBUDDYService(req.user.id);
      const ideas = await buddy.getProjectIdeas(numberOfIdeas || 3);

      res.json({ success: true, data: { ideas } });
    } catch (error) {
      console.error('Error generating project ideas:', error);
      res.status(500).json({ success: false, message: 'Failed to generate ideas', error: (error as Error).message });
    }
  });

  /**
   * POST /api/buddy/context-memory
   * Save context for personalized guidance
   */
  app.post('/api/buddy/context-memory', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { contextType, contextData } = req.body;

      if (!contextType || !contextData) {
        return res.status(400).json({ success: false, message: 'Context type and data are required' });
      }

      const memory = await buddyStorage.saveContextMemory(req.user.id, contextType, contextData);
      res.json({ success: true, data: memory });
    } catch (error) {
      console.error('Error saving context memory:', error);
      res.status(500).json({ success: false, message: 'Failed to save context', error: (error as Error).message });
    }
  });

  /**
   * GET /api/buddy/context-memory
   * Get context memory for personalization
   */
  app.get('/api/buddy/context-memory', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { contextType } = req.query;
      const memory = await buddyStorage.getContextMemory(req.user.id, contextType as string);
      res.json({ success: true, data: memory });
    } catch (error) {
      console.error('Error fetching context memory:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch context', error: (error as Error).message });
    }
  });
}
