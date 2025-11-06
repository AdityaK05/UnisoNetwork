/**
 * Quick Admin Setup Script
 * Sets the first user in the database as admin
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function makeFirstUserAdmin() {
  const client = await pool.connect();
  
  try {
    // Get first user
    const result = await client.query(
      'SELECT id, name, email FROM users ORDER BY id LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.error('❌ No users found in database');
      console.log('💡 Create an account first, then run this script');
      process.exit(1);
    }

    const user = result.rows[0];

    // Set as admin
    await client.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', user.id]
    );

    console.log('\n✅ First user is now an admin!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`🎭 Role: admin\n`);
    console.log('🔐 You can now access the admin portal at: /admin/jobs\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

makeFirstUserAdmin();
