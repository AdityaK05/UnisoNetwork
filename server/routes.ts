// ...existing code...

import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import pool from "./db";
import bcrypt from 'bcryptjs';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { rateLimiters } from './middleware/rateLimiter';
import { CaptchaService } from './services/captcha';
import { isValidCollegeEmail, getCollegeEmailError } from './utils/collegeEmailValidator';
// import { verifyFaceMatch, loadFaceApiModels } from './services/faceVerification';
import { parseResume } from './services/resumeParser';
import { verifyAdminOrCoordinator } from './middleware/adminAuth';
import multer from 'multer';
import path from 'path';

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
      // If the storage threw an Email already registered error, return 409
      const message = (err as Error).message || '';
      if (message.toLowerCase().includes('email already')) {
        return res.status(409).json({ message: 'Email already registered' });
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
      const userId = req.user.id;
      
      // Get user data directly from database to include role
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, name, email, avatar_url, role, created_at FROM users WHERE id = $1',
          [userId]
        );
        
        if (!result.rows[0]) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const user = result.rows[0];
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role || 'student',
          created_at: user.created_at,
        });
      } finally {
        client.release();
      }
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

  // Email Verification Routes (Gmail SMTP - 100% FREE)
  const { EmailVerificationService } = await import('./services/emailVerification');

  // Send OTP to email
  app.post('/api/email/send-otp', authMiddleware, rateLimiters.otpSend, async (req: AuthRequest, res: Response) => {
    try {
      const { email, captchaToken } = req.body;

      // Validation
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Verify CAPTCHA (if configured)
      if (CaptchaService.isConfigured() && captchaToken) {
        const captchaResult = await CaptchaService.verify(captchaToken, 'send_otp');
        if (!captchaResult.success) {
          return res.status(400).json({ 
            message: captchaResult.message || 'CAPTCHA verification failed',
            requiresCaptcha: true,
          });
        }
      }

      // Send OTP via Email (FREE - Gmail SMTP)
      // Validity period: 10 minutes
      const result = await EmailVerificationService.sendVerificationEmail(email, req.user.id, 10);

      if (!result.success) {
        return res.status(500).json({ message: result.message || 'Failed to send OTP' });
      }

      res.json({
        success: true,
        message: 'Verification code sent to your email',
        email: email,
        expiresIn: 600, // 10 minutes in seconds
        costSavings: '100% FREE - No SMS costs!',
      });
    } catch (err) {
      console.error('Error sending email OTP:', err);
      res.status(500).json({ 
        message: 'Error sending OTP', 
        error: (err as Error).message 
      });
    }
  });

  // Verify Email OTP
  app.post('/api/email/verify-otp', authMiddleware, rateLimiters.otpVerify, async (req: AuthRequest, res: Response) => {
    try {
      const { code } = req.body;

      // Validation
      if (!code || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: 'Invalid OTP format. Must be 6 digits.' });
      }

      // Verify OTP
      const result = await EmailVerificationService.verifyEmailCode(req.user.id, code);

      if (!result.success) {
        return res.status(401).json({ 
          message: result.message || 'Invalid or expired OTP'
        });
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (err) {
      console.error('Error verifying email OTP:', err);
      res.status(500).json({ 
        message: 'Error verifying OTP', 
        error: (err as Error).message 
      });
    }
  });

  // Signup-specific email verification (no auth required)
  
  // Temporary store for signup OTPs (email -> {code, expiresAt, userData})
  const signupOtpStore = new Map<string, { code: string; expiresAt: Date; userData: any }>();

  // Send OTP during signup (before account creation)
  app.post('/api/email/send-otp-signup', rateLimiters.otpSend, async (req: Request, res: Response) => {
    try {
      console.log('📧 Signup OTP request received:', req.body);
      const { email, name } = req.body;

      // Validation
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate college email domain
      if (!isValidCollegeEmail(email)) {
        return res.status(400).json({ 
          message: getCollegeEmailError(email)
        });
      }

      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      signupOtpStore.set(email, { code, expiresAt, userData: { name, email } });

      // Send email (with dev mode fallback)
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const mailOptions = {
            from: `"UnisoNetwork" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - UnisoNetwork',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Welcome to UnisoNetwork! 🚀</h2>
                <p>Hi ${name || 'there'},</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${code}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Signup verification email sent to ${email}`);
        } catch (emailError) {
          console.error('⚠️ Email sending failed, using console fallback:', emailError);
          console.log(`📧 DEV MODE - OTP for ${email}: ${code}`);
        }
      } else {
        // Dev mode - no email credentials configured
        console.log('📧 DEV MODE - Email credentials not configured');
        console.log(`📧 OTP for ${email}: ${code}`);
        console.log('📧 Expires at:', expiresAt.toLocaleString());
      }

      res.json({
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: 600,
      });
    } catch (err) {
      console.error('❌ Error sending signup OTP:', err);
      res.status(500).json({ 
        success: false,
        message: 'Error sending verification code', 
        error: (err as Error).message 
      });
    }
  });

  // Signup with email verification
  app.post('/api/users/signup-with-email', async (req: Request, res: Response) => {
    try {
      const { name, email, password, otp, rollNumber, collegeName, course, yearOfAdmission } = req.body;

      // Validation
      if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ message: 'Invalid OTP format. Must be 6 digits.' });
      }

      // Validate college email domain
      if (!isValidCollegeEmail(email)) {
        return res.status(400).json({ 
          message: getCollegeEmailError(email)
        });
      }

      // Verify OTP
      const storedOtp = signupOtpStore.get(email);
      if (!storedOtp) {
        return res.status(401).json({ message: 'No verification code found. Please request a new one.' });
      }

      if (storedOtp.expiresAt < new Date()) {
        signupOtpStore.delete(email);
        return res.status(401).json({ message: 'Verification code expired. Please request a new one.' });
      }

      if (storedOtp.code !== otp) {
        return res.status(401).json({ message: 'Invalid verification code' });
      }

      // Delete used OTP
      signupOtpStore.delete(email);

      // Check if email already exists (double-check)
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with verified email
      const user = await storage.createUser({
        name,
        email,
        password_hash: hashedPassword,
      });

      // Store student details for ID verification
      if (rollNumber && collegeName) {
        await pool.query(
          `UPDATE users SET 
           roll_number = $1, 
           college_name = $2
           WHERE id = $3`,
          [rollNumber, collegeName, user.id]
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          rollNumber,
          collegeName,
          course,
          yearOfAdmission,
        },
      });
    } catch (err) {
      console.error('Signup with email failed:', err);
      res.status(500).json({ 
        message: 'Signup failed', 
        error: (err as Error).message 
      });
    }
  });

  // Student ID Verification Routes
  const { upload, validateImage, checkVerificationRateLimit } = await import('./middleware/imageValidation');
  const { IdVerificationService } = await import('./services/idVerification');

  // Get ID verification status
  app.get('/api/id-verification/status', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const status = await storage.getIdVerificationStatus(req.user.id);
      
      if (!status) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        success: true,
        isVerified: status.isVerified,
        imageUrl: status.imageUrl,
        attempts: status.attempts,
        lastAttempt: status.lastAttempt,
        studentInfo: {
          name: status.studentName,
          rollNumber: status.rollNumber,
          collegeName: status.collegeName,
          idNumber: status.idNumber,
        },
      });
    } catch (err) {
      console.error('Error fetching ID verification status:', err);
      res.status(500).json({ 
        message: 'Error fetching ID verification status', 
        error: (err as Error).message 
      });
    }
  });

  // Upload and verify student ID card
  app.post(
    '/api/id-verification/upload-id',
    authMiddleware,
    checkVerificationRateLimit,
    upload.single('idCard'),
    validateImage,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No image file uploaded',
          });
        }

        // Get student details from request body (can be sent along with file upload)
        const { name: providedName, rollNumber, collegeName, course, yearOfAdmission } = req.body;

        // Get user data
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        console.log(`Processing ID verification for user ${user.id} - ${user.name}`);
        console.log('Student details:', { providedName, rollNumber, collegeName, course });

        // Use provided details if available, otherwise use stored user data
        const verificationData = {
          name: providedName || user.name,
          email: user.email,
          student_name: user.student_name || providedName || undefined,
          roll_number: rollNumber || user.roll_number || undefined,
          college_name: collegeName || user.college_name || undefined,
          id_number: user.id_number || undefined,
        };

        // Verify the ID card
        const result = await IdVerificationService.verifyStudentId(
          req.file.buffer,
          req.file.originalname,
          verificationData
        );

        // Update database
        if (result.imageUrl) {
          await storage.updateIdVerification(
            req.user.id,
            result.imageUrl,
            result.verified,
            result.extractedData ? {
              name: result.extractedData.name,
              rollNumber: result.extractedData.rollNumber,
              collegeName: result.extractedData.collegeName,
              idNumber: result.extractedData.idNumber,
            } : undefined
          );
        }

        // Determine mismatched fields
        const mismatchedFields: string[] = [];
        if (result.extractedData && result.matchScore && result.matchScore < 0.8) {
          if (verificationData.name && result.extractedData.name) {
            const nameSim = IdVerificationService.calculateSimilarity(result.extractedData.name, verificationData.name);
            if (nameSim < 0.8) mismatchedFields.push('name');
          }
          if (verificationData.roll_number && result.extractedData.rollNumber) {
            const rollSim = IdVerificationService.calculateSimilarity(result.extractedData.rollNumber, verificationData.roll_number);
            if (rollSim < 0.8) mismatchedFields.push('roll_number');
          }
          if (verificationData.college_name && result.extractedData.collegeName) {
            const collegeSim = IdVerificationService.calculateSimilarity(result.extractedData.collegeName, verificationData.college_name);
            if (collegeSim < 0.8) mismatchedFields.push('college_name');
          }
        }

        // Return result in the specified format
        res.json({
          success: result.success,
          matchScore: result.matchScore || 0,
          verificationStatus: result.verified ? 'Verified' : 'Rejected',
          mismatchedFields,
          parsedData: result.extractedData ? {
            name: result.extractedData.name,
            roll_number: result.extractedData.rollNumber,
            college_name: result.extractedData.collegeName,
            id_number: result.extractedData.idNumber,
          } : {},
          imageUrl: result.imageUrl,
          message: result.message,
          errors: result.errors,
        });
      } catch (err: any) {
        console.error('Error uploading ID card:', err);
        res.status(500).json({
          success: false,
          message: 'Error processing ID card',
          error: err.message,
        });
      }
    }
  );

  // Update student profile information (for better matching)
  app.put('/api/id-verification/update-profile', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { studentName, rollNumber, collegeName, idNumber } = req.body;

      if (!studentName || !rollNumber || !collegeName) {
        return res.status(400).json({
          success: false,
          message: 'Student name, roll number, and college name are required',
        });
      }

      // Update user profile with student details
      await pool.query(
        `UPDATE users SET 
          student_name = $1,
          roll_number = $2,
          college_name = $3,
          id_number = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5`,
        [studentName, rollNumber, collegeName, idNumber || null, req.user.id]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: (err as Error).message,
      });
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

  // Forums (Real Talks) - return list of threads
  app.get('/api/forums', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const threads = await storage.getForumThreads(limit);

      // Normalize fields for frontend expectations
      const normalized = (threads || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        category: t.category,
        tags: t.tags,
        images: t.images ? (typeof t.images === 'string' ? JSON.parse(t.images) : t.images) : [],
        author: t.author_name || null,
        authorAvatar: t.author_avatar || null,
        date: t.created_at || t.createdAt || null,
        replies: t.reply_count || t.replies || 0,
        likes: t.upvotes || t.likes || 0,
        isHot: t.is_hot || t.isHot || false,
      }));

      res.json(normalized);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching forum threads', error: (err as Error).message });
    }
  });

  app.post('/api/forums', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const postData = {
        title: req.body.title || 'Forum Post',
        content: req.body.content,
        category: req.body.category || 'general',
        images: req.body.images || [],
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

  // ============================================
  // FACE VERIFICATION ROUTES
  // ============================================

  // Configure multer for face verification selfie uploads
  const faceVerificationUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
      }
    },
  });

  // Face verification rate limiter (3 attempts per 24 hours)
  const faceVerificationAttempts = new Map<number, { count: number; resetAt: Date }>();

  function checkFaceVerificationLimit(userId: number): boolean {
    const now = new Date();
    const userAttempts = faceVerificationAttempts.get(userId);

    if (!userAttempts || userAttempts.resetAt < now) {
      // Reset or create new entry
      faceVerificationAttempts.set(userId, { count: 1, resetAt: new Date(now.getTime() + 30 * 60 * 1000) });
      return true;
    }

    if (userAttempts.count >= 5) {
      return false; // Exceeded limit
    }

    userAttempts.count++;
    return true;
  }

  // POST /api/face-verification - Verify face match between ID card and selfie
  app.post(
    '/api/face-verification',
    authMiddleware,
    faceVerificationUpload.single('selfieImage'),
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check rate limit
        if (!checkFaceVerificationLimit(userId)) {
          return res.status(429).json({
            success: false,
            message: 'Face verification attempt limit exceeded. Please try again after 30 minutes.',
          });
        }

        // Get uploaded selfie
        const selfieFile = (req as any).file;
        if (!selfieFile) {
          return res.status(400).json({ success: false, message: 'Selfie image is required' });
        }

        // Get user's ID card image URL from database
        const client = await pool.connect();
        try {
          const result = await client.query(
            'SELECT id_card_image_url, is_face_verified FROM users WHERE id = $1',
            [userId]
          );

          if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: 'User not found' });
          }

          const { id_card_image_url, is_face_verified } = result.rows[0];

          if (!id_card_image_url) {
            return res.status(400).json({
              success: false,
              message: 'No ID card image found. Please upload your ID card first.',
            });
          }

          if (is_face_verified) {
            return res.status(400).json({
              success: false,
              message: 'Your face has already been verified.',
            });
          }

          // Get match score from client (client-side face-api.js does the comparison)
          const matchScore = parseFloat(req.body.matchScore || '0');
          const success = matchScore >= 0.3; // 30% similarity threshold (lowered for easier verification)

          console.log(`🔍 Face verification for user ${userId}: ${matchScore.toFixed(2)} (${success ? 'PASSED' : 'FAILED'})`);

          // Update database if successful
          if (success) {
            await client.query(
              'UPDATE users SET is_face_verified = true, face_verified_at = CURRENT_TIMESTAMP WHERE id = $1',
              [userId]
            );
            console.log(`✅ Face verification successful for user ${userId}`);
          }

          res.json({
            success,
            matchScore,
            verificationStatus: success ? 'Face Matched ✅' : 'Face Not Matched ❌',
            message: success 
              ? 'Face verification successful! Your identity has been confirmed.' 
              : 'Face verification failed. Please ensure good lighting and try again.',
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error('Error in face verification:', error);
        res.status(500).json({
          success: false,
          matchScore: 0,
          verificationStatus: 'Error',
          message: error.message || 'Face verification failed due to a server error',
        });
      }
    }
  );

  // GET /api/face-verification/status - Check face verification status
  app.get('/api/face-verification/status', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT is_face_verified, face_verified_at, id_card_image_url FROM users WHERE id = $1',
          [userId]
        );

        if (!result.rows[0]) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          isFaceVerified: result.rows[0].is_face_verified || false,
          faceVerifiedAt: result.rows[0].face_verified_at || null,
          idCardImageUrl: result.rows[0].id_card_image_url || null,
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Error checking face verification status:', error);
      res.status(500).json({ message: 'Error checking face verification status' });
    }
  });

  // ============================================
  // RESUME PARSING ROUTES
  // ============================================

  // Configure multer for resume uploads
  const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
      }
    },
  });

  // POST /api/resume/upload - Upload and parse resume
  app.post(
    '/api/resume/upload',
    authMiddleware,
    resumeUpload.single('resume'),
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ 
            success: false,
            message: 'Unauthorized. Please log in to upload your resume.' 
          });
        }

        // Get uploaded resume file
        const resumeFile = (req as any).file;
        if (!resumeFile) {
          return res.status(400).json({ 
            success: false, 
            message: 'Resume file is required. Please select a PDF or DOCX file.' 
          });
        }

        // Validate file buffer
        if (!resumeFile.buffer || resumeFile.buffer.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Uploaded file is empty. Please try again.',
          });
        }

        // Log file details for debugging
        console.log('📄 Resume upload details:');
        console.log('  - User ID:', userId);
        console.log('  - File name:', resumeFile.originalname);
        console.log('  - File size:', resumeFile.size, 'bytes');
        console.log('  - MIME type:', resumeFile.mimetype);
        console.log('  - Buffer length:', resumeFile.buffer.length);

        // Warn about large files
        if (resumeFile.size > 5 * 1024 * 1024) {
          console.warn('⚠️  Large file detected (>5MB). Processing may take longer.');
        }

        // Determine file type
        const ext = path.extname(resumeFile.originalname).toLowerCase();
        let fileType: 'pdf' | 'docx';
        
        if (ext === '.pdf' || resumeFile.mimetype === 'application/pdf') {
          fileType = 'pdf';
        } else if (ext === '.docx' || resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileType = 'docx';
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only PDF and DOCX files are supported.',
          });
        }
        
        console.log(`📄 Processing ${fileType.toUpperCase()} resume for user ${userId}...`);

        // Parse resume with error handling
        let parsedData;
        try {
          parsedData = await parseResume(resumeFile.buffer, fileType);
        } catch (parseError: any) {
          console.error('❌ Resume parsing failed:', parseError.message);
          
          // Provide specific error messages
          if (parseError.message.includes('scanned') || parseError.message.includes('image-based')) {
            return res.status(400).json({
              success: false,
              message: 'This appears to be a scanned PDF without a text layer. Please upload a text-based resume or convert your scanned document using OCR.',
            });
          } else if (parseError.message.includes('Empty')) {
            return res.status(400).json({
              success: false,
              message: 'The resume appears to be empty. Please ensure the file contains text content.',
            });
          } else if (parseError.message.includes('Invalid PDF')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid or corrupted PDF file. Please try a different file.',
            });
          } else {
            return res.status(500).json({
              success: false,
              message: `Failed to parse resume: ${parseError.message}`,
            });
          }
        }

        // Validate parsed data
        if (!parsedData) {
          return res.status(500).json({
            success: false,
            message: 'Resume parsing returned no data. Please try a different file.',
          });
        }

        console.log('✅ Resume parsed successfully for user', userId);

        // Return parsed data
        res.json({
          success: true,
          message: 'Resume parsed successfully! ✅',
          data: parsedData,
        });
      } catch (error: any) {
        console.error('❌ Unexpected error parsing resume:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to parse resume. Please ensure it is a valid text-based PDF or DOCX file.',
        });
      }
    }
  );

  // =============================================================================
  // ADMIN & PLACEMENT COORDINATOR JOB PORTAL ROUTES
  // =============================================================================

  // CREATE Job/Internship (Admin/Coordinator Only)
  app.post(
    '/api/admin/jobs',
    authMiddleware,
    verifyAdminOrCoordinator,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        const {
          title,
          company_name,
          description,
          location,
          job_type,
          salary_range,
          skills_required,
          application_deadline,
          application_link,
        } = req.body;

        // Validation
        if (!title || !company_name || !job_type) {
          return res.status(400).json({
            success: false,
            message: 'Title, company name, and job type are required',
          });
        }

        if (!['Internship', 'Full-time', 'Part-time'].includes(job_type)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid job type. Must be Internship, Full-time, or Part-time',
          });
        }

        const client = await pool.connect();
        try {
          const result = await client.query(
            `INSERT INTO jobs (
              title, company_name, description, location, job_type, 
              salary_range, skills_required, application_deadline, 
              application_link, posted_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
              title,
              company_name,
              description || null,
              location || null,
              job_type,
              salary_range || null,
              skills_required || [],
              application_deadline || null,
              application_link || null,
              userId,
            ]
          );

          res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job: result.rows[0],
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error('Error creating job:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create job posting',
        });
      }
    }
  );

  // GET All Jobs Created by Admin/Coordinator
  app.get(
    '/api/admin/jobs',
    authMiddleware,
    verifyAdminOrCoordinator,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;

        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT j.*, u.name as posted_by_name, u.email as posted_by_email
             FROM jobs j
             LEFT JOIN users u ON j.posted_by = u.id
             WHERE j.posted_by = $1
             ORDER BY j.posted_at DESC`,
            [userId]
          );

          res.json({
            success: true,
            jobs: result.rows,
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error('Error fetching admin jobs:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch jobs',
        });
      }
    }
  );

  // UPDATE Job (Admin/Coordinator Only)
  app.put(
    '/api/admin/jobs/:id',
    authMiddleware,
    verifyAdminOrCoordinator,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        const jobId = parseInt(req.params.id);
        const {
          title,
          company_name,
          description,
          location,
          job_type,
          salary_range,
          skills_required,
          application_deadline,
          application_link,
          status,
        } = req.body;

        const client = await pool.connect();
        try {
          // Check if job exists and belongs to user
          const checkResult = await client.query(
            'SELECT * FROM jobs WHERE id = $1 AND posted_by = $2',
            [jobId, userId]
          );

          if (checkResult.rows.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'Job not found or you do not have permission to edit it',
            });
          }

          // Update job
          const result = await client.query(
            `UPDATE jobs SET
              title = COALESCE($1, title),
              company_name = COALESCE($2, company_name),
              description = COALESCE($3, description),
              location = COALESCE($4, location),
              job_type = COALESCE($5, job_type),
              salary_range = COALESCE($6, salary_range),
              skills_required = COALESCE($7, skills_required),
              application_deadline = COALESCE($8, application_deadline),
              application_link = COALESCE($9, application_link),
              status = COALESCE($10, status),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $11 AND posted_by = $12
            RETURNING *`,
            [
              title,
              company_name,
              description,
              location,
              job_type,
              salary_range,
              skills_required,
              application_deadline,
              application_link,
              status,
              jobId,
              userId,
            ]
          );

          res.json({
            success: true,
            message: 'Job updated successfully',
            job: result.rows[0],
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error('Error updating job:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update job',
        });
      }
    }
  );

  // DELETE Job (Admin/Coordinator Only)
  app.delete(
    '/api/admin/jobs/:id',
    authMiddleware,
    verifyAdminOrCoordinator,
    async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        const jobId = parseInt(req.params.id);

        const client = await pool.connect();
        try {
          const result = await client.query(
            'DELETE FROM jobs WHERE id = $1 AND posted_by = $2 RETURNING *',
            [jobId, userId]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'Job not found or you do not have permission to delete it',
            });
          }

          res.json({
            success: true,
            message: 'Job deleted successfully',
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error('Error deleting job:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete job',
        });
      }
    }
  );

  // GET All Active Jobs (Public - Students)
  app.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const { job_type, location, search } = req.query;

      const client = await pool.connect();
      try {
        let query = `
          SELECT j.*, u.name as posted_by_name
          FROM jobs j
          LEFT JOIN users u ON j.posted_by = u.id
          WHERE j.status = 'Active'
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (job_type) {
          query += ` AND j.job_type = $${paramIndex}`;
          params.push(job_type);
          paramIndex++;
        }

        if (location) {
          query += ` AND j.location ILIKE $${paramIndex}`;
          params.push(`%${location}%`);
          paramIndex++;
        }

        if (search) {
          query += ` AND (j.title ILIKE $${paramIndex} OR j.company_name ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        query += ' ORDER BY j.posted_at DESC';

        const result = await client.query(query, params);

        res.json({
          success: true,
          jobs: result.rows,
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs',
      });
    }
  });

  // GET Single Job Details (Public)
  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);

      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT j.*, u.name as posted_by_name, u.email as posted_by_email
           FROM jobs j
           LEFT JOIN users u ON j.posted_by = u.id
           WHERE j.id = $1`,
          [jobId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Job not found',
          });
        }

        res.json({
          success: true,
          job: result.rows[0],
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch job details',
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
