import { RAGQueryResponse, RAGSource } from '../types';
import { embeddingService } from './embedding.service';
import { vectorStore } from './vector-store';
import { dataMasker } from '../security/data-masker';
import { logger } from '../utils/logger';

/**
 * Local RAG chain — retrieves relevant chunks via vector search and synthesises
 * an answer entirely offline.  No external LLM API calls are made; the answer
 * is constructed directly from the retrieved document context.
 */
export class RAGChain {
  // Execute RAG pipeline: query -> embed -> retrieve -> synthesise
  async query(
    userQuery: string,
    tenantId: string,
    options: {
      topK?: number;
      userRole?: string;
      includeConfidential?: boolean;
    } = {}
  ): Promise<RAGQueryResponse> {
    const startTime = Date.now();

    try {
      // 1. Generate query embedding (local)
      const queryEmbedding = await embeddingService.embedQuery(userQuery);

      // 2. Retrieve relevant chunks (tenant-isolated)
      const results = await vectorStore.querySimilar(queryEmbedding, tenantId, {
        topK: options.topK || 5,
        includeConfidential: options.includeConfidential || false,
      });

      // 3. Synthesise answer from retrieved context
      const rawAnswer = this.synthesiseAnswer(userQuery, results);

      // 4. Mask any sensitive data in the response
      const { masked: answer } = dataMasker.mask(rawAnswer);

      // 5. Build source references
      const sources: RAGSource[] = results.documents.map((doc, i) => ({
        documentId: results.metadatas[i]?.documentId || '',
        documentTitle: results.metadatas[i]?.documentTitle || 'Unknown',
        chunkContent: doc.substring(0, 200) + (doc.length > 200 ? '...' : ''),
        chunkIndex: results.metadatas[i]?.chunkIndex || 0,
        relevanceScore: results.distances[i] ? 1 - results.distances[i] : 0,
      }));

      const latencyMs = Date.now() - startTime;

      logger.info('RAG query completed', { tenantId, latencyMs, sourcesCount: sources.length });

      return { answer, sources, tokensUsed: 0, latencyMs };
    } catch (error) {
      logger.error('RAG query failed', { error, tenantId });
      throw error;
    }
  }

  /**
   * Build a coherent answer from retrieved document chunks.
   * Groups passages by source document and presents them with citations.
   */
  private synthesiseAnswer(
    query: string,
    results: { documents: string[]; metadatas: Record<string, any>[]; distances: number[] }
  ): string {
    if (results.documents.length === 0) {
      return "I don't have enough information in the available documents to answer this question.";
    }

    // Group chunks by source document
    const byDoc = new Map<string, { title: string; passages: string[]; bestScore: number }>();
    for (let i = 0; i < results.documents.length; i++) {
      const title: string = results.metadatas[i]?.documentTitle || 'Unknown';
      const score = results.distances[i] ? 1 - results.distances[i] : 0;
      if (!byDoc.has(title)) {
        byDoc.set(title, { title, passages: [], bestScore: score });
      }
      const entry = byDoc.get(title)!;
      entry.passages.push(results.documents[i]);
      if (score > entry.bestScore) entry.bestScore = score;
    }

    // Sort sources by relevance
    const sorted = [...byDoc.values()].sort((a, b) => b.bestScore - a.bestScore);

    let answer = `Based on the available documents, here is the relevant information for your query "${query}":\n\n`;

    for (const source of sorted) {
      answer += `**${source.title}:**\n`;
      for (const passage of source.passages) {
        answer += `${passage.trim()}\n\n`;
      }
    }

    answer += `---\n*Sources: ${sorted.map((s) => s.title).join(', ')}*`;

    return answer;
  }
}

export const ragChain = new RAGChain();
