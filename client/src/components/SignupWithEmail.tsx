import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Link, useLocation } from 'wouter';
import { toast } from 'react-hot-toast';
import { isValidCollegeEmail, getCollegeEmailError } from '../utils/collegeEmailValidator';
import * as faceapi from '@vladmandic/face-api';
import api from '../services/api';

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Step 1: Form, Step 2: OTP, Step 3: ID Upload, Step 4: Face Verification
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
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [faceVerificationResult, setFaceVerificationResult] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [idCardImageUrl, setIdCardImageUrl] = useState<string>('');
  const [userToken, setUserToken] = useState<string>('');
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

  // Handle selfie upload
  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('✅ Face detection models loaded');
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        toast.error('Failed to load face detection models');
      }
    };
    loadModels();
  }, []);

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
      // Send OTP to email via central API
      await api.post('/api/email/send-otp-signup', {
        email: formData.email,
        name: formData.name,
      });

      toast.success('📧 Verification code sent to your email!');
      setStep(2);
      setResendCountdown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send verification email';
      setError(msg);
      toast.error(msg);
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
      const signupRes = await api.post('/api/users/signup-with-email', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        otp: otp,
        rollNumber: formData.rollNumber,
        collegeName: formData.collegeName,
        course: formData.course,
        yearOfAdmission: formData.yearOfAdmission,
      });

      const signupData = signupRes.data;
      if (!signupData || !signupData.token) {
        throw new Error('Failed to create account');
      }

      // Store token for later use (used only for subsequent requests in this flow)
      setUserToken(signupData.token);

      // Now upload and verify ID card
      const uploadForm = new FormData();
      uploadForm.append('idCard', idCard as File);
      uploadForm.append('name', formData.name);
      uploadForm.append('rollNumber', formData.rollNumber);
      uploadForm.append('collegeName', formData.collegeName);
      uploadForm.append('course', formData.course);
      uploadForm.append('yearOfAdmission', formData.yearOfAdmission);

      // Use axios directly via api instance but attach Authorization header with the token
      const uploadRes = await api.post('/api/id-verification/upload-id', uploadForm, {
        headers: {
          Authorization: `Bearer ${signupData.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadData = uploadRes.data;

      if (!uploadRes || (uploadRes.status && uploadRes.status >= 400)) {
        toast.error('Account created but ID verification failed.');
      } else {
        setVerificationResult(uploadData);
        setIdCardImageUrl(uploadData.imageUrl); // Store ID card URL for face verification
        toast.success(
          uploadData.verificationStatus === 'Verified'
            ? '✅ ID verified! Now verify your face'
            : '⚠️ ID uploaded. Now verify your face'
        );
      }

      // Move to face verification step
      setStep(4);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to create account';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Face verification
  const handleFaceVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selfieFile) {
      setError('Please upload a selfie');
      return;
    }

    if (!modelsLoaded) {
      setError('Face detection models are still loading. Please wait...');
      return;
    }

    if (!idCardImageUrl) {
      setError('ID card image not found. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Load and detect face in selfie
      const selfieImg = await faceapi.bufferToImage(selfieFile);
      const selfieDetection = await faceapi
        .detectSingleFace(selfieImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!selfieDetection) {
        throw new Error('No face detected in selfie. Please upload a clear photo of your face.');
      }

      // Load and detect face in ID card
      const idCardImg = await faceapi.fetchImage(idCardImageUrl);
      const idCardDetection = await faceapi
        .detectSingleFace(idCardImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idCardDetection) {
        throw new Error('No face detected in ID card. Please ensure your ID card photo is clear.');
      }

      // Calculate face match score
      const distance = faceapi.euclideanDistance(
        selfieDetection.descriptor,
        idCardDetection.descriptor
      );
      const matchScore = Math.max(0, 1 - distance);

      // Upload selfie with match score to server
      const faceFormData = new FormData();
      faceFormData.append('selfieImage', selfieFile);
      faceFormData.append('matchScore', matchScore.toString());

      // Send to server with token
      const res = await api.post('/api/face-verification', faceFormData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = res.data;

      if (res.status >= 200 && res.status < 300 && result.success) {
        setFaceVerificationResult(result);
        toast.success('✅ Face verified successfully!');

        // Log the user in now
        login({
          name: formData.name,
          email: formData.email,
        } as any, userToken);

        // Redirect to home
        setTimeout(() => setLocation('/'), 2000);
      } else {
        throw new Error(result.message || 'Face verification failed. Match score too low.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Face verification failed';
      setError(msg);
      toast.error(msg);
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
      await api.post('/api/email/send-otp-signup', {
        email: formData.email,
        name: formData.name,
      });
      toast.success('📧 Verification code resent!');
      setResendCountdown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to resend verification code';
      setError(msg);
      toast.error(msg);
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
                {loading ? 'Creating Account...' : 'Continue to Face Verification →'}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              🎓 Your ID will be verified automatically using OCR
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Verify Your Face 📸</h2>
              <p className="text-gray-500">Upload a selfie to verify your identity</p>
              {!modelsLoaded && (
                <p className="text-xs text-yellow-600 mt-2">Loading face detection models...</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {faceVerificationResult && (
              <div className={`border px-4 py-3 rounded-lg mb-4 text-sm ${
                faceVerificationResult.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="font-semibold">Match Score: {(faceVerificationResult.matchScore * 100).toFixed(0)}%</p>
                <p>{faceVerificationResult.message}</p>
              </div>
            )}

            <form onSubmit={handleFaceVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Selfie</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                  {selfiePreview ? (
                    <div className="space-y-2">
                      <img src={selfiePreview} alt="Selfie Preview" className="max-h-64 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelfieFile(null);
                          setSelfiePreview(null);
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
                        onChange={handleSelfieChange}
                        className="hidden"
                        required
                      />
                      <div className="text-gray-500">
                        <svg className="mx-auto h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm font-semibold">Take a Selfie or Upload Photo</p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
                        <p className="text-xs text-gray-400 mt-1">Make sure your face is clearly visible</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selfieFile || !modelsLoaded}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Verifying Face...' : 'Complete Signup ✅'}
              </button>
            </form>

            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500">
                📸 Your selfie will be compared with your ID card photo
              </p>
              <p className="text-xs text-gray-500">
                🔒 We use AI face recognition for security
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupWithEmail;
