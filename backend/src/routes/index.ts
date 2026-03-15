import { Router } from 'express';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import chatRoutes from './chat.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
