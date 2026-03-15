import { ChunkMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface TextChunk {
  id: string;
  content: string;
  index: number;
  tokenCount: number;
  metadata: ChunkMetadata;
}

export interface ChunkingOptions {
  chunkSize?: number;      // characters per chunk
  chunkOverlap?: number;   // overlap between chunks
  tenantId: string;
  documentId: string;
  documentTitle: string;
  isConfidential?: boolean;
}

export class TextChunker {
  private defaultChunkSize = 1000;
  private defaultOverlap = 200;

  // Split text into overlapping chunks with metadata
  chunk(text: string, options: ChunkingOptions): TextChunk[] {
    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const overlap = options.chunkOverlap || this.defaultOverlap;
    const chunks: TextChunk[] = [];

    // Clean the text
    const cleanedText = this.cleanText(text);

    if (cleanedText.length === 0) {
      return [];
    }

    // Split by paragraphs first for better semantic boundaries
    const paragraphs = cleanedText.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // If adding this paragraph exceeds chunk size, save current chunk and start new one
      if (currentChunk.length + trimmedParagraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(currentChunk, chunkIndex, options));
        chunkIndex++;

        // Keep overlap from end of current chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n\n' + trimmedParagraph;
      } else {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + trimmedParagraph
          : trimmedParagraph;
      }

      // If single paragraph is larger than chunk size, split it by sentences
      if (currentChunk.length > chunkSize * 1.5) {
        const sentences = this.splitBySentences(currentChunk);
        currentChunk = '';

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(this.createChunk(currentChunk, chunkIndex, options));
            chunkIndex++;
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = overlapText + ' ' + sentence;
          } else {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
          }
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk.trim(), chunkIndex, options));
    }

    return chunks;
  }

  private createChunk(content: string, index: number, options: ChunkingOptions): TextChunk {
    const chunkId = uuidv4();
    return {
      id: chunkId,
      content: content.trim(),
      index,
      tokenCount: this.estimateTokens(content),
      metadata: {
        tenantId: options.tenantId,
        documentId: options.documentId,
        documentTitle: options.documentTitle,
        chunkId,
        chunkIndex: index,
        isConfidential: options.isConfidential || false,
      },
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')        // Normalize line endings
      .replace(/\t/g, ' ')            // Replace tabs
      .replace(/ {3,}/g, ' ')         // Collapse multiple spaces
      .replace(/\n{3,}/g, '\n\n')     // Collapse excessive newlines
      .trim();
  }

  private splitBySentences(text: string): string[] {
    // Split on sentence boundaries while preserving the delimiter
    return text
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);
  }

  // Rough token estimation (~4 chars per token for English)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export const textChunker = new TextChunker();
