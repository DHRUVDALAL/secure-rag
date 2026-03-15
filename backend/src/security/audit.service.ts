import prisma from '../database/prisma';
import { logger } from '../utils/logger';

interface AuditLogEntry {
  userId: string;
  companyId: string;
  query: string;
  response?: string;
  sourceDocs?: any[];
  tokenCount?: number;
  latencyMs?: number;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  blocked?: boolean;
}

export class AuditService {
  // Record a query log
  async logQuery(entry: AuditLogEntry) {
    try {
      const log = await prisma.queryLog.create({
        data: {
          userId: entry.userId,
          companyId: entry.companyId,
          query: entry.query,
          response: entry.response,
          sourceDocs: entry.sourceDocs || [],
          tokenCount: entry.tokenCount || 0,
          latencyMs: entry.latencyMs || 0,
          isSuspicious: entry.isSuspicious || false,
          suspiciousReason: entry.suspiciousReason,
          blocked: entry.blocked || false,
        },
      });

      if (entry.isSuspicious) {
        logger.warn('Suspicious query logged', {
          logId: log.id,
          userId: entry.userId,
          companyId: entry.companyId,
          reason: entry.suspiciousReason,
        });
      }

      return log;
    } catch (error) {
      logger.error('Failed to write audit log', { error, entry });
      // Don't throw - audit logging should not break the main flow
    }
  }

  // Get query logs for a company with pagination
  async getQueryLogs(
    companyId: string,
    options: { page?: number; limit?: number; suspiciousOnly?: boolean; userId?: string }
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.suspiciousOnly) where.isSuspicious = true;
    if (options.userId) where.userId = options.userId;

    const [logs, total] = await Promise.all([
      prisma.queryLog.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.queryLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  // Get security summary for dashboard
  async getSecuritySummary(companyId: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalQueries, suspiciousQueries, blockedQueries, recentQueries] = await Promise.all([
      prisma.queryLog.count({ where: { companyId } }),
      prisma.queryLog.count({ where: { companyId, isSuspicious: true } }),
      prisma.queryLog.count({ where: { companyId, blocked: true } }),
      prisma.queryLog.count({ where: { companyId, createdAt: { gte: last24h } } }),
    ]);

    return {
      totalQueries,
      suspiciousQueries,
      blockedQueries,
      queriesLast24h: recentQueries,
    };
  }
}

export const auditService = new AuditService();
