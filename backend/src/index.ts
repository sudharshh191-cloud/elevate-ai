import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { connectDB, getDbStatus } from './config/db.js';
import { getRedisStatus } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import codeRoutes from './routes/code.routes.js';
import systemDesignRoutes from './routes/systemDesign.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import userSettingsRoutes from './routes/userSettings.routes.js';
import assistantRoutes from './routes/assistant.routes.js';
import jobTrackerRoutes from './routes/jobTracker.routes.js';
import { InterviewController } from './controllers/interview.controller.js';
import { LLMService } from './services/llm.service.js';

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoints (both /health and /api/health)
const healthHandler = (req: express.Request, res: express.Response) => {
  const dbStatus = getDbStatus();
  const redisStatus = getRedisStatus();
  const llmStatus = LLMService.getLlmStatus();

  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'ELEVATE.AI Backend API Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      engine: 'MongoDB',
      ...dbStatus,
    },
    cache: {
      engine: 'Redis',
      ...redisStatus,
    },
    llm: llmStatus,
    version: '2.0.0-production',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Phase 4 Public Scorecard Route (Accessible without JWT)
app.get('/api/public/scorecard/:shareId', InterviewController.getPublicScorecard);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/jobs', jobTrackerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user/settings', userSettingsRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Sanitized Error Handler (Production-Hardened: Never leaks internal stack traces or paths)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [Unhandled Server Error]:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'An unexpected platform error occurred. Please try again.' : (err.message || 'Internal Server Error'),
  });
});

import { AuthController } from './controllers/auth.controller.js';
import { QuestionBankService } from './services/questionBank.service.js';

// Initialize DB & Start Server
const startServer = async () => {
  await connectDB();
  await AuthController.seedDemoUserIfMissing();
  await QuestionBankService.seedQuestionBankIfEmpty();

  app.listen(ENV.PORT, () => {
    console.log(`🚀 AI Interview Engine Backend running on port ${ENV.PORT}`);
    console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${ENV.PORT}/api/health`);
  });
};

startServer();

export default app;
