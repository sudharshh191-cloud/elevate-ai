import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Phase 4 Public Scorecard Endpoint (NO Auth Required)
router.get('/public/scorecard/:shareId', InterviewController.getPublicScorecard);

// Question Bank Endpoints (Placed before /:sessionId)
router.get('/questions/search', InterviewController.searchQuestionBank);
router.get('/questions/categories', InterviewController.getQuestionCategories);
router.get('/questions/recommended', requireAuth, InterviewController.getRecommendedQuestions);

// Protected Interview Assessment Routes
router.post('/start', requireAuth, InterviewController.startSession);
router.get('/history', requireAuth, InterviewController.getInterviewHistory);
router.get('/:sessionId', requireAuth, InterviewController.getSession);
router.post('/submit-response', requireAuth, InterviewController.submitResponse);
router.post('/navigate', requireAuth, InterviewController.updateCurrentQuestion);
router.post('/finish', requireAuth, InterviewController.finishSession);
router.post('/terminate', requireAuth, InterviewController.terminateSession);
router.get('/feedback/:sessionId', requireAuth, InterviewController.getFeedbackReport);

// Phase 4 PDF Export & Scorecard Sharing Endpoints
router.get('/export-pdf/:sessionId', requireAuth, InterviewController.exportPdfReport);
router.post('/share/:sessionId', requireAuth, InterviewController.generateShareLink);
router.post('/share/:sessionId/revoke', requireAuth, InterviewController.revokeShareLink);

export default router;
