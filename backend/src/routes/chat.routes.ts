import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requireEmployee } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, enforceTenant);

router.post('/query', requireEmployee, (req, res, next) =>
  chatController.query(req as any, res, next)
);
router.get('/history', requireEmployee, (req, res, next) =>
  chatController.history(req as any, res, next)
);

export default router;
