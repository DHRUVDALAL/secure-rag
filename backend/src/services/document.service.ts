import fs from 'fs';
import path from 'path';
import prisma from '../database/prisma';
import { documentProcessor, textChunker, embeddingService, vectorStore } from '../rag';
import { DocumentProcessor } from '../rag/document-processor';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class DocumentService {
  // Upload and process a document
  async uploadDocument(
    file: Express.Multer.File,
    companyId: string,
    userId: string,
    meta: { title: string; description?: string; tags?: string[]; isConfidential?: boolean }
  ) {
    const type = DocumentProcessor.getDocumentType(file.originalname);
    const mimeType = DocumentProcessor.getMimeType(file.originalname);

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: meta.title,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType,
        type,
        status: 'PROCESSING',
        description: meta.description,
        tags: meta.tags || [],
        isConfidential: meta.isConfidential || false,
        companyId,
        uploadedById: userId,
      },
    });

    // Process asynchronously
    this.processDocument(document.id, file.path, type, companyId, meta).catch((err) => {
      logger.error('Document processing failed', { documentId: document.id, error: err });
    });

    return document;
  }

  // Background document processing pipeline
  private async processDocument(
    documentId: string,
    filePath: string,
    type: any,
    companyId: string,
    meta: { title: string; isConfidential?: boolean }
  ) {
    try {
      // 1. Extract text
      const text = await documentProcessor.extractText(filePath, type);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      // 2. Chunk the text
      const chunks = textChunker.chunk(text, {
        tenantId: companyId,
        documentId,
        documentTitle: meta.title,
        isConfidential: meta.isConfidential,
      });

      // 3. Generate embeddings
      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await embeddingService.embedTexts(chunkTexts);

      // 4. Store in vector database
      await vectorStore.addChunks(chunks, embeddings);

      // 5. Store chunks in relational DB for reference
      await prisma.$transaction(async (tx) => {
        for (const chunk of chunks) {
          await tx.documentChunk.create({
            data: {
              id: chunk.id,
              content: chunk.content,
              chunkIndex: chunk.index,
              tokenCount: chunk.tokenCount,
              metadata: chunk.metadata as any,
              documentId,
            },
          });
        }

        await tx.document.update({
          where: { id: documentId },
          data: { status: 'READY', chunkCount: chunks.length },
        });
      });

      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      logger.info('Document processed successfully', {
        documentId,
        chunkCount: chunks.length,
      });
    } catch (error: any) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', errorMessage: error.message },
      });

      // Clean up uploaded file on failure too
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw error;
    }
  }

  // Get documents for a company with pagination
  async getDocuments(
    companyId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.status) where.status = options.status;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total, page, limit };
  }

  // Get single document
  async getDocument(documentId: string, companyId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true, email: true } },
        chunks: { orderBy: { chunkIndex: 'asc' }, select: { id: true, chunkIndex: true, tokenCount: true } },
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    return document;
  }

  // Delete a document and its chunks
  async deleteDocument(documentId: string, companyId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Delete from vector store
    await vectorStore.deleteDocumentChunks(documentId);

    // Delete from database (cascades to chunks)
    await prisma.document.delete({ where: { id: documentId } });

    logger.info('Document deleted', { documentId, companyId });
    return { success: true };
  }

  // Get dashboard stats
  async getStats(companyId: string) {
    const [totalDocuments, readyDocuments, processingDocuments, failedDocuments] =
      await Promise.all([
        prisma.document.count({ where: { companyId } }),
        prisma.document.count({ where: { companyId, status: 'READY' } }),
        prisma.document.count({ where: { companyId, status: 'PROCESSING' } }),
        prisma.document.count({ where: { companyId, status: 'FAILED' } }),
      ]);

    return { totalDocuments, readyDocuments, processingDocuments, failedDocuments };
  }
}

export const documentService = new DocumentService();
