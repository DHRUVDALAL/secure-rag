import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { auditService } from '../security/audit.service';
import { documentService } from '../services/document.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;

      const [docStats, securitySummary] = await Promise.all([
        documentService.getStats(companyId),
        auditService.getSecuritySummary(companyId),
      ]);

      sendSuccess(res, { documents: docStats, security: securitySummary });
    } catch (error) {
      next(error);
    }
  }

  async auditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, suspiciousOnly, userId } = req.query;
      const result = await auditService.getQueryLogs(req.user!.companyId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        suspiciousOnly: suspiciousOnly === 'true',
        userId: userId as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
