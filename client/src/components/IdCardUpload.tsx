import React, { useState, useRef } from 'react';
import axios from 'axios';
import api from '@/services/api';
import { toast } from 'react-toastify';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Info,
  FileText,
  User,
  Hash,
  Building,
  CreditCard,
} from 'lucide-react';

interface ExtractedData {
  name?: string;
  rollNumber?: string;
  collegeName?: string;
  idNumber?: string;
  rawText: string;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  extractedData?: ExtractedData;
  imageUrl?: string;
  matchScore?: number;
  errors?: string[];
}

export function IdCardUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    attempts: number;
    imageUrl: string | null;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch verification status on mount
  React.useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      // Use central api instance which attaches Authorization token
      const response = await api.get('/api/id-verification/status');

      setVerificationStatus({
        isVerified: response.data.isVerified,
        attempts: response.data.attempts,
        imageUrl: response.data.imageUrl,
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    setSelectedFile(file);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('idCard', selectedFile);

      // Use api instance which will send Authorization header from localStorage
      const response = await api.post<VerificationResult>('/api/id-verification/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);

      if (response.data.verified) {
        toast.success('✅ ID Card Verified Successfully!');
        setTimeout(() => {
          fetchVerificationStatus();
        }, 1000);
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Failed to upload ID card';
      
      toast.error(errorMessage);
      
      // Handle rate limit error
      if (error.response?.status === 429) {
        const remainingHours = error.response?.data?.remainingHours || 24;
        toast.warning(`Please try again in ${remainingHours} hours`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (verificationStatus?.isVerified) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            ID Card Already Verified ✅
          </h2>
          <p className="text-green-700 mb-4">
            Your student ID has been successfully verified!
          </p>
          {verificationStatus.imageUrl && (
            <div className="mt-4">
              <img
                src={verificationStatus.imageUrl}
                alt="Verified ID"
                className="max-w-sm mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Student ID Verification</h1>
          <p className="text-blue-100">
            Upload your college ID card for instant verification using AI-powered OCR
          </p>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Clear, well-lit photo of your student ID card</li>
                <li>All text must be readable (name, roll number, college)</li>
                <li>Supported formats: JPEG, PNG, WEBP (max 5MB)</li>
                <li>Maximum 3 attempts per day</li>
              </ul>
              {verificationStatus && (
                <p className="mt-2 font-medium">
                  Attempts used today: {verificationStatus.attempts}/3
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="p-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Upload Your ID Card
              </h3>
              <p className="text-gray-500 mb-4">
                Click to browse or drag and drop your image here
              </p>
              <p className="text-sm text-gray-400">
                JPEG, PNG, or WEBP (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image Preview
                </h3>
                <div className="relative">
                  <img
                    src={preview}
                    alt="ID Card Preview"
                    className="max-w-full rounded-lg shadow-lg mx-auto"
                    style={{ maxHeight: '400px' }}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader className="w-12 h-12 animate-spin mx-auto mb-2" />
                        <p className="font-semibold">Processing...</p>
                        <p className="text-sm">Extracting text from image</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify ID Card
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-semibold transition-colors"
                >
                  Change Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="p-6 border-t border-gray-200">
            <div
              className={`rounded-xl p-6 ${
                result.verified
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-red-50 border-2 border-red-500'
              }`}
            >
              {/* Status Header */}
              <div className="flex items-center gap-3 mb-4">
                {result.verified ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-green-900">
                        Verification Successful ✅
                      </h3>
                      <p className="text-green-700">{result.message}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-xl font-bold text-red-900">
                        Verification Failed ❌
                      </h3>
                      <p className="text-red-700">{result.message}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Match Score */}
              {result.matchScore !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Match Score:</span>
                    <span className={`text-lg font-bold ${
                      result.matchScore >= 80 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.matchScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        result.matchScore >= 80 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.matchScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Minimum required: 80%
                  </p>
                </div>
              )}

              {/* Extracted Data */}
              {result.extractedData && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5" />
                    Extracted Information
                  </h4>

                  {result.extractedData.name && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Name</p>
                        <p className="text-gray-900 font-semibold">
                          {result.extractedData.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.extractedData.rollNumber && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Roll Number</p>
                        <p className="text-gray-900 font-semibold">
                          {result.extractedData.rollNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.extractedData.collegeName && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">College</p>
                        <p className="text-gray-900 font-semibold">
                          {result.extractedData.collegeName}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.extractedData.idNumber && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">ID Number</p>
                        <p className="text-gray-900 font-semibold">
                          {result.extractedData.idNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-2">Issues Found:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Retry Button */}
              {!result.verified && (
                <button
                  onClick={handleReset}
                  className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Try Again with Different Image
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
