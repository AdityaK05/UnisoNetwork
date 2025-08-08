import { db } from './db/index.js';
import { users, companies, internships, events, groups, resources, forum_posts } from '../shared/schema.js';
import { eq, desc, and, like, or } from 'drizzle-orm';

export class PostgreSQLStorage {
  // User operations
  async getUser(id: number) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: { 
    name: string; 
    email: string; 
    password_hash: string; 
    avatar_url?: string 
  }) {
    try {
      const result = await db.insert(users).values({
        name: userData.name,
        email: userData.email,
        password_hash: userData.password_hash,
        avatar_url: userData.avatar_url || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Company operations
  async getCompanies() {
    try {
      return await db.select().from(companies).orderBy(companies.name);
    } catch (error) {
      console.error('Error getting companies:', error);
      return [];
    }
  }

  async createCompany(companyData: {
    name: string;
    logo_url?: string;
    website?: string;
    description?: string;
  }) {
    try {
      const result = await db.insert(companies).values(companyData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }
  }

  // Internship operations
  async getInternships(filters?: {
    type?: string;
    domain?: string;
    location?: string;
    limit?: number;
  }) {
    try {
      let query = db
        .select({
          id: internships.id,
          role: internships.role,
          company_id: internships.company_id,
          location: internships.location,
          type: internships.type,
          domain: internships.domain,
          description: internships.description,
          requirements: internships.requirements,
          salary_range: internships.salary_range,
          apply_link: internships.apply_link,
          posted_date: internships.posted_date,
          deadline: internships.deadline,
          logo: internships.logo,
          company_color: internships.company_color,
          is_active: internships.is_active,
          company_name: companies.name,
          company_logo: companies.logo_url,
          company_website: companies.website
        })
        .from(internships)
        .leftJoin(companies, eq(internships.company_id, companies.id))
        .where(eq(internships.is_active, true));

      if (filters?.type) {
        query = query.where(and(eq(internships.is_active, true), eq(internships.type, filters.type)));
      }
      if (filters?.domain) {
        query = query.where(and(eq(internships.is_active, true), eq(internships.domain, filters.domain)));
      }
      if (filters?.location) {
        query = query.where(and(eq(internships.is_active, true), like(internships.location, `%${filters.location}%`)));
      }

      query = query.orderBy(desc(internships.posted_date));
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting internships:', error);
      return [];
    }
  }

  async createInternship(internshipData: {
    role: string;
    company_id: number;
    location: string;
    type: string;
    domain: string;
    description: string;
    requirements?: string;
    salary_range?: string;
    apply_link: string;
    deadline?: Date;
    logo?: string;
    company_color?: string;
    created_by: number;
  }) {
    try {
      const result = await db.insert(internships).values({
        ...internshipData,
        posted_date: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating internship:', error);
      throw new Error('Failed to create internship');
    }
  }

  // Event operations
  async getEvents(filters?: {
    event_type?: string;
    limit?: number;
  }) {
    try {
      let query = db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          event_date: events.event_date,
          location: events.location,
          event_type: events.event_type,
          organizer: events.organizer,
          registration_link: events.registration_link,
          max_participants: events.max_participants,
          is_active: events.is_active,
          creator_name: users.name
        })
        .from(events)
        .leftJoin(users, eq(events.created_by, users.id))
        .where(eq(events.is_active, true));

      if (filters?.event_type) {
        query = query.where(and(eq(events.is_active, true), eq(events.event_type, filters.event_type)));
      }

      query = query.orderBy(events.event_date);
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async createEvent(eventData: {
    title: string;
    description: string;
    event_date: Date;
    location: string;
    event_type: string;
    organizer: string;
    registration_link?: string;
    max_participants?: number;
    created_by: number;
  }) {
    try {
      const result = await db.insert(events).values(eventData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  // Group operations
  async getGroups(filters?: {
    category?: string;
    privacy?: string;
    limit?: number;
  }) {
    try {
      let query = db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          category: groups.category,
          privacy: groups.privacy,
          max_members: groups.max_members,
          creator_name: users.name,
          created_at: groups.created_at
        })
        .from(groups)
        .leftJoin(users, eq(groups.created_by, users.id));

      if (filters?.category) {
        query = query.where(eq(groups.category, filters.category));
      }
      if (filters?.privacy) {
        query = query.where(eq(groups.privacy, filters.privacy));
      }

      query = query.orderBy(desc(groups.created_at));
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting groups:', error);
      return [];
    }
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    privacy: string;
    max_members?: number;
    created_by: number;
  }) {
    try {
      const result = await db.insert(groups).values(groupData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  // Resource operations
  async getResources(filters?: {
    category?: string;
    resource_type?: string;
    limit?: number;
  }) {
    try {
      let query = db
        .select({
          id: resources.id,
          title: resources.title,
          resource_url: resources.resource_url,
          description: resources.description,
          resource_type: resources.resource_type,
          category: resources.category,
          tags: resources.tags,
          upvotes: resources.upvotes,
          poster_name: users.name,
          created_at: resources.created_at
        })
        .from(resources)
        .leftJoin(users, eq(resources.posted_by, users.id));

      if (filters?.category) {
        query = query.where(eq(resources.category, filters.category));
      }
      if (filters?.resource_type) {
        query = query.where(eq(resources.resource_type, filters.resource_type));
      }

      query = query.orderBy(desc(resources.upvotes), desc(resources.created_at));
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting resources:', error);
      return [];
    }
  }

  async createResource(resourceData: {
    title: string;
    resource_url: string;
    description: string;
    resource_type: string;
    category: string;
    tags?: string;
    posted_by: number;
  }) {
    try {
      const result = await db.insert(resources).values(resourceData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating resource:', error);
      throw new Error('Failed to create resource');
    }
  }

  // Forum operations
  async getForumPosts(forum_id?: number, limit?: number) {
    try {
      let query = db
        .select({
          id: forum_posts.id,
          forum_id: forum_posts.forum_id,
          content: forum_posts.content,
          upvotes: forum_posts.upvotes,
          author_name: users.name,
          author_avatar: users.avatar_url,
          created_at: forum_posts.created_at
        })
        .from(forum_posts)
        .leftJoin(users, eq(forum_posts.user_id, users.id));

      if (forum_id) {
        query = query.where(eq(forum_posts.forum_id, forum_id));
      }

      query = query.orderBy(desc(forum_posts.created_at));
      
      if (limit) {
        query = query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting forum posts:', error);
      return [];
    }
  }

  async createForumPost(postData: {
    forum_id: number;
    user_id: number;
    content: string;
  }) {
    try {
      const result = await db.insert(forum_posts).values(postData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw new Error('Failed to create forum post');
    }
  }

  // Search operations
  async searchContent(query: string, type?: string, limit: number = 20) {
    try {
      const searchTerm = `%${query}%`;
      const results = [];

      if (!type || type === 'internships') {
        const internshipResults = await db
          .select({
            type: 'internship' as const,
            id: internships.id,
            title: internships.role,
            description: internships.description,
            created_at: internships.created_at
          })
          .from(internships)
          .where(
            and(
              eq(internships.is_active, true),
              or(
                like(internships.role, searchTerm),
                like(internships.description, searchTerm),
                like(internships.domain, searchTerm)
              )
            )
          )
          .limit(limit);
        results.push(...internshipResults);
      }

      if (!type || type === 'events') {
        const eventResults = await db
          .select({
            type: 'event' as const,
            id: events.id,
            title: events.title,
            description: events.description,
            created_at: events.created_at
          })
          .from(events)
          .where(
            and(
              eq(events.is_active, true),
              or(
                like(events.title, searchTerm),
                like(events.description, searchTerm),
                like(events.event_type, searchTerm)
              )
            )
          )
          .limit(limit);
        results.push(...eventResults);
      }

      if (!type || type === 'resources') {
        const resourceResults = await db
          .select({
            type: 'resource' as const,
            id: resources.id,
            title: resources.title,
            description: resources.description,
            created_at: resources.created_at
          })
          .from(resources)
          .where(
            or(
              like(resources.title, searchTerm),
              like(resources.description, searchTerm),
              like(resources.category, searchTerm)
            )
          )
          .limit(limit);
        results.push(...resourceResults);
      }

      return results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);
    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }
}

export const storage = new PostgreSQLStorage();
    const res = await pool.query('SELECT * FROM companies');
    return res.rows;
  }

  async createCompany(data: {
    name: string;
    logo_url?: string;
    website?: string;
    description?: string;
  }) {
    const { name, logo_url, website, description } = data;
    const res = await pool.query(
      'INSERT INTO companies (name, logo_url, website, description) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, logo_url, website, description]
    );
    return res.rows[0];
  }

  async getForums() {
    const res = await pool.query('SELECT * FROM forums');
    return res.rows;
  }

  async createForum(data: {
    title: string;
    description: string;
    created_by: number;
  }) {
    const { title, description, created_by } = data;
    const res = await pool.query(
      'INSERT INTO forums (title, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [title, description, created_by]
    );
    return res.rows[0];
  }

  async getForumPosts(forum_id: number) {
    const res = await pool.query('SELECT * FROM forum_posts WHERE forum_id = $1', [forum_id]);
    return res.rows;
  }

  async createForumPost(data: {
    forum_id: number;
    user_id: number;
    content: string;
  }) {
    const { forum_id, user_id, content } = data;
    const res = await pool.query(
      'INSERT INTO forum_posts (forum_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
      [forum_id, user_id, content]
    );
    return res.rows[0];
  }

  async getGroups() {
    const res = await pool.query('SELECT * FROM groups');
    return res.rows;
  }

  async createGroup(data: {
    name: string;
    description: string;
    created_by: number;
  }) {
    const { name, description, created_by } = data;
    const res = await pool.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name, description, created_by]
    );
    return res.rows[0];
  }

  async getGroupMembers(group_id: number) {
    const res = await pool.query('SELECT * FROM group_members WHERE group_id = $1', [group_id]);
    return res.rows;
  }

  async addGroupMember(data: {
    group_id: number;
    user_id: number;
  }) {
    const { group_id, user_id } = data;
    const res = await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) RETURNING *',
      [group_id, user_id]
    );
    return res.rows[0];
  }

  async getEvents() {
    const res = await pool.query('SELECT * FROM events');
    return res.rows;
  }

  async createEvent(data: {
    title: string;
    description: string;
    location: string;
    event_date: string;
    created_by: number;
  }) {
    const { title, description, location, event_date, created_by } = data;
    const res = await pool.query(
      'INSERT INTO events (title, description, location, event_date, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description, location, event_date, created_by]
    );
    return res.rows[0];
  }

  async getResources() {
    const res = await pool.query('SELECT * FROM resources');
    return res.rows;
  }

  async createResource(data: {
    title: string;
    url: string;
    description: string;
    posted_by: number;
  }) {
    const { title, url, description, posted_by } = data;
    const res = await pool.query(
      'INSERT INTO resources (title, url, description, posted_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, url, description, posted_by]
    );
    return res.rows[0];
  }
}

export const storage = new PostgreSQLStorage();
