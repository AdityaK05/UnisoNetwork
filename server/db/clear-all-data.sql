-- Clear all data from UnisoNetwork database
-- This script deletes all records while preserving table structure
-- Foreign key constraints are respected by deleting in correct order

BEGIN;

-- Disable triggers temporarily for faster deletion
SET session_replication_role = replica;

-- Delete from child tables first (tables with foreign keys)
DELETE FROM forum_replies;
DELETE FROM forum_threads;
DELETE FROM group_members;
DELETE FROM groups;
DELETE FROM events;
DELETE FROM resources;
DELETE FROM internships;

-- Delete from parent tables
DELETE FROM companies;
DELETE FROM users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset auto-increment sequences to start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE companies_id_seq RESTART WITH 1;
ALTER SEQUENCE internships_id_seq RESTART WITH 1;
ALTER SEQUENCE forum_threads_id_seq RESTART WITH 1;
ALTER SEQUENCE forum_replies_id_seq RESTART WITH 1;
ALTER SEQUENCE groups_id_seq RESTART WITH 1;
ALTER SEQUENCE group_members_id_seq RESTART WITH 1;
ALTER SEQUENCE events_id_seq RESTART WITH 1;
ALTER SEQUENCE resources_id_seq RESTART WITH 1;

COMMIT;

-- Verify deletion
SELECT 'users' as table_name, COUNT(*) as remaining_records FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'internships', COUNT(*) FROM internships
UNION ALL
SELECT 'forum_threads', COUNT(*) FROM forum_threads
UNION ALL
SELECT 'forum_replies', COUNT(*) FROM forum_replies
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM group_members
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'resources', COUNT(*) FROM resources;
