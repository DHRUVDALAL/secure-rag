import { UserRole } from '@prisma/client';
import { Request } from 'express';

// Authenticated user payload attached to requests
export interface AuthUser {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

// Extend Express Request
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// API response envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Document upload metadata
export interface DocumentUploadMeta {
  title: string;
  description?: string;
  tags?: string[];
  isConfidential?: boolean;
}

// RAG query request
export interface RAGQueryRequest {
  query: string;
  topK?: number;
  includeSource?: boolean;
}

// RAG query response
export interface RAGQueryResponse {
  answer: string;
  sources: RAGSource[];
  tokensUsed: number;
  latencyMs: number;
}

// Source document reference
export interface RAGSource {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  chunkIndex: number;
  relevanceScore: number;
}

// Chunk metadata stored in vector DB
export interface ChunkMetadata {
  tenantId: string;
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkIndex: number;
  isConfidential: boolean;
}

// Security scan result
export interface SecurityScanResult {
  isSafe: boolean;
  threats: string[];
  sanitizedInput?: string;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
