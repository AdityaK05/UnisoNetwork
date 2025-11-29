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

console.log(`📦 DATABASE_URL exists: YES`);
console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);

// Parse URL and ensure SSL is configured
const url = new URL(dbUrl);
url.searchParams.set('sslmode', 'require');
const connectionString = url.toString();

console.log(`📦 Connecting to database with SSL enabled`);
console.log(`📦 Host: ${url.hostname}, Database: ${url.pathname}`);

export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err: any) => {
  console.error('❌ Pool error:', err.message, err.code);
});

pool.on('connect', () => {
  console.log('✅ New client connected to database pool');
});

// Test connection immediately with retry logic
(async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful! Server time:', result.rows[0].now);
      break;
    } catch (err: any) {
      retries--;
      console.error(`❌ Database connection attempt failed (${retries} retries left):`, err.message);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      } else {
        console.error('❌ All database connection attempts failed');
      }
    }
  }
})();

export default pool;
