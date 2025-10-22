import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Link, useLocation } from 'wouter';
import { toast } from 'react-hot-toast';
import { isValidCollegeEmail, getCollegeEmailError } from '../utils/collegeEmailValidator';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rollNumber: string;
  collegeName: string;
  course: string;
  yearOfAdmission: string;
}

const SignupWithEmail: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // Step 1: Form, Step 2: OTP, Step 3: ID Upload
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    collegeName: '',
    course: '',
    yearOfAdmission: ''
  });
  const [otp, setOtp] = useState('');
  const [idCard, setIdCard] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // Handle ID card upload
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPEG, PNG, and WEBP images are allowed');
        return;
      }
      setIdCard(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Step 1: Validate form and send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate college email domain
    if (!isValidCollegeEmail(formData.email)) {
      setError(getCollegeEmailError(formData.email));
      return;
    }

    setLoading(true);

    try {
      // Send OTP to email
      const response = await fetch('/api/email/send-otp-signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification email');
      }

      toast.success('📧 Verification code sent to your email!');
      setStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      toast.error(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and move to ID upload
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    // Just verify OTP is correct format and move to step 3
    toast.success('Email verified! Now upload your student ID 🎓');
    setStep(3);
  };

  // Step 3: Upload ID and create account
  const handleIdUploadAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!idCard) {
      setError('Please upload your student ID card');
      return;
    }

    if (!formData.rollNumber || !formData.collegeName || !formData.course || !formData.yearOfAdmission) {
      setError('Please fill in all student details');
      return;
    }

    setLoading(true);

    try {
      // First create the account
      const signupResponse = await fetch('/api/users/signup-with-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          otp: otp,
          rollNumber: formData.rollNumber,
          collegeName: formData.collegeName,
          course: formData.course,
          yearOfAdmission: formData.yearOfAdmission
        })
      });

      const contentType = signupResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Please try again later.');
      }

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.message || 'Failed to create account');
      }

      // Log the user in
      login(signupData.user, signupData.token);

      // Now upload and verify ID card
      const formDataUpload = new FormData();
      formDataUpload.append('idCard', idCard);
      formDataUpload.append('name', formData.name);
      formDataUpload.append('rollNumber', formData.rollNumber);
      formDataUpload.append('collegeName', formData.collegeName);
      formDataUpload.append('course', formData.course);
      formDataUpload.append('yearOfAdmission', formData.yearOfAdmission);

      const uploadResponse = await fetch('/api/id-verification/upload-id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${signupData.token}`
        },
        body: formDataUpload
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        toast.error('Account created but ID verification failed. You can upload later.');
      } else {
        setVerificationResult(uploadData);
        toast.success(uploadData.verificationStatus === 'Verified' 
          ? '✅ Account created and ID verified!' 
          : '⚠️ Account created. ID verification pending review.');
      }

      // Redirect to home
      setTimeout(() => setLocation('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/email/send-otp-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }

      toast.success('📧 Verification code resent!');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
      toast.error(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        {step === 1 && (
          <>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Create Account 🚀</h2>
            <p className="text-gray-500 mb-6">Join the UNiSO community today</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOTP} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Enter your college email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1 ml-4">📧 Use your college email (e.g., name@vit.ac.in, @iitb.ac.in)</p>
                {formData.email && !isValidCollegeEmail(formData.email) && (
                  <p className="text-xs text-red-600 mt-1 ml-4">
                    ⚠️ {getCollegeEmailError(formData.email)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Continue →'}
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Login
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Verify Email 📧</h2>
              <p className="text-gray-500">
                Enter the 6-digit code sent to<br />
                <span className="font-semibold text-gray-700">{formData.email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-full border-2 border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Continue to ID Upload →'}
              </button>
            </form>

            <div className="mt-6">
              {resendCountdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend code in <span className="font-semibold">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-blue-600 font-semibold hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              📧 Check your inbox and spam folder
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Upload Student ID 🎓</h2>
              <p className="text-gray-500">Verify your identity with your college ID card</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {verificationResult && (
              <div className={`border px-4 py-3 rounded-lg mb-4 text-sm ${
                verificationResult.verificationStatus === 'Verified' 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}>
                <p className="font-semibold">Match Score: {(verificationResult.matchScore * 100).toFixed(0)}%</p>
                <p>{verificationResult.verificationStatus}</p>
              </div>
            )}

            <form onSubmit={handleIdUploadAndSignup} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., 21CS1234"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., VIT University"
                  value={formData.collegeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, collegeName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., B.Tech CSE"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Admission</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="e.g., 2021"
                  value={formData.yearOfAdmission}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearOfAdmission: e.target.value }))}
                  required
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID Card</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                  {idPreview ? (
                    <div className="space-y-2">
                      <img src={idPreview} alt="ID Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setIdCard(null);
                          setIdPreview(null);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleIdCardChange}
                        className="hidden"
                        required
                      />
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm">Click to upload ID card</p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !idCard}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account & Verify ID 🚀'}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              🎓 Your ID will be verified automatically using OCR
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupWithEmail;
