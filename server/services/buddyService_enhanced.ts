import Groq from 'groq-sdk';
import VectorDBService from './vectorDB';
import SkillExtractorService from './skillExtractor';

/**
 * BUDDY - RAG-powered AI Assistant for UNISO
 * Handles:
 * - Document analysis and embedding (RAG)
 * - Skill extraction and profiling
 * - Career guidance and project ideas
 * - Cover letter generation
 * - Context-aware chat with memory
 * - Specialized query handling (academic, career, interview prep)
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedSkills {
  technical: string[];
  soft: string[];
  domain: string[];
}

interface RAGContext {
  retrievedDocuments: string[];
  relevanceScores: number[];
  documentIds: number[];
}

interface BUDDYContext {
  userId: number;
  userProfile?: any;
  uploadedDocuments?: string[];
  extractedSkills?: ExtractedSkills;
  careerGoals?: string;
  conversationHistory?: ChatMessage[];
  ragContext?: RAGContext;
}

interface QueryType {
  type: 'academic' | 'career' | 'project' | 'interview' | 'skill' | 'general';
  confidence: number;
}

interface ChatResponse {
  message: string;
  ragSources?: number[];
  suggestedQueries?: string[];
}

class BUDDYService {
  private client: Groq;
  private model = 'llama3-70b-8192';
  private conversationHistory: ChatMessage[] = [];
  private context: BUDDYContext;
  private vectorDB: VectorDBService;
  private skillExtractor: SkillExtractorService;

  constructor(userId: number = 0) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey });
    this.vectorDB = new VectorDBService();
    this.skillExtractor = new SkillExtractorService();

    this.context = {
      userId,
      conversationHistory: [],
      extractedSkills: { technical: [], soft: [], domain: [] },
      ragContext: { retrievedDocuments: [], relevanceScores: [], documentIds: [] },
    };
  }

  /**
   * Initialize BUDDY with user context
   */
  async initializeContext(
    userId: number,
    userProfile: any,
    documents?: string[],
    careerGoals?: string
  ): Promise<void> {
    this.context.userId = userId;
    this.context.userProfile = userProfile;
    this.context.uploadedDocuments = documents || [];
    this.context.careerGoals = careerGoals || '';

    // Fetch user's skill profile from database
    try {
      const skillProfile = await this.skillExtractor.getUserSkillProfile(userId);
      this.context.extractedSkills = {
        technical: skillProfile.technical.map(s => s.skill),
        soft: skillProfile.soft.map(s => s.skill),
        domain: skillProfile.domain.map(s => s.skill),
      };
    } catch (error) {
      console.error('Error fetching skill profile:', error);
    }
  }

  /**
   * Detect query type for specialized handling
   */
  private async detectQueryType(userMessage: string): Promise<QueryType> {
    const lowerMessage = userMessage.toLowerCase();

    // Academic queries
    if (/\b(explain|teach|course|assignment|exam|study|concept|theory|how to learn)\b/.test(lowerMessage)) {
      return { type: 'academic', confidence: 0.9 };
    }

    // Career queries
    if (/\b(job|career|position|salary|company|industry|role|application)\b/.test(lowerMessage)) {
      return { type: 'career', confidence: 0.85 };
    }

    // Project queries
    if (/\b(project|build|create|develop|code|feature|app|tool)\b/.test(lowerMessage)) {
      return { type: 'project', confidence: 0.8 };
    }

    // Interview prep
    if (/\b(interview|question|prepared|practice|behavioral|technical|coding)\b/.test(lowerMessage)) {
      return { type: 'interview', confidence: 0.85 };
    }

    // Skill-related
    if (/\b(skill|learn|competency|proficiency|certification)\b/.test(lowerMessage)) {
      return { type: 'skill', confidence: 0.8 };
    }

    return { type: 'general', confidence: 0.5 };
  }

  /**
   * Retrieve relevant context from RAG
   */
  private async retrieveRAGContext(userId: number, query: string, topK = 3): Promise<RAGContext> {
    try {
      const results = await this.vectorDB.hybridSearch(userId, query, topK, 0.5);

      return {
        retrievedDocuments: results.map(r => r.content),
        relevanceScores: results.map(r => r.score || 0),
        documentIds: results.map(r => r.documentId || 0).filter(id => id > 0),
      };
    } catch (error) {
      console.error('Error retrieving RAG context:', error);
      return { retrievedDocuments: [], relevanceScores: [], documentIds: [] };
    }
  }

  /**
   * Build specialized system prompt based on query type
   */
  private buildSystemPrompt(queryType: QueryType): string {
    const basePrompt = `You are BUDDY, an AI assistant for UNISO - a platform for students and professionals.
You provide personalized guidance on academics, careers, projects, and skill development.

User Profile:
${this.context.userProfile ? JSON.stringify(this.context.userProfile, null, 2) : 'No profile loaded'}

User Skills:
- Technical: ${this.context.extractedSkills?.technical?.join(', ') || 'Not yet profiled'}
- Soft Skills: ${this.context.extractedSkills?.soft?.join(', ') || 'Not yet profiled'}
- Domain: ${this.context.extractedSkills?.domain?.join(', ') || 'Not yet profiled'}

Career Goals: ${this.context.careerGoals || 'Not specified'}

---

`;

    const ragContext =
      this.context.ragContext && this.context.ragContext.retrievedDocuments.length > 0
        ? `\nRELEVANT DOCUMENTS FROM YOUR PROFILE:\n${this.context.ragContext.retrievedDocuments
            .slice(0, 3)
            .map((doc, i) => `[Document ${i + 1}] ${doc}`)
            .join('\n\n')}\n---\n`
        : '';

    const typeSpecificPrompts = {
      academic: `ACADEMIC GUIDANCE MODE:
You are an educational mentor. Help explain concepts clearly, provide learning resources, 
suggest study strategies, and connect theory to practical applications. Use the user's background to tailor explanations.`,

      career: `CAREER GUIDANCE MODE:
You are a career coach. Provide advice on job searching, career development, industry trends, and professional growth.
Reference the user's skills and experience. Suggest opportunities aligned with their profile.`,

      project: `PROJECT IDEATION & GUIDANCE MODE:
You are a project mentor. Help brainstorm ideas, plan implementations, suggest tech stacks, and provide coding guidance.
Consider the user's skill level and interests. Break down complex projects into manageable steps.`,

      interview: `INTERVIEW PREPARATION MODE:
You are an interview coach. Help prepare for technical and behavioral interviews.
Practice questions, provide tips, explain common algorithms, and help build confidence.
Tailor advice to the user's target roles and experience level.`,

      skill: `SKILL DEVELOPMENT MODE:
You are a skill coach. Recommend learning paths, suggest resources, and track progress.
Help identify skill gaps and suggest complementary skills to develop.`,

      general: `GENERAL ASSISTANCE MODE:
Be helpful, conversational, and personalized. Use the user's background to provide relevant advice across any topic.`,
    };

    return basePrompt + ragContext + typeSpecificPrompts[queryType.type];
  }

  /**
   * Chat with BUDDY - context-aware conversation with RAG
   */
  async chat(userMessage: string): Promise<ChatResponse> {
    try {
      // Detect query type
      const queryType = await this.detectQueryType(userMessage);
      console.log(`Query Type: ${queryType.type} (confidence: ${queryType.confidence})`);

      // Retrieve RAG context
      this.context.ragContext = await this.retrieveRAGContext(this.context.userId, userMessage, 3);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Build specialized system prompt
      const systemPrompt = this.buildSystemPrompt(queryType);

      // Call Groq API
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      });

      const assistantText = response.choices[0].message.content || '';
      if (!assistantText) {
        throw new Error('Empty response from Groq');
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantText,
      });

      // Generate suggested follow-up queries
      const suggestedQueries = this.generateSuggestedQueries(queryType, userMessage);

      return {
        message: assistantText,
        ragSources: this.context.ragContext.documentIds,
        suggestedQueries,
      };
    } catch (error) {
      console.error('Error in BUDDY chat:', error);
      throw error;
    }
  }

  /**
   * Generate suggested follow-up queries
   */
  private generateSuggestedQueries(queryType: QueryType, lastMessage: string): string[] {
    const suggestions: string[] = [];

    switch (queryType.type) {
      case 'academic':
        suggestions.push(
          'Can you provide examples?',
          'How does this connect to real-world applications?',
          'What are common mistakes to avoid?'
        );
        break;

      case 'career':
        suggestions.push(
          'What companies are hiring for this role?',
          'How can I improve my profile?',
          'What skills should I prioritize?'
        );
        break;

      case 'project':
        suggestions.push('Can you help me plan the architecture?', 'What technologies would you recommend?', 'How do I deploy this?');
        break;

      case 'interview':
        suggestions.push(
          'Can you give me a practice question?',
          'How do I explain my experience better?',
          'What should I prepare for the interview?'
        );
        break;

      case 'skill':
        suggestions.push(
          'What resources should I use to learn?',
          'How long does it take to master this?',
          'What projects can help me practice?'
        );
        break;

      default:
        suggestions.push('Tell me more about this', 'How can I get started?', 'What resources would help?');
    }

    return suggestions;
  }

  /**
   * Generate project ideas based on user profile
   */
  async generateProjectIdeas(count = 5): Promise<string[]> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `You are a project mentor. Generate project ideas that match the user's skill level and interests.
                     Consider their experience level and return ideas as a JSON array of strings.`,
          },
          {
            role: 'user',
            content: `Based on my skills (${this.context.extractedSkills?.technical?.join(', ') || 'Not specified'}) 
                     and interests (${this.context.careerGoals || 'General'}), suggest ${count} project ideas I could build.
                     Return as JSON array only.`,
          },
        ],
      });

      try {
        const textContent = response.choices[0].message.content;
        if (textContent) {
          const ideas = JSON.parse(textContent);
          return Array.isArray(ideas) ? ideas : [];
        }
      } catch (parseError) {
        console.error('Failed to parse project ideas:', parseError);
      }

      return [];
    } catch (error) {
      console.error('Error generating project ideas:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get current context
   */
  getContext(): BUDDYContext {
    return this.context;
  }

  /**
   * Close services
   */
  async close(): Promise<void> {
    await this.vectorDB.close();
    await this.skillExtractor.close();
  }
}

export default BUDDYService;
