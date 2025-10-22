import Tesseract from 'tesseract.js';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Simple string similarity function (Levenshtein distance based)
function compareTwoStrings(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length < 2 || str2.length < 2) return 0;

  const firstBigrams = new Map();
  for (let i = 0; i < str1.length - 1; i++) {
    const bigram = str1.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < str2.length - 1; i++) {
    const bigram = str2.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (str1.length + str2.length - 2);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

interface UserData {
  name: string;
  email: string;
  student_name?: string;
  roll_number?: string;
  college_name?: string;
  id_number?: string;
}

export class IdVerificationService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student-id-cards',
          public_id: `id_${Date.now()}_${filename}`,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Preprocess image for better OCR results
   */
  static async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: false,
        })
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch (error) {
      console.error('Error preprocessing image:', error);
      return buffer; // Return original if preprocessing fails
    }
  }

  /**
   * Extract text from image using Tesseract.js
   */
  static async extractText(buffer: Buffer): Promise<string> {
    try {
      // Preprocess image for better OCR
      const processedBuffer = await this.preprocessImage(buffer);

      const { data } = await Tesseract.recognize(processedBuffer, 'eng', {
        logger: (info: any) => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        },
      });

      return data.text;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse extracted text to identify key fields
   */
  static parseExtractedText(text: string): ExtractedData {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    const extractedData: ExtractedData = {
      rawText: text,
    };

    // Common patterns for Indian college ID cards
    const patterns = {
      name: /(?:name|student\s*name|नाम)[:\s-]*([a-z\s.]+)/i,
      rollNumber: /(?:roll\s*no|roll\s*number|enrollment\s*no|enroll\s*no|admission\s*no)[:\s-]*([a-z0-9-]+)/i,
      collegeName: /(?:college|university|institute|विश्वविद्यालय)[:\s-]*([a-z\s&,.-]+)/i,
      idNumber: /(?:id\s*no|id\s*number|card\s*no)[:\s-]*([a-z0-9-]+)/i,
    };

    // Try to extract from full text first
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        switch (key) {
          case 'name':
            extractedData.name = this.cleanName(value);
            break;
          case 'rollNumber':
            extractedData.rollNumber = value.toUpperCase();
            break;
          case 'collegeName':
            extractedData.collegeName = this.cleanCollegeName(value);
            break;
          case 'idNumber':
            extractedData.idNumber = value.toUpperCase();
            break;
        }
      }
    }

    // Try line-by-line extraction if patterns didn't work
    if (!extractedData.name || !extractedData.rollNumber) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Name usually comes after "Name:" or is the first capitalized line
        if (!extractedData.name && line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
          extractedData.name = this.cleanName(line);
        }

        // Roll number pattern
        if (!extractedData.rollNumber && line.match(/\b[A-Z0-9]{6,15}\b/)) {
          extractedData.rollNumber = line.match(/\b[A-Z0-9]{6,15}\b/)![0];
        }

        // College name (usually longer text with university/college)
        if (!extractedData.collegeName && line.length > 15 && 
            (line.toLowerCase().includes('college') || 
             line.toLowerCase().includes('university') ||
             line.toLowerCase().includes('institute'))) {
          extractedData.collegeName = this.cleanCollegeName(line);
        }
      }
    }

    return extractedData;
  }

  /**
   * Clean and normalize name
   */
  static cleanName(name: string): string {
    return name
      .replace(/[^a-zA-Z\s.]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Clean and normalize college name
   */
  static cleanCollegeName(name: string): string {
    return name
      .replace(/[^a-zA-Z\s&,.-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity score between two strings
   */
  static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return 1;
    
    // Use custom similarity function
    return compareTwoStrings(s1, s2);
  }

  /**
   * Verify extracted data against user data
   */
  static verifyData(extractedData: ExtractedData, userData: UserData): {
    verified: boolean;
    matchScore: number;
    details: any;
  } {
    const scores: { [key: string]: number } = {};
    let totalWeight = 0;
    let weightedScore = 0;

    // Name matching (weight: 40%)
    if (extractedData.name && userData.name) {
      scores.name = this.calculateSimilarity(extractedData.name, userData.name);
      weightedScore += scores.name * 0.4;
      totalWeight += 0.4;
    } else if (extractedData.name && userData.student_name) {
      scores.name = this.calculateSimilarity(extractedData.name, userData.student_name);
      weightedScore += scores.name * 0.4;
      totalWeight += 0.4;
    }

    // Roll number matching (weight: 30%)
    if (extractedData.rollNumber && userData.roll_number) {
      scores.rollNumber = this.calculateSimilarity(extractedData.rollNumber, userData.roll_number);
      weightedScore += scores.rollNumber * 0.3;
      totalWeight += 0.3;
    }

    // College name matching (weight: 20%)
    if (extractedData.collegeName && userData.college_name) {
      scores.collegeName = this.calculateSimilarity(extractedData.collegeName, userData.college_name);
      weightedScore += scores.collegeName * 0.2;
      totalWeight += 0.2;
    }

    // ID number matching (weight: 10%)
    if (extractedData.idNumber && userData.id_number) {
      scores.idNumber = this.calculateSimilarity(extractedData.idNumber, userData.id_number);
      weightedScore += scores.idNumber * 0.1;
      totalWeight += 0.1;
    }

    // Calculate final match score
    const matchScore = totalWeight > 0 ? (weightedScore / totalWeight) : 0;

    // Verification threshold: 80%
    const VERIFICATION_THRESHOLD = 0.80;
    const verified = matchScore >= VERIFICATION_THRESHOLD;

    return {
      verified,
      matchScore,
      details: {
        scores,
        threshold: VERIFICATION_THRESHOLD,
        extractedFields: Object.keys(scores).length,
      },
    };
  }

  /**
   * Main verification function
   */
  static async verifyStudentId(
    imageBuffer: Buffer,
    filename: string,
    userData: UserData
  ): Promise<VerificationResult> {
    const errors: string[] = [];

    try {
      // Step 1: Upload to Cloudinary
      console.log('Uploading image to Cloudinary...');
      const imageUrl = await this.uploadToCloudinary(imageBuffer, filename);
      console.log('Image uploaded:', imageUrl);

      // Step 2: Extract text using OCR
      console.log('Extracting text from image...');
      const rawText = await this.extractText(imageBuffer);
      console.log('Raw extracted text:', rawText.substring(0, 200));

      if (!rawText || rawText.trim().length < 10) {
        return {
          success: false,
          verified: false,
          message: 'Could not extract text from image. Please ensure the ID card is clear and readable.',
          imageUrl,
          errors: ['Insufficient text extracted from image'],
        };
      }

      // Step 3: Parse extracted text
      console.log('Parsing extracted data...');
      const extractedData = this.parseExtractedText(rawText);
      console.log('Extracted data:', extractedData);

      // Check if we extracted at least some key fields
      if (!extractedData.name && !extractedData.rollNumber && !extractedData.collegeName) {
        return {
          success: true,
          verified: false,
          message: 'Could not identify key fields from ID card. Please upload a clearer image.',
          imageUrl,
          extractedData,
          errors: ['No key fields (name, roll number, or college) could be identified'],
        };
      }

      // Step 4: Verify against user data
      console.log('Verifying extracted data...');
      const verificationResult = this.verifyData(extractedData, userData);
      console.log('Verification result:', verificationResult);

      if (verificationResult.verified) {
        return {
          success: true,
          verified: true,
          message: 'ID card verified successfully! ✅',
          extractedData,
          imageUrl,
          matchScore: Math.round(verificationResult.matchScore * 100),
        };
      } else {
        return {
          success: true,
          verified: false,
          message: `Verification failed. Match score: ${Math.round(verificationResult.matchScore * 100)}%. Please ensure your profile information matches your ID card.`,
          extractedData,
          imageUrl,
          matchScore: Math.round(verificationResult.matchScore * 100),
          errors: [
            `Match score (${Math.round(verificationResult.matchScore * 100)}%) below threshold (80%)`,
            'Please update your profile with correct details matching your ID card',
          ],
        };
      }
    } catch (error: any) {
      console.error('Error in ID verification:', error);
      return {
        success: false,
        verified: false,
        message: 'An error occurred during verification',
        errors: [error.message || 'Unknown error'],
      };
    }
  }
}
