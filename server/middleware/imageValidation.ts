import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter for image validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WEBP are allowed.'));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Middleware to validate uploaded image
 */
export const validateImage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded',
    });
  }

  // Additional validation
  const file = req.file;

  // Check file size (additional check)
  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.',
    });
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file extension. Only JPG, PNG, and WEBP are allowed.',
    });
  }

  // Sanitize filename
  const sanitizedFilename = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
  
  req.file.originalname = sanitizedFilename;

  next();
};

/**
 * Middleware to check ID verification rate limit
 */
export const checkVerificationRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Import storage to check attempts
    const { storage } = await import('../storage');
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already verified
    if (user.is_id_verified) {
      return res.status(400).json({
        success: false,
        message: 'ID already verified',
      });
    }

    // Check rate limit: max 3 attempts per day
    const MAX_ATTEMPTS_PER_DAY = 3;
    const lastAttempt = user.last_verification_attempt;
    const attempts = user.id_verification_attempts || 0;

    if (lastAttempt) {
      const now = new Date();
      const lastAttemptDate = new Date(lastAttempt);
      const hoursSinceLastAttempt = (now.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60);

      // Reset attempts if more than 24 hours
      if (hoursSinceLastAttempt >= 24) {
        // Attempts will be reset in the service
      } else if (attempts >= MAX_ATTEMPTS_PER_DAY) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastAttempt);
        return res.status(429).json({
          success: false,
          message: `Maximum verification attempts reached. Please try again in ${hoursRemaining} hours.`,
          remainingHours: hoursRemaining,
          maxAttempts: MAX_ATTEMPTS_PER_DAY,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking rate limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification rate limit',
    });
  }
};
