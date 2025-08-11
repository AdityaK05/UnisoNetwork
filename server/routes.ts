// ...existing code...

import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import bcrypt from 'bcryptjs';
// @ts-ignore
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get groups the current user is a member of
  app.get('/api/groups/my', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const groups = await storage.getGroupsForUser(req.user.id);
      res.json(groups);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching my groups', error: (err as Error).message });
    }
  });

  // Join a group
  app.post('/api/groups/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      await storage.joinGroup(req.user.id, Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Error joining group', error: (err as Error).message });
    }
  });
  // Users

  // Signup (register)
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { name, email, password_hash, avatar_url } = req.body;
      if (!name || !email || !password_hash) return res.status(400).json({ message: 'Missing fields' });
      const hashed = await bcrypt.hash(password_hash, 10);
      const user = await storage.createUser({ name, email, password_hash: hashed, avatar_url });
      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      console.error('Signup failed:', err);
      if (err instanceof Error && err.stack) {
        console.error('Stack trace:', err.stack);
      }
      res.status(500).json({ message: 'Signup failed', error: (err as Error).message });
    }
  });

  // Login
  app.post('/api/users/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } });
    } catch (err) {
      console.error('Login failed:', err);
      if (err instanceof Error && err.stack) {
        console.error('Stack trace:', err.stack);
      }
      res.status(500).json({ message: 'Login failed', error: (err as Error).message });
    }
  });

  // Get current user (used by frontend for auto-login)
  app.get('/api/users/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching current user', error: (err as Error).message });
    }
  });

  app.get('/api/users/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching user', error: (err as Error).message });
    }
  });

  // Internships
  app.get('/api/internships', async (req: Request, res: Response) => {
    try {
      const filters = {
        type: req.query.type as string,
        domain: req.query.domain as string,
        location: req.query.location as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };
      const internships = await storage.getInternships(filters);
      res.json(internships);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching internships', error: (err as Error).message });
    }
  });

  app.post('/api/internships', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const internshipData = {
        ...req.body,
        created_by: req.user.id
      };
      const internship = await storage.createInternship(internshipData);
      res.json(internship);
    } catch (err) {
      res.status(500).json({ message: 'Error creating internship', error: (err as Error).message });
    }
  });

  // Companies
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching companies', error: (err as Error).message });
    }
  });

  app.post('/api/companies', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const company = await storage.createCompany(req.body);
      res.json(company);
    } catch (err) {
      res.status(500).json({ message: 'Error creating company', error: (err as Error).message });
    }
  });

  // Forums (Real Talks)
  app.get('/api/forums', async (req: Request, res: Response) => {
    try {
      const forumId = req.query.forum_id ? Number(req.query.forum_id) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const posts = await storage.getForumReplies(forumId || 1, limit);
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching forum posts', error: (err as Error).message });
    }
  });

  app.post('/api/forums', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const postData = {
        title: req.body.title || 'Forum Post',
        content: req.body.content,
        category: req.body.category || 'general',
        created_by: req.user.id
      };
      const post = await storage.createForumThread(postData);
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: 'Error creating forum post', error: (err as Error).message });
    }
  });

  app.get('/api/forums/:id/posts', async (req: Request, res: Response) => {
    try {
      const posts = await storage.getForumReplies(Number(req.params.id));
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching forum posts', error: (err as Error).message });
    }
  });

  app.post('/api/forums/:id/posts', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const postData = {
        thread_id: Number(req.params.id),
        content: req.body.content,
        created_by: req.user.id
      };
      const post = await storage.createForumReply(postData);
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: 'Error creating forum post', error: (err as Error).message });
    }
  });

  // Groups
  app.get('/api/groups', async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        privacy: req.query.privacy as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };
      const groups = await storage.getGroups(filters);
      res.json(groups);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching groups', error: (err as Error).message });
    }
  });

  app.post('/api/groups', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const groupData = {
        ...req.body,
        created_by: req.user.id
      };
      const group = await storage.createGroup(groupData);
      res.json(group);
    } catch (err) {
      res.status(500).json({ message: 'Error creating group', error: (err as Error).message });
    }
  });

  // Events
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const filters = {
        event_type: req.query.event_type as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching events', error: (err as Error).message });
    }
  });

  app.post('/api/events', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const eventData = {
        ...req.body,
        created_by: req.user.id
      };
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: 'Error creating event', error: (err as Error).message });
    }
  });

  // Resources
  app.get('/api/resources', async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        resource_type: req.query.resource_type as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };
      const resources = await storage.getResources(filters);
      res.json(resources);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching resources', error: (err as Error).message });
    }
  });

  app.post('/api/resources', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const resourceData = {
        ...req.body,
        posted_by: req.user.id
      };
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (err) {
      res.status(500).json({ message: 'Error creating resource', error: (err as Error).message });
    }
  });

  // Search endpoint
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as string;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const results = await storage.searchContent(query, type, limit);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Error searching content', error: (err as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
