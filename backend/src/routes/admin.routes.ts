import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, enforceTenant, requireAdmin);

router.get('/dashboard', (req, res, next) => adminController.dashboard(req as any, res, next));
router.get('/audit-logs', (req, res, next) => adminController.auditLogs(req as any, res, next));

export default router;
