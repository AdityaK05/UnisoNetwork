import { pgTable, serial, varchar, text, boolean, timestamp, integer, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  avatar_url: text('avatar_url'),
  phone_number: varchar('phone_number', { length: 20 }).unique(),
  phone_verified: boolean('phone_verified').default(false),
  otp_cooldown: timestamp('otp_cooldown'),
  verification_sid: text('verification_sid'),
  two_factor_secret: text('two_factor_secret'),
  two_factor_enabled: boolean('two_factor_enabled').default(false),
  two_factor_backup_codes: text('two_factor_backup_codes').array(),
  is_face_verified: boolean('is_face_verified').default(false),
  face_verified_at: timestamp('face_verified_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  logo_url: text('logo_url'),
  website: text('website'),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
});

export const internships = pgTable('internships', {
  id: serial('id').primaryKey(),
  role: varchar('role', { length: 100 }).notNull(),
  company_id: integer('company_id').references(() => companies.id, { onDelete: 'set null' }),
  location: varchar('location', { length: 100 }),
  type: varchar('type', { length: 50 }),
  domain: varchar('domain', { length: 50 }),
  description: text('description'),
  requirements: text('requirements'),
  salary_range: varchar('salary_range', { length: 100 }),
  apply_link: text('apply_link'),
  posted_date: date('posted_date'),
  deadline: date('deadline'),
  logo: text('logo'),
  company_color: varchar('company_color', { length: 50 }),
  is_active: boolean('is_active').default(true),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
});

export const forumThreads = pgTable('forum_threads', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }),
  tags: text('tags').array(),
  images: text('images'),
  upvotes: integer('upvotes').default(0),
  reply_count: integer('reply_count').default(0),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const forumReplies = pgTable('forum_replies', {
  id: serial('id').primaryKey(),
  thread_id: integer('thread_id').references(() => forumThreads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  upvotes: integer('upvotes').default(0),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
  privacy: varchar('privacy', { length: 20 }).default('public'),
  max_members: integer('max_members'),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).default('member'),
  joined_at: timestamp('joined_at').defaultNow(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 100 }),
  event_date: timestamp('event_date'),
  event_type: varchar('event_type', { length: 50 }),
  organizer: varchar('organizer', { length: 100 }),
  registration_link: text('registration_link'),
  max_participants: integer('max_participants'),
  is_active: boolean('is_active').default(true),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  resource_url: text('resource_url').notNull(),
  description: text('description'),
  resource_type: varchar('resource_type', { length: 50 }),
  category: varchar('category', { length: 50 }),
  tags: text('tags'),
  upvotes: integer('upvotes').default(0),
  posted_by: integer('posted_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow(),
});
