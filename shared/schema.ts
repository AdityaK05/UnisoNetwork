import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for authentication and user management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Companies table - for internships and jobs
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Internships/Jobs table
export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  company_id: integer("company_id").references(() => companies.id),
  location: text("location").notNull(),
  type: text("type").notNull(), // full-time, part-time, internship, contract
  domain: text("domain").notNull(), // tech, design, marketing, etc.
  description: text("description").notNull(),
  requirements: text("requirements"),
  salary_range: text("salary_range"),
  apply_link: text("apply_link").notNull(),
  posted_date: timestamp("posted_date").defaultNow().notNull(),
  deadline: timestamp("deadline"),
  logo: text("logo"),
  company_color: text("company_color"),
  is_active: boolean("is_active").default(true).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  event_date: timestamp("event_date").notNull(),
  location: text("location").notNull(),
  event_type: text("event_type").notNull(), // workshop, seminar, networking, etc.
  organizer: text("organizer").notNull(),
  registration_link: text("registration_link"),
  max_participants: integer("max_participants"),
  is_active: boolean("is_active").default(true).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Forums/Groups table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // study, project, social, etc.
  privacy: text("privacy").notNull(), // public, private
  max_members: integer("max_members"),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Resources table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  resource_type: text("resource_type").notNull(), // pdf, link, video, etc.
  resource_url: text("resource_url").notNull(),
  category: text("category").notNull(), // academic, career, skill-building, etc.
  tags: text("tags"), // JSON array of tags
  upvotes: integer("upvotes").default(0).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Forums/Discussion threads
export const forum_threads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // general, academic, career, tech, etc.
  tags: text("tags"), // JSON array of tags
  upvotes: integer("upvotes").default(0).notNull(),
  reply_count: integer("reply_count").default(0).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Forum replies
export const forum_replies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  thread_id: integer("thread_id").references(() => forum_threads.id),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password_hash: true,
  avatar_url: true,
});

export const insertInternshipSchema = createInsertSchema(internships).pick({
  role: true,
  company_id: true,
  location: true,
  type: true,
  domain: true,
  description: true,
  requirements: true,
  salary_range: true,
  apply_link: true,
  deadline: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  event_date: true,
  location: true,
  event_type: true,
  organizer: true,
  registration_link: true,
  max_participants: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  category: true,
  privacy: true,
  max_members: true,
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  resource_type: true,
  resource_url: true,
  category: true,
  tags: true,
});

export const insertForumThreadSchema = createInsertSchema(forum_threads).pick({
  title: true,
  content: true,
  category: true,
  tags: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Internship = typeof internships.$inferSelect;
export type InsertInternship = z.infer<typeof insertInternshipSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ForumThread = typeof forum_threads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumReply = typeof forum_replies.$inferSelect;
