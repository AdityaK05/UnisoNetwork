import axios from 'axios';
import conf from '../conf/conf';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${conf.apiBaseUrl}/api`, // Uses environment-based API URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Phone verification API endpoints
export const phoneAPI = {
  // Get phone verification status
  getStatus: () => api.get('/phone/status'),
  
  // Send OTP to phone number with channel selection
  sendOTP: (phoneNumber: string, channel: 'whatsapp' | 'sms' = 'whatsapp', captchaToken?: string) => 
    api.post('/phone/send-otp', { phoneNumber, channel, captchaToken }),
  
  // Verify OTP code
  verifyOTP: (otp: string) => api.post('/phone/verify-otp', { otp }),
  
  // Resend OTP with channel selection
  resendOTP: (channel: 'whatsapp' | 'sms' = 'whatsapp') => 
    api.post('/phone/resend-otp', { channel }),
};

// Email verification API endpoints
export const emailAPI = {
  // Send email verification code
  sendVerification: (email: string) => api.post('/email/send-verification', { email }),
  
  // Verify email code
  verifyCode: (code: string) => api.post('/email/verify-code', { code }),
};

export default api;
