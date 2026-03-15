import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { config } from '../config';
import { ChunkMetadata } from '../types';
import { logger } from '../utils/logger';
import { TextChunk } from './text-chunker';

const COLLECTION_NAME = 'secure_rag_documents';

export class VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;

  constructor() {
    this.client = new ChromaClient({ path: config.chroma.url });
  }

  // Initialize or get the collection
  async getCollection(): Promise<Collection> {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { 'hnsw:space': 'cosine' },
      });
      logger.info('ChromaDB collection initialized', { name: COLLECTION_NAME });
    }
    return this.collection;
  }

  // Store document chunks with their embeddings
  async addChunks(chunks: TextChunk[], embeddings: number[][]): Promise<void> {
    const collection = await this.getCollection();

    if (chunks.length === 0) return;

    // ChromaDB has a batch limit, process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batchEmbeddings = embeddings.slice(i, i + batchSize);

      await collection.add({
        ids: batchChunks.map((c) => c.id),
        embeddings: batchEmbeddings,
        documents: batchChunks.map((c) => c.content),
        metadatas: batchChunks.map((c) => ({
          tenantId: c.metadata.tenantId,
          documentId: c.metadata.documentId,
          documentTitle: c.metadata.documentTitle,
          chunkIndex: c.metadata.chunkIndex,
          isConfidential: c.metadata.isConfidential ? 'true' : 'false',
        })),
      });
    }

    logger.info('Chunks stored in vector DB', { count: chunks.length });
  }

  // Query similar chunks with tenant isolation
  async querySimilar(
    queryEmbedding: number[],
    tenantId: string,
    options: {
      topK?: number;
      includeConfidential?: boolean;
    } = {}
  ): Promise<{
    documents: string[];
    metadatas: Record<string, any>[];
    distances: number[];
  }> {
    const collection = await this.getCollection();
    const topK = options.topK || 5;

    // Build filter with mandatory tenant isolation
    const whereFilter: Record<string, any> = { tenantId };

    // Optionally exclude confidential documents
    if (!options.includeConfidential) {
      whereFilter['isConfidential'] = 'false';
    }

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: whereFilter,
      include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
    });

    return {
      documents: (results.documents?.[0] || []) as string[],
      metadatas: (results.metadatas?.[0] || []) as Record<string, any>[],
      distances: (results.distances?.[0] || []) as number[],
    };
  }

  // Delete all chunks for a specific document
  async deleteDocumentChunks(documentId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.delete({ where: { documentId } });
    logger.info('Document chunks deleted from vector DB', { documentId });
  }

  // Delete all chunks for a tenant
  async deleteTenantData(tenantId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.delete({ where: { tenantId } });
    logger.info('Tenant data deleted from vector DB', { tenantId });
  }
}

export const vectorStore = new VectorStore();
