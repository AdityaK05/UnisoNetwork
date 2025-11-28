import { Pool } from 'pg';

interface VectorStoreDoc {
  id?: number;
  userId: number;
  documentId?: number;
  content: string;
  chunkIndex: number;
  metadata?: Record<string, any>;
  embedding?: number[];
  similarity?: number;
}

interface RAGQueryResult {
  content: string;
  score: number;
  documentId?: number;
  chunkIndex?: number;
  metadata?: Record<string, any>;
}

/**
 * VectorDBService - Handles document embeddings and RAG retrieval
 * Uses Sentence Transformers for embeddings stored in PostgreSQL
 */
class VectorDBService {
  private pool: Pool;
  private embeddingDimension = 384; // Sentence Transformers dimension

  constructor() {
    const embeddingUrl = process.env.EMBEDDING_SERVER_URL;
    if (!embeddingUrl) {
      console.warn('⚠️ EMBEDDING_SERVER_URL not set. Embeddings will use mock mode.');
    }
    
    // Initialize database connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Split document into chunks for embedding
   */
  async chunkDocument(content: string, chunkSize = 1024, overlap = 100): Promise<string[]> {
    // Simple text splitting without langchain
    const chunks: string[] = [];
    let start = 0;
    
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      const chunk = content.substring(start, end);
      if (chunk.trim()) chunks.push(chunk);
      start = end - overlap;
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  /**
   * Generate embedding for text using Sentence Transformers
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingService = process.env.EMBEDDING_SERVICE || 'sentence-transformers';
      
      if (embeddingService === 'sentence-transformers') {
        return await this.generateSentenceTransformerEmbedding(text);
      } else {
        return this.generateMockEmbedding(text);
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate embedding using Sentence Transformers API
   */
  private async generateSentenceTransformerEmbedding(text: string): Promise<number[]> {
    const serverUrl = process.env.EMBEDDING_SERVER_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${serverUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) throw new Error(`Embedding server error: ${response.status}`);
      const data: any = await response.json();
      return data.embedding || this.generateMockEmbedding(text);
    } catch (error) {
      console.warn('Sentence Transformers unavailable, using mock:', error);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate mock embedding for development
   * Use text hash to create consistent embeddings
   */
  private generateMockEmbedding(text: string): number[] {
    const hash = this.hashText(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < this.embeddingDimension; i++) {
      const seed = (hash + i * 73856093) ^ (i * 19349663);
      embedding.push(Math.sin(seed / 1000) * Math.cos(seed / 2000));
    }
    
    return embedding;
  }

  /**
   * Simple hash function for text
   */
  private hashText(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Store document chunks and embeddings in database
   */
  async storeDocumentChunks(
    userId: number,
    documentId: number,
    chunks: string[]
  ): Promise<number[]> {
    const chunkIds: number[] = [];
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        // Store chunk
        const chunkResult = await client.query(
          `INSERT INTO buddy_knowledge_chunks (user_id, document_id, chunk_index, content, tokens)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, documentId, i, chunk, Math.ceil(chunk.length / 4)] // Rough token estimate
        );

        const chunkId = chunkResult.rows[0].id;
        chunkIds.push(chunkId);

        // Store embedding (if using database storage)
        if (process.env.STORE_EMBEDDINGS_IN_DB === 'true') {
          await client.query(
            `INSERT INTO buddy_embeddings (chunk_id, user_id, embedding_model, embedding, similarity_threshold)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              chunkId,
              userId,
              'anthropic-mock',
              JSON.stringify(embedding), // Store as JSON string
              0.5, // Default similarity threshold
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error storing document chunks:', error);
      throw error;
    } finally {
      client.release();
    }

    return chunkIds;
  }

  /**
   * Query similar documents using vector similarity
   */
  async queryDocuments(
    userId: number,
    queryText: string,
    topK = 5,
    threshold = 0.5
  ): Promise<RAGQueryResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Get all chunks for the user from database
      const result = await this.pool.query(
        `SELECT c.id, c.chunk_index, c.content, d.id as document_id
         FROM buddy_knowledge_chunks c
         JOIN buddy_documents d ON c.document_id = d.id
         WHERE c.user_id = $1 AND d.is_indexed = true
         LIMIT 1000`,
        [userId]
      );

      if (result.rows.length === 0) {
        return [];
      }

      // Calculate similarity for each chunk
      const similarities: RAGQueryResult[] = [];

      for (const row of result.rows) {
        // For database-stored embeddings
        if (process.env.STORE_EMBEDDINGS_IN_DB === 'true') {
          const embResult = await this.pool.query(
            `SELECT embedding FROM buddy_embeddings WHERE chunk_id = $1`,
            [row.id]
          );

          if (embResult.rows.length > 0) {
            const storedEmbedding = JSON.parse(embResult.rows[0].embedding);
            const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);

            if (similarity >= threshold) {
              similarities.push({
                content: row.content,
                score: similarity,
                documentId: row.document_id,
                chunkIndex: row.chunk_index,
              });
            }
          }
        } else {
          // For in-memory similarity calculation
          const chunkEmbedding = await this.generateEmbedding(row.content);
          const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

          if (similarity >= threshold) {
            similarities.push({
              content: row.content,
              score: similarity,
              documentId: row.document_id,
              chunkIndex: row.chunk_index,
            });
          }
        }
      }

      // Sort by similarity and return top K
      return similarities.sort((a, b) => b.score - a.score).slice(0, topK);
    } catch (error) {
      console.error('Error querying documents:', error);
      throw new Error('Failed to query documents');
    }
  }

  /**
   * Full-text search on document chunks
   */
  async fullTextSearch(
    userId: number,
    query: string,
    topK = 5
  ): Promise<RAGQueryResult[]> {
    try {
      const result = await this.pool.query(
        `SELECT c.id, c.chunk_index, c.content, d.id as document_id,
                ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $2)) as rank
         FROM buddy_knowledge_chunks c
         JOIN buddy_documents d ON c.document_id = d.id
         WHERE c.user_id = $1 AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $2)
         ORDER BY rank DESC
         LIMIT $3`,
        [userId, query, topK]
      );

      return result.rows.map(row => ({
        content: row.content,
        score: row.rank || 0,
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
      }));
    } catch (error) {
      console.error('Error in full-text search:', error);
      return [];
    }
  }

  /**
   * Hybrid search: combine vector + full-text search
   */
  async hybridSearch(
    userId: number,
    query: string,
    topK = 5,
    vectorThreshold = 0.5
  ): Promise<RAGQueryResult[]> {
    const [vectorResults, textResults] = await Promise.all([
      this.queryDocuments(userId, query, topK, vectorThreshold),
      this.fullTextSearch(userId, query, topK),
    ]);

    // Combine and deduplicate results
    const combined = new Map<string, RAGQueryResult>();

    vectorResults.forEach(r => {
      const key = `${r.documentId}-${r.chunkIndex}`;
      combined.set(key, {
        ...r,
        score: (r.score || 0) * 0.6, // Weight vector search
      });
    });

    textResults.forEach(r => {
      const key = `${r.documentId}-${r.chunkIndex}`;
      if (combined.has(key)) {
        const existing = combined.get(key)!;
        existing.score = (existing.score || 0) * 0.4 + (r.score || 0) * 0.4;
      } else {
        combined.set(key, {
          ...r,
          score: (r.score || 0) * 0.4,
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }

  /**
   * Delete embeddings for a document
   */
  async deleteDocumentEmbeddings(documentId: number): Promise<void> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Delete embeddings
        await client.query(
          `DELETE FROM buddy_embeddings
           WHERE chunk_id IN (
             SELECT id FROM buddy_knowledge_chunks WHERE document_id = $1
           )`,
          [documentId]
        );

        // Delete chunks
        await client.query(
          `DELETE FROM buddy_knowledge_chunks WHERE document_id = $1`,
          [documentId]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting embeddings:', error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default VectorDBService;
