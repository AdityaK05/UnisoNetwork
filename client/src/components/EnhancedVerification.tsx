import React, { useState, useEffect } from 'react';
import { Smartphone, Mail, AlertCircle, Check, RefreshCw, ArrowRight, Shield, DollarSign } from 'lucide-react';
import { phoneAPI } from '../services/api';
import { toast } from 'react-toastify';

interface EnhancedVerificationProps {
  onSuccess: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

type VerificationMethod = 'phone' | 'email';
type VerificationChannel = 'whatsapp' | 'sms';

export function EnhancedVerification({ onSuccess, onSkip, allowSkip = false }: EnhancedVerificationProps) {
  const [method, setMethod] = useState<VerificationMethod>('phone');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channel, setChannel] = useState<VerificationChannel>('whatsapp');
  
  // Email verification state
  const [email, setEmail] = useState('');
  
  // Common verification state
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(0);
  const [error, setError] = useState('');
  const [usedChannel, setUsedChannel] = useState<string>('');

  // Countdown timers
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (expiryTimer > 0) {
      const timer = setTimeout(() => setExpiryTimer(expiryTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryTimer === 0 && step === 'verify') {
      toast.warning('Verification code expired. Please request a new one.');
    }
  }, [expiryTimer, step]);

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendPhoneOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await phoneAPI.sendOTP(phoneNumber, channel);
      
      toast.success(response.data.message || 'OTP sent successfully!');
      setStep('verify');
      setResendTimer(60);
      setExpiryTimer(response.data.expiresIn || 180); // 3 minutes
      setUsedChannel(response.data.channel || channel);

      // Show cost savings
      if (response.data.costSavings) {
        toast.info(response.data.costSavings, { autoClose: 5000 });
      }

      if (response.data.devNote) {
        console.log('🔐 Development Mode:', response.data.devNote);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      setError(message);
      toast.error(message);

      if (err.response?.data?.remainingSeconds) {
        setResendTimer(err.response.data.remainingSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Implement email verification API call
      // const response = await emailAPI.sendVerification(email);
      
      toast.success('Verification email sent! Check your inbox.');
      setStep('verify');
      setResendTimer(60);
      setExpiryTimer(600); // 10 minutes for email

      toast.info('💰 Email verification is 100% FREE!', { autoClose: 5000 });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send verification email';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (method === 'phone') {
        const response = await phoneAPI.verifyOTP(code);
        toast.success(response.data.message || 'Phone verified successfully!');
      } else {
        // TODO: Implement email verification API call
        // const response = await emailAPI.verifyCode(code);
        toast.success('Email verified successfully!');
      }
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (method === 'phone') {
      await sendPhoneOTP();
    } else {
      await sendEmailVerification();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'input') {
      method === 'phone' ? sendPhoneOTP() : sendEmailVerification();
    } else {
      verifyCode();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Method Selection */}
        {step === 'input' && (
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  method === 'phone'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                Phone
              </button>
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  method === 'email'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email (FREE)
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            {method === 'phone' ? (
              <Smartphone className="w-8 h-8 text-blue-600" />
            ) : (
              <Mail className="w-8 h-8 text-blue-600" />
            )}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">
          {step === 'input' 
            ? `Verify Your ${method === 'phone' ? 'Phone' : 'Email'}`
            : 'Enter Verification Code'}
        </h2>
        
        <p className="text-gray-600 text-center mb-8">
          {step === 'input'
            ? method === 'phone'
              ? 'Choose your preferred verification method'
              : 'We\'ll send you a free verification code'
            : `Enter the 6-digit code sent to ${method === 'phone' ? `+91 ${phoneNumber}` : email}`}
        </p>

        {/* Cost Savings Badge */}
        {method === 'phone' && step === 'input' && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              Using WhatsApp saves 90% on verification costs!
            </span>
          </div>
        )}

        {method === 'email' && step === 'input' && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Email verification is 100% FREE! 💰
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'input' ? (
            <>
              {method === 'phone' ? (
                <>
                  {/* Channel Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Method
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setChannel('whatsapp')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          channel === 'whatsapp'
                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        WhatsApp (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannel('sms')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          channel === 'sms'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        SMS
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {channel === 'whatsapp' 
                        ? '✅ 10x cheaper, faster delivery'
                        : '💰 Standard SMS (costs more)'}
                    </p>
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                        placeholder="9876543210"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        maxLength={10}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Enter 10-digit mobile number</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">We'll never share your email</p>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (method === 'phone' ? phoneNumber.length !== 10 : !email)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Verification Code Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  {expiryTimer > 0 && (
                    <span className="text-xs font-medium text-orange-600">
                      Expires in {formatTime(expiryTimer)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-3xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  maxLength={6}
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  6-digit code from {method === 'phone' ? (usedChannel || channel).toUpperCase() : 'email'}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setCode('');
                    setError('');
                    setExpiryTimer(0);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change {method}
                </button>

                {resendTimer > 0 ? (
                  <span className="text-gray-500 font-medium">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend Code
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </button>
            </>
          )}

          {allowSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Skip for now
            </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <p>Your information is secure and never shared</p>
          </div>
        </div>
      </div>
    </div>
  );
}
