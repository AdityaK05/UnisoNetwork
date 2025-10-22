import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Email Verification Service
 * FREE OTP via Gmail SMTP
 */

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailVerificationResult {
  success: boolean;
  message?: string;
  token?: string;
}

// In-memory store for verification tokens (use Redis/DB in production)
const verificationTokens = new Map<string, {
  email: string;
  userId: number;
  code: string;
  expiresAt: Date;
}>();

export class EmailVerificationService {
  /**
   * Generate a 6-digit verification code
   */
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a unique token for verification link
   */
  private static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Send verification email with code
   * @param email - Email address to send to
   * @param userId - User ID for tracking
   * @param validityMinutes - How long code is valid (default 10 minutes)
   */
  static async sendVerificationEmail(
    email: string,
    userId: number,
    validityMinutes: number = 10
  ): Promise<EmailVerificationResult> {
    try {
      const code = this.generateCode();
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

      // Store verification data
      verificationTokens.set(token, {
        email,
        userId,
        code,
        expiresAt,
      });

      // Development mode - log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 DEV MODE - Email Verification Code:', code);
        console.log('📧 Email:', email);
        console.log('📧 Expires at:', expiresAt.toLocaleString());
        console.log('🔗 Verification link token:', token);
        
        return {
          success: true,
          message: 'Verification email sent (dev mode - check console)',
          token,
        };
      }

      // Production mode - send actual email via Gmail
      const mailOptions = {
        from: `"UnisoNetwork" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - UnisoNetwork',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in ${validityMinutes} minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
      
      return {
        success: true,
        message: 'Verification email sent',
        token,
      };
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send verification email',
      };
    }
  }

  /**
   * Verify email code
   */
  static async verifyEmailCode(userId: number, code: string): Promise<EmailVerificationResult> {
    try {
      // Find matching token
      const entries = Array.from(verificationTokens.entries());
      for (const [token, data] of entries) {
        if (data.userId === userId) {
          // Check if expired
          if (data.expiresAt < new Date()) {
            verificationTokens.delete(token);
            return {
              success: false,
              message: 'Verification code expired',
            };
          }

          // Verify code
          if (data.code === code) {
            verificationTokens.delete(token);
            return {
              success: true,
              message: 'Email verified successfully',
            };
          }

          return {
            success: false,
            message: 'Invalid verification code',
          };
        }
      }

      return {
        success: false,
        message: 'No verification code found',
      };
    } catch (error: any) {
      console.error('❌ Error verifying email code:', error);
      return {
        success: false,
        message: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Verify email via token link
   */
  static async verifyEmailToken(token: string): Promise<EmailVerificationResult> {
    try {
      const data = verificationTokens.get(token);

      if (!data) {
        return {
          success: false,
          message: 'Invalid or expired verification link',
        };
      }

      // Check if expired
      if (data.expiresAt < new Date()) {
        verificationTokens.delete(token);
        return {
          success: false,
          message: 'Verification link expired',
        };
      }

      verificationTokens.delete(token);
      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error: any) {
      console.error('❌ Error verifying email token:', error);
      return {
        success: false,
        message: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Clean up expired tokens (call periodically)
   */
  static cleanupExpiredTokens(): void {
    const now = new Date();
    const entries = Array.from(verificationTokens.entries());
    for (const [token, data] of entries) {
      if (data.expiresAt < now) {
        verificationTokens.delete(token);
      }
    }
  }
}

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  EmailVerificationService.cleanupExpiredTokens();
}, 5 * 60 * 1000);
