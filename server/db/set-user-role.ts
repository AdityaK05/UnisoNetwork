/**
 * Set User Role Script
 * Use this to make a user an admin or coordinator
 * Usage: npx tsx server/db/set-user-role.ts <email> <role>
 * Example: npx tsx server/db/set-user-role.ts user@email.com admin
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setUserRole() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.error('❌ Usage: npx tsx server/db/set-user-role.ts <email> <role>');
    console.error('   Roles: student, admin, coordinator');
    process.exit(1);
  }

  if (!['student', 'admin', 'coordinator'].includes(role)) {
    console.error('❌ Invalid role. Must be: student, admin, or coordinator');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, name, email, role',
      [role, email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('\n✅ User role updated successfully!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🎭 Role: ${user.role}`);
    console.log(`🆔 User ID: ${user.id}\n`);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setUserRole();
