import { Router } from 'express';
import { AssistantController } from '../controllers/assistant.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// POST /api/assistant/ask (Supports authenticated candidate and fallback demo context)
router.post('/ask', aiRateLimiter, optionalAuth, AssistantController.ask);
router.post('/chat', aiRateLimiter, optionalAuth, AssistantController.ask);

// GET /api/assistant/history (Retrieves user thread and dynamic suggestions)
router.get('/history', optionalAuth, AssistantController.getHistory);

// DELETE /api/assistant/history (Clears conversation history)
router.delete('/history', requireAuth, AssistantController.clearHistory);

export default router;
