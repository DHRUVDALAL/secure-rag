import { logger } from '../utils/logger';

// Lazy-loaded singleton pipeline for local embedding generation.
// Uses Xenova/all-MiniLM-L6-v2 — 384-dimensional embeddings, runs entirely in Node.js.
let pipelineInstance: any = null;

async function getPipeline() {
  if (!pipelineInstance) {
    logger.info('Loading local embedding model Xenova/all-MiniLM-L6-v2 ...');
    const { pipeline } = await import('@xenova/transformers');
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    logger.info('Local embedding model loaded successfully');
  }
  return pipelineInstance;
}

/** Generate a single normalised embedding vector from text. */
export async function getEmbedding(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Generate embeddings for multiple texts sequentially. */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await getEmbedding(text));
  }
  return results;
}