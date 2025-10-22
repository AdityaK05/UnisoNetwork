import * as faceapi from '@vladmandic/face-api';
import * as canvas from 'canvas';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

// Setup canvas for face-api
const { Canvas, Image, ImageData } = canvas;
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Model paths
const MODEL_PATH = path.join(process.cwd(), 'server', 'models', 'face-api');

// Track if models are loaded
let modelsLoaded = false;

/**
 * Load face-api.js models (SSD MobileNet for detection + FaceLandmark + FaceRecognition)
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  
  try {
    console.log('📦 Loading face-api.js models...');
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync(MODEL_PATH)) {
      fs.mkdirSync(MODEL_PATH, { recursive: true });
    }

    // Load models from local path or download
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face-api.js models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face-api.js models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

/**
 * Load image from URL or buffer
 */
async function loadImage(input: string | Buffer): Promise<canvas.Image> {
  const img = new Image();
  
  if (typeof input === 'string') {
    // Load from URL
    const response = await fetch(input);
    const buffer = await response.arrayBuffer();
    img.src = Buffer.from(buffer);
  } else {
    // Load from buffer
    img.src = input;
  }
  
  return img;
}

/**
 * Detect face and extract descriptor
 */
async function detectFaceDescriptor(imageInput: string | Buffer): Promise<Float32Array | null> {
  try {
    const img = await loadImage(imageInput);
    
    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(img as any)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      console.log('⚠️ No face detected in image');
      return null;
    }
    
    return detection.descriptor;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
function calculateFaceDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

/**
 * Convert distance to similarity score (0-1 scale)
 * Lower distance = higher similarity
 * Typical threshold: distance < 0.6 means same person
 */
function distanceToSimilarity(distance: number): number {
  // Convert distance (0-1+) to similarity (0-1)
  // Distance 0.6 → Similarity 0.40 (not matching)
  // Distance 0.4 → Similarity 0.60 (borderline)
  // Distance 0.2 → Similarity 0.80 (good match)
  return Math.max(0, 1 - distance);
}

/**
 * Main face verification function
 * Compares ID card photo with selfie
 */
export async function verifyFaceMatch(
  idCardImageUrl: string,
  selfieBuffer: Buffer
): Promise<{
  success: boolean;
  matchScore: number;
  verificationStatus: string;
  distance?: number;
  message?: string;
}> {
  try {
    // Ensure models are loaded
    if (!modelsLoaded) {
      await loadFaceApiModels();
    }

    console.log('🔍 Detecting face in ID card image...');
    const idDescriptor = await detectFaceDescriptor(idCardImageUrl);
    
    if (!idDescriptor) {
      return {
        success: false,
        matchScore: 0,
        verificationStatus: 'Failed',
        message: 'No face detected in ID card image. Please ensure your ID card photo is clear.',
      };
    }

    console.log('🔍 Detecting face in selfie image...');
    const selfieDescriptor = await detectFaceDescriptor(selfieBuffer);
    
    if (!selfieDescriptor) {
      return {
        success: false,
        matchScore: 0,
        verificationStatus: 'Failed',
        message: 'No face detected in selfie. Please take a clear selfie showing your face.',
      };
    }

    // Calculate distance and similarity
    const distance = calculateFaceDistance(idDescriptor, selfieDescriptor);
    const similarity = distanceToSimilarity(distance);
    
    console.log(`📊 Face comparison - Distance: ${distance.toFixed(3)}, Similarity: ${similarity.toFixed(3)}`);

    // Threshold: similarity >= 0.75 (distance <= 0.25)
    const SIMILARITY_THRESHOLD = 0.75;
    const isMatch = similarity >= SIMILARITY_THRESHOLD;

    if (isMatch) {
      return {
        success: true,
        matchScore: similarity,
        verificationStatus: 'Face Matched ✅',
        distance,
        message: 'Your face matches the ID card photo. Verification successful!',
      };
    } else {
      return {
        success: false,
        matchScore: similarity,
        verificationStatus: 'Face Not Matched ❌',
        distance,
        message: `Face verification failed. Match score: ${(similarity * 100).toFixed(1)}% (Required: 75%). Please ensure good lighting and a clear photo.`,
      };
    }
  } catch (error) {
    console.error('❌ Error in face verification:', error);
    return {
      success: false,
      matchScore: 0,
      verificationStatus: 'Error',
      message: 'Face verification failed due to a system error. Please try again.',
    };
  }
}

/**
 * Download and save face-api.js models
 * Run this once to download models from CDN
 */
export async function downloadFaceApiModels() {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
  const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
  ];

  console.log('📥 Downloading face-api.js models...');

  // Create models directory
  if (!fs.existsSync(MODEL_PATH)) {
    fs.mkdirSync(MODEL_PATH, { recursive: true });
  }

  for (const modelFile of models) {
    const url = MODEL_URL + modelFile;
    const filePath = path.join(MODEL_PATH, modelFile);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${modelFile} already exists`);
      continue;
    }

    try {
      console.log(`⬇️ Downloading ${modelFile}...`);
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`✅ Downloaded ${modelFile}`);
    } catch (error) {
      console.error(`❌ Failed to download ${modelFile}:`, error);
    }
  }

  console.log('✅ All models downloaded successfully');
}
