import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared-schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

// Test connection function
export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Also export a legacy pool for compatibility
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is required');
}

// For Render PostgreSQL with SSL requirement
const isProduction = process.env.NODE_ENV === 'production' || dbUrl.includes('render.com') || dbUrl.includes('neon.tech');

console.log(`📦 Database URL found. Production mode: ${isProduction}`);
console.log(`📦 Attempting connection with SSL: ${isProduction ? 'enabled' : 'disabled'}`);

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: isProduction 
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ Database pool connected');
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Initial database connection test failed:', err.message);
  } else {
    console.log('✅ Database connection test successful');
  }
});

export default pool;
