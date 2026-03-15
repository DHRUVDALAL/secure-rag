import { Request } from "express";
import { UserRole } from "@prisma/client";

/*
|--------------------------------------------------------------------------
| User Roles
|--------------------------------------------------------------------------
*/

export { UserRole };

/*
|--------------------------------------------------------------------------
| Auth Types
|--------------------------------------------------------------------------
*/

export interface AuthUser {
  userId: string;
  companyId: string;
  role: UserRole;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: any;
}

/*
|--------------------------------------------------------------------------
| Security Scan
|--------------------------------------------------------------------------
*/

export interface SecurityScanResult {
  safe?: boolean;
  isSafe: boolean;
  threats: string[];
  issues?: string[];
  sanitizedInput?: string;
}

/*
|--------------------------------------------------------------------------
| RAG Source
|--------------------------------------------------------------------------
*/

export interface RAGSource {
  documentId: string;
  documentName?: string;
  documentTitle?: string;
  chunk?: string;
  chunkContent?: string;
  chunkIndex?: number;
  relevanceScore?: number;
}

/*
|--------------------------------------------------------------------------
| RAG Query Response
|--------------------------------------------------------------------------
*/

export interface RAGQueryResponse {
  answer: string;
  sources: RAGSource[];
  tokensUsed?: number;
  latencyMs?: number;
}

/*
|--------------------------------------------------------------------------
| Vector Metadata
|--------------------------------------------------------------------------
*/

export interface ChunkMetadata {
  documentId: string;
  tenantId?: string;
  companyId?: string;
  documentTitle?: string;
  chunkId?: string;
  chunkIndex?: number;
  source?: string;
  isConfidential?: boolean;
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface Pagination {
  page: number;
  limit: number;
}