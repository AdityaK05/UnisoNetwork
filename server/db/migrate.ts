import pool from './index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const faceVerificationPath = path.join(__dirname, 'add-face-verification.sql');
  const faceVerificationSQL = fs.readFileSync(faceVerificationPath, 'utf-8');
  const profileFieldsPath = path.join(__dirname, 'add-profile-fields.sql');
  const profileFieldsSQL = fs.readFileSync(profileFieldsPath, 'utf-8');
  const studentInfoPath = path.join(__dirname, 'add-student-info.sql');
  const studentInfoSQL = fs.readFileSync(studentInfoPath, 'utf-8');
  
  try {
    console.log('Running main schema migration...');
    await pool.query(schema);
    console.log('✅ Main schema migrated successfully.');
    
    console.log('Running face verification migration...');
    await pool.query(faceVerificationSQL);
    console.log('✅ Face verification columns added successfully.');
    
    console.log('Running profile fields migration...');
    await pool.query(profileFieldsSQL);
    console.log('✅ Profile fields columns added successfully.');
    
    console.log('Running student info migration...');
    await pool.query(studentInfoSQL);
    console.log('✅ Student info columns added successfully.');
    
    console.log('✅ Database migrated successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
