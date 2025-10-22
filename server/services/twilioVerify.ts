import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

if (!accountSid || !authToken || !verifySid) {
  console.warn('⚠️  Twilio credentials not configured. Phone verification will use development mode.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface VerificationResult {
  success: boolean;
  status?: string;
  message?: string;
  sid?: string;
  channel?: string;
}

export type VerificationChannel = 'whatsapp' | 'sms' | 'email';

export class TwilioVerifyService {
  /**
   * Send OTP to phone number using Twilio Verify API
   * @param phoneNumber - E.164 formatted phone number
   * @param channel - Preferred channel: 'whatsapp' (cheapest), 'sms', or 'email'
   * @param codeLength - OTP length (4-10 digits, default 6)
   * @param validityPeriod - How long OTP is valid in seconds (60-600, default 180 = 3 minutes)
   */
  static async sendOTP(
    phoneNumber: string, 
    channel: VerificationChannel = 'whatsapp',
    codeLength: number = 6,
    validityPeriod: number = 180 // 3 minutes instead of default 10
  ): Promise<VerificationResult> {
    try {
      // Development mode - log OTP to console
      if (!client || !verifySid) {
        console.log(`📱 DEV MODE - Would send OTP to: ${phoneNumber} via ${channel}`);
        console.log(`⏱️  OTP would expire in ${validityPeriod} seconds (${validityPeriod / 60} minutes)`);
        console.log('⚠️  Configure Twilio credentials to send real messages');
        
        // In dev mode, return success with mock SID
        return {
          success: true,
          status: 'pending',
          message: `OTP sent via ${channel} (development mode)`,
          sid: 'dev_' + Date.now(),
          channel,
        };
      }

      // Production mode - use Twilio Verify API with WhatsApp first (10x cheaper)
      let verification;
      let usedChannel = channel;
      
      try {
        // Try preferred channel first
        verification = await client.verify.v2
          .services(verifySid)
          .verifications.create({
            to: phoneNumber,
            channel: channel,
            // @ts-ignore - validityPeriod might not be in types but is supported
            validityPeriod: validityPeriod,
          });
        
        console.log(`✅ OTP sent to ${phoneNumber} via ${channel.toUpperCase()}, Status: ${verification.status}, Expires in: ${validityPeriod}s`);
      } catch (channelError: any) {
        // If WhatsApp fails, fallback to SMS
        if (channel === 'whatsapp') {
          console.warn(`⚠️  WhatsApp failed, falling back to SMS:`, channelError.message);
          
          verification = await client.verify.v2
            .services(verifySid)
            .verifications.create({
              to: phoneNumber,
              channel: 'sms',
              // @ts-ignore
              validityPeriod: validityPeriod,
            });
          
          usedChannel = 'sms';
          console.log(`✅ OTP sent to ${phoneNumber} via SMS (fallback), Status: ${verification.status}`);
        } else {
          throw channelError;
        }
      }

      return {
        success: true,
        status: verification.status,
        message: `OTP sent successfully via ${usedChannel.toUpperCase()}`,
        sid: verification.sid,
        channel: usedChannel,
      };
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP code using Twilio Verify API
   */
  static async verifyOTP(phoneNumber: string, code: string): Promise<VerificationResult> {
    try {
      // Development mode - accept any 6-digit code
      if (!client || !verifySid) {
        console.log(`📱 DEV MODE - Verifying OTP for: ${phoneNumber}`);
        
        // In dev mode, accept "123456" as valid OTP
        if (code === '123456' || code.length === 6) {
          console.log('✅ DEV MODE - OTP accepted');
          return {
            success: true,
            status: 'approved',
            message: 'OTP verified (development mode)',
          };
        } else {
          return {
            success: false,
            status: 'rejected',
            message: 'Invalid OTP (use 123456 in dev mode)',
          };
        }
      }

      // Production mode - use Twilio Verify API
      const verificationCheck = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      console.log(`✅ OTP verification status: ${verificationCheck.status}`);

      if (verificationCheck.status === 'approved') {
        return {
          success: true,
          status: 'approved',
          message: 'Phone number verified successfully',
        };
      } else {
        return {
          success: false,
          status: verificationCheck.status,
          message: 'Invalid or expired OTP',
        };
      }
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Format phone number to E.164 format (required by Twilio)
   * Example: 9876543210 -> +919876543210
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+91'): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If already has country code, return with +
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      return '+' + cleaned;
    }
    
    // If 10 digits, add country code
    if (cleaned.length === 10) {
      return countryCode + cleaned;
    }
    
    // If already formatted, return as-is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default: add country code
    return countryCode + cleaned;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      // Basic validation: should have country code + 10-15 digits
      const cleaned = formatted.replace(/\D/g, '');
      return cleaned.length >= 10 && cleaned.length <= 15;
    } catch {
      return false;
    }
  }

  /**
   * Check if enough time has passed since last OTP (cooldown period)
   */
  static canSendOTP(lastSentAt: Date | null, cooldownMinutes: number = 1): boolean {
    if (!lastSentAt) return true;
    
    const now = new Date();
    const timeDiff = (now.getTime() - lastSentAt.getTime()) / 1000 / 60; // minutes
    
    return timeDiff >= cooldownMinutes;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  static getRemainingCooldown(lastSentAt: Date | null, cooldownMinutes: number = 1): number {
    if (!lastSentAt) return 0;
    
    const now = new Date();
    const timeDiff = (now.getTime() - lastSentAt.getTime()) / 1000; // seconds
    const cooldownSeconds = cooldownMinutes * 60;
    
    const remaining = cooldownSeconds - timeDiff;
    return remaining > 0 ? Math.ceil(remaining) : 0;
  }
}
