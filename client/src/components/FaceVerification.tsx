import { useState, useRef, useEffect } from 'react';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as faceapi from '@vladmandic/face-api';

interface FaceVerificationResult {
  success: boolean;
  matchScore: number;
  verificationStatus: string;
  message?: string;
}

export default function FaceVerification() {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResult | null>(null);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [idCardImageUrl, setIdCardImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load face-api models on mount
  useEffect(() => {
    loadModels();
    checkVerificationStatus();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      console.log('✅ Face-api models loaded successfully');
    } catch (error) {
      console.error('Error loading face-api models:', error);
      toast.error('Failed to load face recognition models');
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

  const response = await fetch(apiUrl('/api/face-verification/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFaceVerified(data.isFaceVerified);
        setIdCardImageUrl(data.idCardImageUrl);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelfieFile(file);
    setVerificationResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!selfieFile) {
      toast.error('Please select a selfie image first');
      return;
    }

    if (!modelsLoaded) {
      toast.error('Face recognition models are still loading. Please wait...');
      return;
    }

    if (!idCardImageUrl) {
      toast.error('No ID card found. Please upload your ID card first.');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to verify your face');
        return;
      }

      // Load images
      const selfieImg = await faceapi.bufferToImage(selfieFile);
      const idCardImg = await faceapi.fetchImage(idCardImageUrl);

      // Detect faces
      const selfieDetection = await faceapi
        .detectSingleFace(selfieImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const idCardDetection = await faceapi
        .detectSingleFace(idCardImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!selfieDetection) {
        toast.error('No face detected in selfie. Please try again with a clearer photo.');
        setVerificationResult({
          success: false,
          matchScore: 0,
          verificationStatus: 'No Face Detected',
          message: 'No face was detected in your selfie. Please ensure your face is clearly visible.',
        });
        setVerifying(false);
        return;
      }

      if (!idCardDetection) {
        toast.error('Could not detect face in ID card image. Please re-upload your ID card.');
        setVerificationResult({
          success: false,
          matchScore: 0,
          verificationStatus: 'ID Card Error',
          message: 'Face detection failed on ID card. Please re-upload a clear ID card photo.',
        });
        setVerifying(false);
        return;
      }

      // Calculate distance between faces (lower = more similar)
      const distance = faceapi.euclideanDistance(
        selfieDetection.descriptor,
        idCardDetection.descriptor
      );

      // Convert distance to similarity score (0-1, higher = more similar)
      const matchScore = Math.max(0, 1 - distance);

      // Send result to server
      const formData = new FormData();
      formData.append('selfieImage', selfieFile);
      formData.append('matchScore', matchScore.toString());

  const response = await fetch(apiUrl('/api/face-verification'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.success) {
        toast.success('Face verification successful! ✅');
        setIsFaceVerified(true);
      } else {
        toast.error(result.message || 'Face verification failed');
      }
    } catch (error: any) {
      console.error('Face verification error:', error);
      toast.error('Failed to verify face. Please try again.');
      setVerificationResult({
        success: false,
        matchScore: 0,
        verificationStatus: 'Error',
        message: 'An error occurred during verification. Please try again.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isFaceVerified) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Face Verified
          </CardTitle>
          <CardDescription>
            Your face has been successfully verified and matches your ID card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your identity has been confirmed. You're all set!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          Face Verification
        </CardTitle>
        <CardDescription>
          Upload a clear selfie to verify your identity matches your ID card
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Tips for best results:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Ensure good lighting on your face</li>
              <li>Look directly at the camera</li>
              <li>Remove glasses, hats, or face coverings</li>
              <li>Use a neutral expression similar to your ID photo</li>
              <li>Make sure your entire face is visible and in focus</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="selfie-upload"
            />
            <label
              htmlFor="selfie-upload"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {selfieFile ? selfieFile.name : 'Click to upload selfie'}
              </span>
            </label>
          </div>

          {/* Preview */}
          {selfiePreview && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Selfie Preview:</p>
              <div className="relative w-full max-w-md mx-auto">
                <img
                  src={selfiePreview}
                  alt="Selfie preview"
                  className="w-full rounded-lg border-2 border-gray-200 object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <Alert
            className={
              verificationResult.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            {verificationResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={verificationResult.success ? 'text-green-800' : 'text-red-800'}
            >
              <strong className="block mb-1">{verificationResult.verificationStatus}</strong>
              <p className="text-sm">{verificationResult.message}</p>
              <p className="text-sm mt-2">
                Match Score: <strong>{(verificationResult.matchScore * 100).toFixed(1)}%</strong>
                {!verificationResult.success && ' (Required: 75%)'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleVerify}
            disabled={!selfieFile || verifying}
            className="flex-1"
            size="lg"
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Face
              </>
            )}
          </Button>

          {selfieFile && !verifying && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Rate Limit Warning */}
        <p className="text-xs text-gray-500 text-center">
          ⚠️ You have 3 verification attempts per 24 hours
        </p>
      </CardContent>
    </Card>
  );
}
