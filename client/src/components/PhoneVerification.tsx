import React, { useState, useEffect } from 'react';
import { Smartphone, AlertCircle, Check, RefreshCw, ArrowRight } from 'lucide-react';
import { phoneAPI } from '../services/api';
import { toast } from 'react-toastify';

interface PhoneVerificationProps {
  onSuccess: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}

export function PhoneVerification({ onSuccess, onSkip, allowSkip = false }: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatPhoneInput = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
  };

  const sendOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await phoneAPI.sendOTP(phoneNumber);
      
      toast.success(response.data.message || 'OTP sent successfully!');
      setStep('otp');
      setResendTimer(60); // 60 seconds cooldown

      // Show dev note if in development
      if (response.data.devNote) {
        console.log('🔐 Development Mode:', response.data.devNote);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      setError(message);
      toast.error(message);

      // If there's a cooldown, show remaining time
      if (err.response?.data?.remainingSeconds) {
        setResendTimer(err.response.data.remainingSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await phoneAPI.verifyOTP(otp);
      
      toast.success(response.data.message || 'Phone verified successfully!');
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

  const resendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await phoneAPI.resendOTP();
      
      toast.success(response.data.message || 'OTP resent successfully!');
      setResendTimer(60);

      // Show dev note if in development
      if (response.data.devNote) {
        console.log('🔐 Development Mode:', response.data.devNote);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
      toast.error(message);

      if (err.response?.data?.remainingSeconds) {
        setResendTimer(err.response.data.remainingSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOTP();
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOTP();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">
          {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {step === 'phone'
            ? 'We need to verify your phone number for account security'
            : `Enter the 6-digit code sent to +91 ${phoneNumber}`}
        </p>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phoneNumber.length !== 10}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

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
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-3xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                maxLength={6}
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">6-digit code from SMS</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Change number
              </button>

              {resendTimer > 0 ? (
                <span className="text-gray-500 font-medium">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend OTP
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
              disabled={loading || otp.length !== 6}
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
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your phone number will be kept secure and never shared
          </p>
        </div>
      </div>
    </div>
  );
}
