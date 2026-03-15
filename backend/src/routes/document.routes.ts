import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { enforceTenant } from '../middleware/tenant.middleware';
import { requireManager } from '../middleware/rbac.middleware';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not supported. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});

const router = Router();

// All routes require authentication and tenant enforcement
router.use(authenticate, enforceTenant);

router.post('/', requireManager, upload.single('file'), (req, res, next) =>
  documentController.upload(req as any, res, next)
);
router.get('/', (req, res, next) => documentController.list(req as any, res, next));
router.get('/stats', (req, res, next) => documentController.stats(req as any, res, next));
router.get('/:id', (req, res, next) => documentController.get(req as any, res, next));
router.delete('/:id', requireManager, (req, res, next) =>
  documentController.delete(req as any, res, next)
);

export default router;
