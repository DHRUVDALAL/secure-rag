import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, enforceTenant);

router.get('/', requireAdmin, (req, res, next) => userController.list(req as any, res, next));
router.post('/', requireAdmin, (req, res, next) => userController.add(req as any, res, next));
router.get('/:id', requireAdmin, (req, res, next) => userController.get(req as any, res, next));
router.patch('/:id/role', requireAdmin, (req, res, next) =>
  userController.updateRole(req as any, res, next)
);
router.delete('/:id', requireAdmin, (req, res, next) =>
  userController.deactivate(req as any, res, next)
);

export default router;
