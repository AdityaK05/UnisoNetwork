import Groq from 'groq-sdk';
import { Pool } from 'pg';

interface ExtractedSkill {
  skill: string;
  category: string;
  proficiencyLevel?: string;
  confidence?: number;
  context?: string;
}

interface SkillProfile {
  userId: number;
  technical: ExtractedSkill[];
  soft: ExtractedSkill[];
  domain: ExtractedSkill[];
  languages: ExtractedSkill[];
  tools: ExtractedSkill[];
}

/**
 * SkillExtractorService - Extracts and profiles skills from documents
 * Stores skills with proficiency levels and categories
 */
class SkillExtractorService {
  private client: Groq;
  private model = 'llama3-70b-8192';
  private pool: Pool;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey });
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Extract skills from text using Claude AI
   */
  async extractSkillsFromText(
    userId: number,
    text: string,
    source: string = 'document',
    documentId?: number
  ): Promise<ExtractedSkill[]> {
    try {
      console.log(`🔍 Extracting skills from ${source}...`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a skill extraction expert. Extract all technical skills, soft skills, domain expertise, 
                     programming languages, and tools from the provided text.
                     
                     Return a JSON object with this structure:
                     {
                       "technical": [{"skill": "name", "category": "programming|database|framework|cloud|ai-ml|devops|other", "proficiencyLevel": "beginner|intermediate|advanced|expert", "confidence": 0.0-1.0}],
                       "soft": [{"skill": "name", "proficiencyLevel": "beginner|intermediate|advanced|expert", "confidence": 0.0-1.0}],
                       "domain": [{"skill": "name", "category": "finance|healthcare|education|ecommerce|other", "confidence": 0.0-1.0}],
                       "languages": [{"skill": "language", "proficiencyLevel": "beginner|intermediate|advanced|native", "confidence": 0.0-1.0}],
                       "tools": [{"skill": "tool", "category": "ide|vcs|ci-cd|collaboration|other", "confidence": 0.0-1.0}]
                     }
                     
                     Only return valid JSON, no other text.`
          },
          {
            role: 'user',
            content: `Extract skills from this text:\n\n${text}`,
          },
        ],
      });

      try {
        const textContent = response.choices[0].message.content || '';
        const parsed = JSON.parse(textContent);
        const allSkills: ExtractedSkill[] = [];

        // Flatten all skill categories
        Object.values(parsed).forEach((categorySkills: any) => {
          if (Array.isArray(categorySkills)) {
            allSkills.push(...categorySkills);
          }
        });

        // Store skills in database
        await this.storeSkills(userId, allSkills, source, documentId);

        console.log(`✅ Extracted ${allSkills.length} skills`);
        return allSkills;
      } catch (parseError) {
        console.error('Failed to parse skills response:', parseError);
      }

      return [];
    } catch (error) {
      console.error('Error extracting skills:', error);
      throw error;
    }
  }

  /**
   * Store extracted skills in database
   */
  private async storeSkills(
    userId: number,
    skills: ExtractedSkill[],
    source: string,
    documentId?: number
  ): Promise<void> {
    try {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        for (const skill of skills) {
          // Check if skill already exists
          const existing = await client.query(
            `SELECT id FROM buddy_skills 
             WHERE user_id = $1 AND LOWER(skill) = LOWER($2)`,
            [userId, skill.skill]
          );

          if (existing.rows.length > 0) {
            // Update existing skill
            await client.query(
              `UPDATE buddy_skills 
               SET times_mentioned = times_mentioned + 1,
                   last_mentioned_in = $3,
                   confidence = GREATEST(confidence, $4),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [existing.rows[0].id, documentId, skill.confidence || 0.8]
            );
          } else {
            // Insert new skill
            await client.query(
              `INSERT INTO buddy_skills 
               (user_id, skill, skill_category, proficiency_level, source, confidence, last_mentioned_in, times_mentioned)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
              [
                userId,
                skill.skill,
                skill.category || 'technical',
                skill.proficiencyLevel || 'intermediate',
                source,
                skill.confidence || 0.8,
                documentId,
              ]
            );
          }
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error storing skills:', error);
    }
  }

  /**
   * Extract skills from resume
   */
  async extractSkillsFromResume(
    userId: number,
    resumeText: string,
    documentId?: number
  ): Promise<ExtractedSkill[]> {
    return this.extractSkillsFromText(userId, resumeText, 'resume', documentId);
  }

  /**
   * Extract skills from uploaded document
   */
  async extractSkillsFromDocument(
    userId: number,
    documentText: string,
    documentId: number
  ): Promise<ExtractedSkill[]> {
    return this.extractSkillsFromText(userId, documentText, 'document', documentId);
  }

  /**
   * Get user's skill profile
   */
  async getUserSkillProfile(userId: number): Promise<SkillProfile> {
    try {
      const result = await this.pool.query(
        `SELECT skill, skill_category, proficiency_level, confidence, times_mentioned
         FROM buddy_skills
         WHERE user_id = $1
         ORDER BY times_mentioned DESC, confidence DESC`,
        [userId]
      );

      const profile: SkillProfile = {
        userId,
        technical: [],
        soft: [],
        domain: [],
        languages: [],
        tools: [],
      };

      for (const row of result.rows) {
        const skill: ExtractedSkill = {
          skill: row.skill,
          category: row.skill_category,
          proficiencyLevel: row.proficiency_level,
          confidence: row.confidence,
        };

        switch (row.skill_category) {
          case 'technical':
            profile.technical.push(skill);
            break;
          case 'soft':
            profile.soft.push(skill);
            break;
          case 'domain':
            profile.domain.push(skill);
            break;
          case 'language':
            profile.languages.push(skill);
            break;
          case 'tool':
            profile.tools.push(skill);
            break;
        }
      }

      return profile;
    } catch (error) {
      console.error('Error getting skill profile:', error);
      throw error;
    }
  }

  /**
   * Get top skills for user
   */
  async getTopSkills(userId: number, limit = 10): Promise<ExtractedSkill[]> {
    try {
      const result = await this.pool.query(
        `SELECT skill, skill_category, proficiency_level, confidence, times_mentioned
         FROM buddy_skills
         WHERE user_id = $1
         ORDER BY times_mentioned DESC, confidence DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => ({
        skill: row.skill,
        category: row.skill_category,
        proficiencyLevel: row.proficiency_level,
        confidence: row.confidence,
      }));
    } catch (error) {
      console.error('Error getting top skills:', error);
      throw error;
    }
  }

  /**
   * Infer skill gaps and recommendations
   */
  async getSkillRecommendations(userId: number, targetRole?: string): Promise<string[]> {
    try {
      const profile = await this.getUserSkillProfile(userId);
      const allSkills = [
        ...profile.technical,
        ...profile.soft,
        ...profile.domain,
        ...profile.languages,
        ...profile.tools,
      ];

      const skillNames = allSkills.map(s => s.skill).join(', ');

      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `You are a career advisor. Based on the user's current skills and target role,
                     recommend 5-10 skills they should develop to advance their career.
                     Return only a JSON array of skill recommendations with brief descriptions.
                     Format: ["skill1 - brief description", "skill2 - brief description", ...]`,
          },
          {
            role: 'user',
            content: `Current skills: ${skillNames}
                     Target role: ${targetRole || 'not specified'}
                     
                     What skills should I learn to advance in my career?`,
          },
        ],
      });

      try {
        const textContent = response.choices[0].message.content || '';
        const recommendations = JSON.parse(textContent);
        return Array.isArray(recommendations) ? recommendations : [];
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
      }

      return [];
    } catch (error) {
      console.error('Error getting skill recommendations:', error);
      throw error;
    }
  }

  /**
   * Update skill proficiency level
   */
  async updateSkillProficiency(
    userId: number,
    skillName: string,
    proficiencyLevel: string
  ): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE buddy_skills
         SET proficiency_level = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND LOWER(skill) = LOWER($3)`,
        [proficiencyLevel, userId, skillName]
      );

      if (result.rowCount === 0) {
        throw new Error(`Skill "${skillName}" not found for user`);
      }
    } catch (error) {
      console.error('Error updating skill proficiency:', error);
      throw error;
    }
  }

  /**
   * Remove a skill
   */
  async removeSkill(userId: number, skillName: string): Promise<void> {
    try {
      await this.pool.query(
        `DELETE FROM buddy_skills
         WHERE user_id = $1 AND LOWER(skill) = LOWER($2)`,
        [userId, skillName]
      );
    } catch (error) {
      console.error('Error removing skill:', error);
      throw error;
    }
  }

  /**
   * Add custom skill
   */
  async addCustomSkill(
    userId: number,
    skill: string,
    category: string,
    proficiencyLevel: string
  ): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO buddy_skills (user_id, skill, skill_category, proficiency_level, source, confidence)
         VALUES ($1, $2, $3, $4, 'manual', 0.95)`,
        [userId, skill, category, proficiencyLevel]
      );
    } catch (error) {
      console.error('Error adding custom skill:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default SkillExtractorService;
