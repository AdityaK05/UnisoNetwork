/**
 * Clear All Database Data Script
 * Deletes all records from all tables while preserving table structure
 * Run with: npx tsx server/db/clear-data.ts
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting database cleanup...\n');

    await client.query('BEGIN');

    // Disable triggers temporarily for faster deletion
    await client.query('SET session_replication_role = replica');

    // Delete from child tables first (tables with foreign keys)
    console.log('Deleting forum_replies...');
    const replies = await client.query('DELETE FROM forum_replies RETURNING id');
    console.log(`✅ Deleted ${replies.rowCount} forum replies`);

    console.log('Deleting forum_threads...');
    const threads = await client.query('DELETE FROM forum_threads RETURNING id');
    console.log(`✅ Deleted ${threads.rowCount} forum threads`);

    console.log('Deleting group_members...');
    const members = await client.query('DELETE FROM group_members RETURNING id');
    console.log(`✅ Deleted ${members.rowCount} group members`);

    console.log('Deleting groups...');
    const groups = await client.query('DELETE FROM groups RETURNING id');
    console.log(`✅ Deleted ${groups.rowCount} groups`);

    console.log('Deleting events...');
    const events = await client.query('DELETE FROM events RETURNING id');
    console.log(`✅ Deleted ${events.rowCount} events`);

    console.log('Deleting resources...');
    const resources = await client.query('DELETE FROM resources RETURNING id');
    console.log(`✅ Deleted ${resources.rowCount} resources`);

    console.log('Deleting internships...');
    const internships = await client.query('DELETE FROM internships RETURNING id');
    console.log(`✅ Deleted ${internships.rowCount} internships`);

    // Delete from parent tables
    console.log('Deleting companies...');
    const companies = await client.query('DELETE FROM companies RETURNING id');
    console.log(`✅ Deleted ${companies.rowCount} companies`);

    console.log('Deleting users...');
    const users = await client.query('DELETE FROM users RETURNING id');
    console.log(`✅ Deleted ${users.rowCount} users`);

    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');

    // Reset auto-increment sequences to start from 1
    console.log('\n🔄 Resetting ID sequences...');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE companies_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE internships_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE forum_threads_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE forum_replies_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE groups_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE group_members_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE events_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE resources_id_seq RESTART WITH 1');
    console.log('✅ All sequences reset to 1');

    await client.query('COMMIT');

    // Verify deletion
    console.log('\n📊 Verification - Remaining records:');
    const verification = await client.query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL SELECT 'companies', COUNT(*) FROM companies
      UNION ALL SELECT 'internships', COUNT(*) FROM internships
      UNION ALL SELECT 'forum_threads', COUNT(*) FROM forum_threads
      UNION ALL SELECT 'forum_replies', COUNT(*) FROM forum_replies
      UNION ALL SELECT 'groups', COUNT(*) FROM groups
      UNION ALL SELECT 'group_members', COUNT(*) FROM group_members
      UNION ALL SELECT 'events', COUNT(*) FROM events
      UNION ALL SELECT 'resources', COUNT(*) FROM resources
    `);

    console.table(verification.rows);

    const totalRecords = verification.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    if (totalRecords === 0) {
      console.log('\n✅ SUCCESS: All data has been cleared from the database!');
    } else {
      console.log(`\n⚠️  WARNING: ${totalRecords} records still remain in the database`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR: Failed to clear database data');
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
clearAllData()
  .then(() => {
    console.log('\n✨ Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database cleanup failed:', error);
    process.exit(1);
  });
