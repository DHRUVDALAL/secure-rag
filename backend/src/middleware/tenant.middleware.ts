import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Ensures all requests are scoped to the authenticated user's tenant
export function enforceTenant(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user?.companyId) {
    return next(new UnauthorizedError('Tenant context not established'));
  }

  // Prevent tenant ID spoofing via query params or body
  const bodyTenantId = req.body?.companyId || req.body?.tenantId;
  const paramTenantId = req.params?.companyId;

  if (bodyTenantId && bodyTenantId !== req.user.companyId) {
    logger.warn('Tenant spoofing attempt detected', {
      userId: req.user.userId,
      claimedTenant: bodyTenantId,
      actualTenant: req.user.companyId,
    });
    return next(new ForbiddenError('Cross-tenant access denied'));
  }

  if (paramTenantId && paramTenantId !== req.user.companyId) {
    logger.warn('Tenant spoofing via URL params detected', {
      userId: req.user.userId,
      claimedTenant: paramTenantId,
      actualTenant: req.user.companyId,
    });
    return next(new ForbiddenError('Cross-tenant access denied'));
  }

  next();
}
