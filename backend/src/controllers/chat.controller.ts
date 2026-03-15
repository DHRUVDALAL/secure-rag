import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types';
import { ragChain } from '../rag';
import { promptGuard } from '../security/prompt-guard';
import { auditService } from '../security/audit.service';
import { sendSuccess, sendError } from '../utils/response';
import { SecurityThreatError } from '../utils/errors';
import { logger } from '../utils/logger';

const querySchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.number().min(1).max(20).optional().default(5),
});

export class ChatController {
  async query(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query, topK } = querySchema.parse(req.body);
      const { userId, companyId, role } = req.user!;

      // 1. Security scan the input
      const scanResult = promptGuard.scan(query);

      if (!scanResult.isSafe) {
        // Log the suspicious query
        await auditService.logQuery({
          userId,
          companyId,
          query,
          isSuspicious: true,
          suspiciousReason: scanResult.threats.join(', '),
          blocked: true,
        });

        throw new SecurityThreatError(
          'Your query was blocked due to a security policy violation. Please rephrase your question.'
        );
      }

      // 2. Determine if user can access confidential docs
      const includeConfidential = role === 'ADMIN' || role === 'MANAGER';

      // 3. Execute RAG pipeline
      const result = await ragChain.query(query, companyId, {
        topK,
        userRole: role,
        includeConfidential,
      });

      // 4. Audit log the query
      await auditService.logQuery({
        userId,
        companyId,
        query,
        response: result.answer,
        sourceDocs: result.sources,
        tokenCount: result.tokensUsed,
        latencyMs: result.latencyMs,
        isSuspicious: false,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await auditService.getQueryLogs(req.user!.companyId, {
        userId: req.user!.role === 'ADMIN' ? undefined : req.user!.userId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
