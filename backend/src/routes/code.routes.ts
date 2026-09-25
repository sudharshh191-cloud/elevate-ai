import { Router } from 'express';
import { CodeController } from '../controllers/code.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { codeExecutionRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Protected: Execute code in isolated sandbox (Run Code)
router.post('/execute', codeExecutionRateLimiter, requireAuth, CodeController.executeCode);

// Protected: Submit code solution (Submit Code)
router.post('/submit', codeExecutionRateLimiter, requireAuth, CodeController.submitCode);

// Protected: Autosave draft code
router.post('/draft', requireAuth, CodeController.saveDraft);

export default router;
