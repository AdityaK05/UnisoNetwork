import Groq from 'groq-sdk';
import { Pool } from 'pg';

interface CoverLetterRequest {
  jobTitle: string;
  company: string;
  jobDescription: string;
  customizationLevel?: 'generic' | 'moderate' | 'highly-personalized';
}

interface GeneratedCoverLetter {
  letterId: number;
  letterContent: string;
  versionNumber: number;
}

/**
 * CoverLetterService - Generates personalized cover letters
 * Uses BUDDY context (skills, experience, career goals) + job description
 */
class CoverLetterService {
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
   * Generate cover letter
   */
  async generateCoverLetter(
    userId: number,
    chatId: number,
    request: CoverLetterRequest
  ): Promise<GeneratedCoverLetter> {
    try {
      console.log(`📝 Generating cover letter for ${request.jobTitle} at ${request.company}`);

      // Get user profile and skills
      const { profile, skills, careerGoals } = await this.getUserContext(userId);

      // Build context prompt
      const contextPrompt = this.buildContextPrompt(profile, skills, careerGoals, request);

      // Generate cover letter with appropriate customization
      const letterContent = await this.generateLetter(contextPrompt, request.customizationLevel || 'moderate');

      // Store in database
      const letterId = await this.storeCoverLetter(
        userId,
        chatId,
        request,
        letterContent,
        { skills: skills.map(s => s.skill), careerGoals }
      );

      console.log(`✅ Cover letter generated (ID: ${letterId})`);

      return {
        letterId,
        letterContent,
        versionNumber: 1,
      };
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw error;
    }
  }

  /**
   * Get user context for personalization
   */
  private async getUserContext(userId: number): Promise<{
    profile: any;
    skills: any[];
    careerGoals: string;
  }> {
    try {
      // Get career profile
      const profileResult = await this.pool.query(
        `SELECT target_roles, career_goals, work_experience_years, highest_education
         FROM buddy_career_profiles
         WHERE user_id = $1
         LIMIT 1`,
        [userId]
      );

      // Get top skills
      const skillsResult = await this.pool.query(
        `SELECT skill, skill_category, proficiency_level
         FROM buddy_skills
         WHERE user_id = $1
         ORDER BY times_mentioned DESC, confidence DESC
         LIMIT 15`,
        [userId]
      );

      const profile = profileResult.rows[0] || {};
      const skills = skillsResult.rows || [];
      const careerGoals = profile.career_goals || '';

      return {
        profile,
        skills,
        careerGoals,
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        profile: {},
        skills: [],
        careerGoals: '',
      };
    }
  }

  /**
   * Build context prompt for letter generation
   */
  private buildContextPrompt(
    profile: any,
    skills: any[],
    careerGoals: string,
    request: CoverLetterRequest
  ): string {
    const skillsList = skills.map(s => s.skill).join(', ');
    const targetRoles = profile.target_roles ? JSON.parse(profile.target_roles).join(', ') : '';
    const experienceYears = profile.work_experience_years || 0;
    const education = profile.highest_education || '';

    return `CANDIDATE PROFILE:
- Target Roles: ${targetRoles}
- Career Goals: ${careerGoals}
- Experience: ${experienceYears} years
- Education: ${education}
- Key Skills: ${skillsList}

JOB OPPORTUNITY:
- Position: ${request.jobTitle}
- Company: ${request.company}
- Job Description:
${request.jobDescription}`;
  }

