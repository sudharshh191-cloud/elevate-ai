import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Analytics & Dashboard endpoints (supports authenticated user or active session)
router.get('/dashboard', optionalAuth, AnalyticsController.getDashboardAnalytics);
router.post('/ask-elevate', optionalAuth, AnalyticsController.askElevateAssistant);
// Job Intelligence Endpoints
router.post('/analyze-job', optionalAuth, AnalyticsController.analyzeJobDescription);
router.post('/job-match', optionalAuth, AnalyticsController.analyzeJobDescription);
router.get('/recent-jobs', optionalAuth, AnalyticsController.getRecentJobAnalyses);
router.get('/recent-jobs/:id', optionalAuth, AnalyticsController.getJobAnalysisById);
router.delete('/recent-jobs/:id', optionalAuth, AnalyticsController.deleteJobAnalysis);

// Adaptive Career Roadmap Endpoints
router.get('/roadmap', optionalAuth, AnalyticsController.getRoadmap);
router.post('/roadmap/generate', optionalAuth, AnalyticsController.generateOrRefreshRoadmap);
router.post('/roadmap/refresh', optionalAuth, AnalyticsController.generateOrRefreshRoadmap);
router.post('/roadmap/add-gap', optionalAuth, AnalyticsController.addJobGapToRoadmap);
router.put('/roadmap/:id', optionalAuth, AnalyticsController.updateRoadmapItem);
router.delete('/roadmap/:id', optionalAuth, AnalyticsController.deleteRoadmapItem);

export default router;
