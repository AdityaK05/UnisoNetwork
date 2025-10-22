import { downloadFaceApiModels } from './services/faceVerification.js';

console.log('📥 Starting face-api.js model download...');
console.log('This will download models for face detection and recognition.');
console.log('');

downloadFaceApiModels()
  .then(() => {
    console.log('');
    console.log('✅ All models downloaded successfully!');
    console.log('You can now use face verification in your application.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Model download failed:', error);
    console.error('Please check your internet connection and try again.');
    process.exit(1);
  });
