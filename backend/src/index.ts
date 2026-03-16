import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

/* TRUST PROXY (FIX FOR RENDER) */
app.set('trust proxy', 1);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for secure HTTP headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing — must run before any route-specific middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'secure-rag-backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api', routes);

// ============================================================================
// Error Handler
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

const server = app.listen(config.port, () => {
  logger.info(`🚀 SecureRAG Backend running on port ${config.port}`, {
    environment: config.nodeEnv,
    port: config.port,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

export default app;