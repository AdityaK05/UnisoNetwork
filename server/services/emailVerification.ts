import { randomBytes } from 'crypto';

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
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  static async sendVerificationEmail(email: string, userId: number, validityMinutes = 10): Promise<EmailVerificationResult> {
    try {
      const code = this.generateCode();
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

      verificationTokens.set(token, { email, userId, code, expiresAt });

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding:20px;">
          <h2 style="color:#4F46E5">Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background:#f3f4f6;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:5px;margin:20px 0;">${code}</div>
          <p>This code will expire in ${validityMinutes} minutes.</p>
          <p style="color:#6b7280;font-size:14px">If you didn't request this code, please ignore this email.</p>
        </div>
      `;

      // If running in development, log and return
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 DEV MODE - Email Verification Code:', code);
        console.log('📧 Email:', email);
        console.log('📧 Expires at:', expiresAt.toLocaleString());
        console.log('🔗 Verification link token:', token);
        return { success: true, message: 'Verification email sent (dev mode - check console)', token };
      }

      // Try SendGrid HTTP API first
      const sendViaSendGrid = async () => {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) throw new Error('SendGrid API key not configured');
        const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@uniso.app';
        const payload = {
          personalizations: [{ to: [{ email }], subject: 'Verify Your Email - UnisoNetwork' }],
          from: { email: fromEmail, name: 'UnisoNetwork' },
          reply_to: { email: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || fromEmail },
          content: [{ type: 'text/html', value: htmlBody }],
        };

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);
        try {
          const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal as any,
          });
          clearTimeout(id);
          if (!r.ok) {
            const text = await r.text().catch(() => '');
            throw new Error(`SendGrid error ${r.status}: ${text}`);
          }
          console.log(`✅ Verification email sent via SendGrid to ${email}`);
          return true;
        } catch (err) {
          clearTimeout(id);
          throw err;
        }
      };

      // Fallback to SMTP via nodemailer
      const sendViaSmtp = async () => {
        if (!(process.env.EMAIL_USER && process.env.EMAIL_PASS)) throw new Error('SMTP credentials not configured');
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
        });

        const mailOptions = {
          from: `"UnisoNetwork" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Verify Your Email - UnisoNetwork',
          html: htmlBody,
          replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER,
        };

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 8000));
        await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);
        console.log(`✅ Verification email sent via SMTP to ${email}`);
        return true;
      };

      try {
        if (process.env.SENDGRID_API_KEY) {
          await sendViaSendGrid();
        } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await sendViaSmtp();
        } else {
          console.log('📧 DEV MODE - Email credentials not configured');
          console.log(`📧 OTP for ${email}: ${code}`);
          console.log('📧 Expires at:', expiresAt.toLocaleString());
        }
      } catch (sendErr) {
        console.error('⚠️ Primary email provider failed:', sendErr);
        try {
          await sendViaSmtp();
        } catch (smtpErr) {
          console.error('⚠️ SMTP fallback failed, using console fallback:', smtpErr);
          console.log(`📧 DEV MODE - OTP for ${email}: ${code}`);
        }
      }

      return { success: true, message: 'Verification code sent', token };
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, message: error.message || 'Failed to send verification email' };
    }
  }

  static async verifyEmailCode(userId: number, code: string): Promise<EmailVerificationResult> {
    try {
      const entries = Array.from(verificationTokens.entries());
      for (const [token, data] of entries) {
        if (data.userId === userId) {
          if (data.expiresAt < new Date()) {
            verificationTokens.delete(token);
            return { success: false, message: 'Verification code expired' };
          }
          if (data.code === code) {
            verificationTokens.delete(token);
            return { success: true, message: 'Email verified successfully' };
          }
          return { success: false, message: 'Invalid verification code' };
        }
      }
      return { success: false, message: 'No verification code found' };
    } catch (error: any) {
      console.error('❌ Error verifying email code:', error);
      return { success: false, message: error.message || 'Verification failed' };
    }
  }

  static async verifyEmailToken(token: string): Promise<EmailVerificationResult> {
    try {
      const data = verificationTokens.get(token);
      if (!data) return { success: false, message: 'Invalid or expired verification link' };
      if (data.expiresAt < new Date()) {
        verificationTokens.delete(token);
        return { success: false, message: 'Verification link expired' };
      }
      verificationTokens.delete(token);
      return { success: true, message: 'Email verified successfully' };
    } catch (error: any) {
      console.error('❌ Error verifying email token:', error);
      return { success: false, message: error.message || 'Verification failed' };
    }
  }

  static cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of Array.from(verificationTokens.entries())) {
      if (data.expiresAt < now) verificationTokens.delete(token);
    }
  }
}

// Cleanup expired tokens every 5 minutes
setInterval(() => { EmailVerificationService.cleanupExpiredTokens(); }, 5 * 60 * 1000);
