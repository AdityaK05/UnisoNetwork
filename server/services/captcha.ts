/**
 * Google reCAPTCHA v3 Verification Service
 * Helps reduce fraudulent OTP requests
 */

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export class CaptchaService {
  private static readonly SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  private static readonly VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
  private static readonly MIN_SCORE = 0.5; // Scores range from 0.0 (bot) to 1.0 (human)

  /**
   * Verify reCAPTCHA v3 token
   * @param token - Token from client-side reCAPTCHA
   * @param expectedAction - Expected action name (e.g., 'send_otp')
   * @returns true if verification passes, false otherwise
   */
  static async verify(token: string, expectedAction?: string): Promise<{
    success: boolean;
    score?: number;
    message?: string;
  }> {
    // Development mode - skip CAPTCHA verification
    if (!this.SECRET_KEY || process.env.NODE_ENV === 'development') {
      console.log('⚠️  CAPTCHA verification skipped (development mode)');
      return {
        success: true,
        score: 1.0,
        message: 'CAPTCHA skipped in development',
      };
    }

    try {
      // Call Google's verification API
      const response = await fetch(this.VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.SECRET_KEY,
          response: token,
        }),
      });

      const data: RecaptchaResponse = await response.json();

      // Check if verification succeeded
      if (!data.success) {
        console.error('❌ CAPTCHA verification failed:', data['error-codes']);
        return {
          success: false,
          message: 'CAPTCHA verification failed',
        };
      }

      // Check score (higher is better, 0.0 = bot, 1.0 = human)
      if (data.score && data.score < this.MIN_SCORE) {
        console.warn(`⚠️  Low CAPTCHA score: ${data.score} (threshold: ${this.MIN_SCORE})`);
        return {
          success: false,
          score: data.score,
          message: 'CAPTCHA score too low. Please try again.',
        };
      }

      // Optionally verify action matches
      if (expectedAction && data.action !== expectedAction) {
        console.warn(`⚠️  CAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${data.action}`);
        return {
          success: false,
          message: 'Invalid CAPTCHA action',
        };
      }

      console.log(`✅ CAPTCHA verified successfully. Score: ${data.score}`);
      return {
        success: true,
        score: data.score,
        message: 'CAPTCHA verified',
      };
    } catch (error: any) {
      console.error('❌ Error verifying CAPTCHA:', error);
      return {
        success: false,
        message: 'CAPTCHA verification error',
      };
    }
  }

  /**
   * Check if CAPTCHA is configured
   */
  static isConfigured(): boolean {
    return Boolean(this.SECRET_KEY);
  }

  /**
   * Get minimum acceptable score
   */
  static getMinScore(): number {
    return this.MIN_SCORE;
  }
}
