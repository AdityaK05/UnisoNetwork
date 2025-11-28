import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { parseResume } from './resumeParser';
import VectorDBService from './vectorDB';
import { Pool } from 'pg';

interface DocumentMetadata {
  pages?: number;
  author?: string;
  title?: string;
  createdDate?: string;
  language?: string;
  documentType?: string;
}

interface IngestedDocument {
  documentId: number;
  chunkCount: number;
  totalTokens: number;
  metadata: DocumentMetadata;
}

/**
 * DocumentIngestionService - Handles document processing and embedding
 * Extracts text, chunks content, generates embeddings for RAG
 */
class DocumentIngestionService {
  private vectorDB: VectorDBService;
  private pool: Pool;

  constructor() {
    this.vectorDB = new VectorDBService();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Ingest document: extract text, chunk it, generate embeddings
   */
  async ingestDocument(
    userId: number,
    documentId: number,
    filePath: string,
    fileName: string,
    documentType: string = 'general'
  ): Promise<IngestedDocument> {
    try {
      console.log(`📥 Ingesting document: ${fileName}`);

      // Extract text based on file type
      const { text, metadata } = await this.extractTextFromFile(filePath, fileName);

      // Update document with extracted text
      await this.pool.query(
        `UPDATE buddy_documents SET extracted_text = $1, metadata = $2, is_indexed = false
         WHERE id = $3`,
        [text, JSON.stringify(metadata), documentId]
      );

      // Chunk the document
      console.log('🔪 Chunking document...');
      const chunks = await this.vectorDB.chunkDocument(text, 1024, 100);
      console.log(`✂️  Created ${chunks.length} chunks`);

      // Store chunks and generate embeddings
      console.log('🧠 Generating embeddings...');
      const chunkIds = await this.vectorDB.storeDocumentChunks(userId, documentId, chunks);

      // Mark document as indexed
      await this.pool.query(
        `UPDATE buddy_documents SET is_indexed = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [documentId]
      );

      const totalTokens = chunks.reduce((sum, chunk) => sum + Math.ceil(chunk.length / 4), 0);

      console.log(`✅ Document ingested successfully!`);
      console.log(`   - Chunks: ${chunks.length}`);
      console.log(`   - Tokens: ${totalTokens}`);

      return {
        documentId,
        chunkCount: chunks.length,
        totalTokens,
        metadata,
      };
    } catch (error) {
      console.error('❌ Error ingesting document:', error);
      throw error;
    }
  }

  /**
   * Extract text from file based on type
   */
  private async extractTextFromFile(
    filePath: string,
    fileName: string
  ): Promise<{ text: string; metadata: DocumentMetadata }> {
    const ext = path.extname(fileName).toLowerCase();

    let text = '';
    let metadata: DocumentMetadata = { documentType: 'general' };

    if (ext === '.pdf') {
      const result = await this.extractPDF(filePath);
      text = result.text;
      metadata = { ...metadata, ...result.metadata, pages: result.pages };
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await this.extractDOCX(filePath);
      text = result.text;
      metadata = { ...metadata, ...result.metadata };
    } else if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf-8');
      metadata.documentType = 'text';
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      text = JSON.stringify(parsed, null, 2);
      metadata.documentType = 'json';
    } else {
      // Try to read as plain text
      text = fs.readFileSync(filePath, 'utf-8');
    }

    // Detect document type if it's a resume
    if (fileName.toLowerCase().includes('resume') || fileName.toLowerCase().includes('cv')) {
      metadata.documentType = 'resume';
    }

    return { text, metadata };
  }

  /**
   * Extract text from PDF
   */
  private async extractPDF(
    filePath: string
  ): Promise<{ text: string; metadata: DocumentMetadata; pages: number }> {
    try {
      // Dynamic import for pdf-parse
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;

      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      return {
        text: pdfData.text || '',
        metadata: {
          title: pdfData.title || undefined,
          author: pdfData.author || undefined,
          createdDate: pdfData.createdDate || undefined,
        },
        pages: pdfData.numpages || 0,
      };
    } catch (error) {
      console.error('Error extracting PDF:', error);
      throw new Error('Failed to extract PDF text');
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractDOCX(
    filePath: string
  ): Promise<{ text: string; metadata: DocumentMetadata }> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });

      return {
        text: result.value || '',
        metadata: {},
      };
    } catch (error) {
      console.error('Error extracting DOCX:', error);
      throw new Error('Failed to extract DOCX text');
    }
  }

  /**
   * Process resume specifically
   */
  async processResume(
    userId: number,
    documentId: number,
    filePath: string,
    fileName: string
  ): Promise<IngestedDocument> {
    try {
      console.log(`📄 Processing resume: ${fileName}`);

      // Read file buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Determine file type from extension
      const ext = path.extname(fileName).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : ext === '.docx' ? 'docx' : 'pdf';

      // Parse resume
      const parsedResume = await parseResume(fileBuffer, fileType);

      // Create structured text for better RAG
      const structuredText = this.formatResumeForRAG(parsedResume);

      // Store original resume text
      await this.pool.query(
        `UPDATE buddy_documents SET extracted_text = $1, metadata = $2, is_indexed = false
         WHERE id = $3`,
        [structuredText, JSON.stringify({
          documentType: 'resume',
          parsedData: parsedResume,
        }), documentId]
      );

      // Chunk and embed
      const chunks = await this.vectorDB.chunkDocument(structuredText, 512, 50); // Smaller chunks for resume
      const chunkIds = await this.vectorDB.storeDocumentChunks(userId, documentId, chunks);

      // Mark as indexed
      await this.pool.query(
        `UPDATE buddy_documents SET is_indexed = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [documentId]
      );

      return {
        documentId,
        chunkCount: chunks.length,
        totalTokens: chunks.reduce((sum, chunk) => sum + Math.ceil(chunk.length / 4), 0),
        metadata: {
          documentType: 'resume',
        },
      };
    } catch (error) {
      console.error('Error processing resume:', error);
      throw error;
    }
  }

  /**
   * Format parsed resume into structured text for better RAG
   */
  private formatResumeForRAG(parsedResume: any): string {
    const sections: string[] = [];

    if (parsedResume.name) sections.push(`NAME: ${parsedResume.name}`);
    if (parsedResume.email) sections.push(`EMAIL: ${parsedResume.email}`);
    if (parsedResume.phone) sections.push(`PHONE: ${parsedResume.phone}`);

    if (parsedResume.summary) {
      sections.push(`\nPROFESSIONAL SUMMARY:\n${parsedResume.summary}`);
    }

    if (parsedResume.skills && parsedResume.skills.length > 0) {
      sections.push(`\nSKILLS:\n${parsedResume.skills.join(', ')}`);
    }

    if (parsedResume.experience && parsedResume.experience.length > 0) {
      sections.push(`\nEXPERIENCE:\n${parsedResume.experience.join('\n\n')}`);
    }

    if (parsedResume.education && parsedResume.education.length > 0) {
      sections.push(`\nEDUCATION:\n${parsedResume.education.join('\n\n')}`);
    }

    if (parsedResume.projects && parsedResume.projects.length > 0) {
      sections.push(`\nPROJECTS:\n${parsedResume.projects.join('\n\n')}`);
    }

    return sections.join('\n');
  }

  /**
   * Batch ingest multiple documents
   */
  async batchIngestDocuments(
    userId: number,
    documents: Array<{
      documentId: number;
      filePath: string;
      fileName: string;
      documentType?: string;
    }>
  ): Promise<IngestedDocument[]> {
    const results: IngestedDocument[] = [];

    for (const doc of documents) {
      try {
        const result =
          doc.documentType === 'resume'
            ? await this.processResume(userId, doc.documentId, doc.filePath, doc.fileName)
            : await this.ingestDocument(userId, doc.documentId, doc.filePath, doc.fileName, doc.documentType);

        results.push(result);
      } catch (error) {
        console.error(`Error ingesting ${doc.fileName}:`, error);
        // Continue with next document
      }
    }

    return results;
  }

  /**
   * Update document chunks (when document is updated)
   */
  async updateDocumentChunks(
    userId: number,
    documentId: number,
    filePath: string,
    fileName: string
  ): Promise<IngestedDocument> {
    try {
      // Delete old embeddings
      await this.vectorDB.deleteDocumentEmbeddings(documentId);

      // Re-ingest
      return await this.ingestDocument(userId, documentId, filePath, fileName);
    } catch (error) {
      console.error('Error updating document chunks:', error);
      throw error;
    }
  }

  /**
   * Get document ingestion status
   */
  async getDocumentStatus(documentId: number): Promise<{
    isIndexed: boolean;
    chunkCount: number;
    totalTokens: number;
  }> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as chunk_count, 
                SUM(c.tokens) as total_tokens,
                d.is_indexed
         FROM buddy_documents d
         LEFT JOIN buddy_knowledge_chunks c ON d.id = c.document_id
         WHERE d.id = $1
         GROUP BY d.id, d.is_indexed`,
        [documentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      const row = result.rows[0];
      return {
        isIndexed: row.is_indexed,
        chunkCount: parseInt(row.chunk_count) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
      };
    } catch (error) {
      console.error('Error getting document status:', error);
      throw error;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.vectorDB.close();
    await this.pool.end();
  }
}

export default DocumentIngestionService;
