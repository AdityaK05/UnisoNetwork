import axios from 'axios';
import apiUrl from '../lib/api';

// Create axios instance with runtime-resolved base URL so it never points at the
// frontend origin (the runtime guard in `apiUrl` protects against that).
// Use the backend root as base (no `/api` suffix) so callers may use `/api/...`
// paths or absolute URLs. Trim trailing slash for consistency.
const base = apiUrl('').replace(/\/$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: base,
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
  getStatus: () => api.get('/api/phone/status'),
  
  // Send OTP to phone number with channel selection
  sendOTP: (phoneNumber: string, channel: 'whatsapp' | 'sms' = 'whatsapp', captchaToken?: string) => 
    api.post('/api/phone/send-otp', { phoneNumber, channel, captchaToken }),
  
  // Verify OTP code
  verifyOTP: (otp: string) => api.post('/api/phone/verify-otp', { otp }),
  
  // Resend OTP with channel selection
  resendOTP: (channel: 'whatsapp' | 'sms' = 'whatsapp') => 
    api.post('/api/phone/resend-otp', { channel }),
};

// Email verification API endpoints
export const emailAPI = {
  // Send email verification code
  sendVerification: (email: string) => api.post('/api/email/send-verification', { email }),
  
  // Verify email code
  verifyCode: (code: string) => api.post('/api/email/verify-code', { code }),
};

export default api;
