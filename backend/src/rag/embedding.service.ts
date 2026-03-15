import { getEmbedding, getEmbeddings } from '../services/localEmbedding.service';
import { logger } from '../utils/logger';

export class EmbeddingService {
  // Generate embeddings for multiple texts using local MiniLM model
  async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await getEmbeddings(texts);
      logger.info('Generated local embeddings', { count: texts.length });
      return embeddings;
    } catch (error) {
      logger.error('Embedding generation failed', { error });
      throw error;
    }
  }

  // Generate embedding for a single query
  async embedQuery(query: string): Promise<number[]> {
    try {
      return await getEmbedding(query);
    } catch (error) {
      logger.error('Query embedding failed', { error });
      throw error;
    }
  }
}

export const embeddingService = new EmbeddingService();