  /**
   * Generate cover letter content
   */
  private async generateLetter(
    contextPrompt: string,
    customizationLevel: 'generic' | 'moderate' | 'highly-personalized'
  ): Promise<string> {
    const customizationInstructions = {
      generic: `Write a professional cover letter that is general enough to apply to many similar positions.
                Focus on core competencies and general value proposition.`,
      moderate: `Write a professional cover letter tailored to this specific job and company.
                 Show understanding of the role and company. Highlight relevant skills and experience.`,
      'highly-personalized': `Write an exceptional, highly personalized cover letter that demonstrates deep knowledge of the company and role.
                              Make specific connections between the candidate's skills and the job requirements.
                              Use specific company details if mentioned. Make the candidate stand out.`,
    };

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are an expert career coach and resume writer. 
                   Your task is to write compelling, professional cover letters that help candidates stand out.
                   
                   Guidelines:
                   - Professional and formal tone
                   - 3-4 paragraphs (opening, body, closing)
                   - Show enthusiasm for the role and company
                   - Connect candidate skills to job requirements
                   - Address recruiter professionally
                   - Include a call to action
                   - Maintain authenticity while highlighting strengths`
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Store cover letter in database
   */
  private async storeCoverLetter(
    userId: number,
    chatId: number,
    request: CoverLetterRequest,
    letterContent: string,
    contextUsed: any
  ): Promise<number> {
    try {
      // Get version number
      const versionResult = await this.pool.query(
        `SELECT MAX(version_number) as max_version
         FROM buddy_cover_letters
         WHERE user_id = $1 AND job_title = $2 AND company_name = $3`,
        [userId, request.jobTitle, request.company]
      );

      const versionNumber = (versionResult.rows[0]?.max_version || 0) + 1;

      // Insert cover letter
      const result = await this.pool.query(
        `INSERT INTO buddy_cover_letters 
         (user_id, chat_id, job_title, company_name, job_description, generated_letter, 
          version_number, customization_level, context_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          chatId,
          request.jobTitle,
          request.company,
          request.jobDescription,
          letterContent,
          versionNumber,
          request.customizationLevel || 'moderate',
          JSON.stringify(contextUsed),
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error storing cover letter:', error);
      throw error;
    }
  }

  /**
   * Get user's cover letters
   */
  async getUserCoverLetters(userId: number, limit = 20): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, job_title, company_name, version_number, customization_level, 
                created_at, user_edited_at
         FROM buddy_cover_letters
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting cover letters:', error);
      throw error;
    }
  }

  /**
   * Get specific cover letter
   */
  async getCoverLetter(letterId: number, userId: number): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM buddy_cover_letters
         WHERE id = $1 AND user_id = $2`,
        [letterId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Cover letter not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting cover letter:', error);
      throw error;
    }
  }

  /**
   * Update cover letter
   */
  async updateCoverLetter(letterId: number, userId: number, letterContent: string): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE buddy_cover_letters
         SET generated_letter = $1, user_edited_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3`,
        [letterContent, letterId, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Cover letter not found or unauthorized');
      }
    } catch (error) {
      console.error('Error updating cover letter:', error);
      throw error;
    }
  }

  /**
   * Delete cover letter
   */
  async deleteCoverLetter(letterId: number, userId: number): Promise<void> {
    try {
      const result = await this.pool.query(
        `DELETE FROM buddy_cover_letters
         WHERE id = $1 AND user_id = $2`,
        [letterId, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Cover letter not found or unauthorized');
      }
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      throw error;
    }
  }

  /**
   * Generate multiple versions of a cover letter
   */
  async generateMultipleVersions(
    userId: number,
    chatId: number,
    request: CoverLetterRequest,
    versions: Array<'generic' | 'moderate' | 'highly-personalized'> = [
      'generic',
      'moderate',
      'highly-personalized',
    ]
  ): Promise<GeneratedCoverLetter[]> {
    const results: GeneratedCoverLetter[] = [];

    for (const customizationLevel of versions) {
      const letterRequest = { ...request, customizationLevel };
      const result = await this.generateCoverLetter(userId, chatId, letterRequest);
      results.push(result);
    }

    return results;
  }

  /**
   * Get improvement suggestions for a cover letter
   */
  async getSuggestions(letterId: number, userId: number): Promise<string[]> {
    try {
      const letter = await this.getCoverLetter(letterId, userId);

      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are an expert career coach specializing in cover letters.
                     Review the provided cover letter and give 5-7 specific suggestions for improvement.
                     Focus on impact, personalization, and relevance to the job.
                     Return suggestions as a JSON array of strings.`
          },
          {
            role: 'user',
            content: `Please review this cover letter for improvements:\n\n${letter.generated_letter}`,
          },
        ],
      });

      try {
        const textContent = response.choices[0].message.content || '';
        const suggestions = JSON.parse(textContent);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (parseError) {
        console.error('Failed to parse suggestions:', parseError);
      }

      return [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
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

export default CoverLetterService;
