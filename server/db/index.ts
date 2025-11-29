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

console.log(`📦 Database URL exists: ${dbUrl ? 'YES' : 'NO'}`);
console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);

// Ensure SSL is enabled in connection URL
let connectionString = dbUrl;
if (!connectionString.includes('sslmode')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
  console.log('📦 Adding sslmode=require to connection string');
}

console.log(`📦 Final connection string (URL only): postgresql://***`);

export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection timeout settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 20,
});

pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

pool.on('connect', () => {
  console.log('✅ New client connected to pool');
});

// Test connection immediately
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database pool test query successful:', result.rows[0]);
  } catch (err: any) {
    console.error('❌ Database pool test query failed:', err.message);
  }
})();

export default pool;
