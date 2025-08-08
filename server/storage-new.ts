// @ts-ignore
import pool from './db/index.cjs';

export class PostgreSQLStorage {
  // User operations
  async getUser(id: number) {
    try {
      const res = await pool.query('SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
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
      const res = await pool.query(
        'INSERT INTO users (name, email, password_hash, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar_url, created_at',
        [userData.name, userData.email, userData.password_hash, userData.avatar_url || null]
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Company operations
  async getCompanies() {
    try {
      const res = await pool.query('SELECT * FROM companies ORDER BY name');
      return res.rows;
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
      const res = await pool.query(
        'INSERT INTO companies (name, logo_url, website, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [companyData.name, companyData.logo_url, companyData.website, companyData.description]
      );
      return res.rows[0];
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
      let query = `
        SELECT i.*, c.name as company_name, c.logo_url as company_logo, c.website as company_website
        FROM internships i 
        LEFT JOIN companies c ON i.company_id = c.id 
        WHERE i.is_active = true
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.type) {
        query += ` AND i.type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }
      if (filters?.domain) {
        query += ` AND i.domain = $${paramIndex}`;
        params.push(filters.domain);
        paramIndex++;
      }
      if (filters?.location) {
        query += ` AND i.location ILIKE $${paramIndex}`;
        params.push(`%${filters.location}%`);
        paramIndex++;
      }

      query += ' ORDER BY i.posted_date DESC';
      
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
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
    deadline?: string;
    logo?: string;
    company_color?: string;
    created_by?: number;
  }) {
    try {
      const res = await pool.query(
        `INSERT INTO internships (role, company_id, location, type, domain, description, requirements, salary_range, apply_link, deadline, logo, company_color, created_by, posted_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE) RETURNING *`,
        [
          internshipData.role, 
          internshipData.company_id, 
          internshipData.location, 
          internshipData.type, 
          internshipData.domain, 
          internshipData.description, 
          internshipData.requirements,
          internshipData.salary_range,
          internshipData.apply_link, 
          internshipData.deadline, 
          internshipData.logo, 
          internshipData.company_color,
          internshipData.created_by
        ]
      );
      return res.rows[0];
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
      let query = `
        SELECT e.*, u.name as creator_name 
        FROM events e 
        LEFT JOIN users u ON e.created_by = u.id 
        WHERE e.is_active = true
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.event_type) {
        query += ` AND e.event_type = $${paramIndex}`;
        params.push(filters.event_type);
        paramIndex++;
      }

      query += ' ORDER BY e.event_date ASC';
      
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async createEvent(eventData: {
    title: string;
    description: string;
    event_date: string;
    location: string;
    event_type: string;
    organizer: string;
    registration_link?: string;
    max_participants?: number;
    created_by?: number;
  }) {
    try {
      const res = await pool.query(
        `INSERT INTO events (title, description, event_date, location, event_type, organizer, registration_link, max_participants, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          eventData.title,
          eventData.description,
          eventData.event_date,
          eventData.location,
          eventData.event_type,
          eventData.organizer,
          eventData.registration_link,
          eventData.max_participants,
          eventData.created_by
        ]
      );
      return res.rows[0];
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
      let query = `
        SELECT g.*, u.name as creator_name 
        FROM groups g 
        LEFT JOIN users u ON g.created_by = u.id
      `;
      const params: any[] = [];
      let paramIndex = 1;
      let hasWhere = false;

      if (filters?.category) {
        query += ` WHERE g.category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
        hasWhere = true;
      }
      if (filters?.privacy) {
        query += hasWhere ? ` AND g.privacy = $${paramIndex}` : ` WHERE g.privacy = $${paramIndex}`;
        params.push(filters.privacy);
        paramIndex++;
      }

      query += ' ORDER BY g.created_at DESC';
      
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
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
    created_by?: number;
  }) {
    try {
      const res = await pool.query(
        'INSERT INTO groups (name, description, category, privacy, max_members, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [groupData.name, groupData.description, groupData.category, groupData.privacy, groupData.max_members, groupData.created_by]
      );
      return res.rows[0];
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
      let query = `
        SELECT r.*, u.name as poster_name 
        FROM resources r 
        LEFT JOIN users u ON r.posted_by = u.id
      `;
      const params: any[] = [];
      let paramIndex = 1;
      let hasWhere = false;

      if (filters?.category) {
        query += ` WHERE r.category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
        hasWhere = true;
      }
      if (filters?.resource_type) {
        query += hasWhere ? ` AND r.resource_type = $${paramIndex}` : ` WHERE r.resource_type = $${paramIndex}`;
        params.push(filters.resource_type);
        paramIndex++;
      }

      query += ' ORDER BY r.upvotes DESC, r.created_at DESC';
      
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
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
    posted_by?: number;
  }) {
    try {
      const res = await pool.query(
        'INSERT INTO resources (title, resource_url, description, resource_type, category, tags, posted_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [resourceData.title, resourceData.resource_url, resourceData.description, resourceData.resource_type, resourceData.category, resourceData.tags, resourceData.posted_by]
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error creating resource:', error);
      throw new Error('Failed to create resource');
    }
  }

  // Forum operations
  async getForumPosts(forum_id?: number, limit?: number) {
    try {
      let query = `
        SELECT fp.*, u.name as author_name, u.avatar_url as author_avatar 
        FROM forum_posts fp 
        LEFT JOIN users u ON fp.user_id = u.id
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (forum_id) {
        query += ` WHERE fp.forum_id = $${paramIndex}`;
        params.push(forum_id);
        paramIndex++;
      }

      query += ' ORDER BY fp.created_at DESC';
      
      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
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
      const res = await pool.query(
        'INSERT INTO forum_posts (forum_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
        [postData.forum_id, postData.user_id, postData.content]
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw new Error('Failed to create forum post');
    }
  }

  // Search operations
  async searchContent(searchQuery: string, type?: string, limit: number = 20) {
    try {
      const searchTerm = `%${searchQuery}%`;
      const results = [];

      if (!type || type === 'internships') {
        const res = await pool.query(
          `SELECT 'internship' as type, id, role as title, description, created_at 
           FROM internships 
           WHERE is_active = true AND (role ILIKE $1 OR description ILIKE $1 OR domain ILIKE $1) 
           ORDER BY created_at DESC LIMIT $2`,
          [searchTerm, limit]
        );
        results.push(...res.rows);
      }

      if (!type || type === 'events') {
        const res = await pool.query(
          `SELECT 'event' as type, id, title, description, created_at 
           FROM events 
           WHERE is_active = true AND (title ILIKE $1 OR description ILIKE $1 OR event_type ILIKE $1) 
           ORDER BY created_at DESC LIMIT $2`,
          [searchTerm, limit]
        );
        results.push(...res.rows);
      }

      if (!type || type === 'resources') {
        const res = await pool.query(
          `SELECT 'resource' as type, id, title, description, created_at 
           FROM resources 
           WHERE title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 
           ORDER BY created_at DESC LIMIT $2`,
          [searchTerm, limit]
        );
        results.push(...res.rows);
      }

      // Sort all results by created_at and limit
      return results
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching content:', error);
      return [];
    }
  }
}

export const storage = new PostgreSQLStorage();
