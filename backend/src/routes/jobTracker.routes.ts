import { Router } from 'express';
import { JobTrackerController } from '../controllers/jobTracker.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Job Opportunity Tracking Endpoints
router.get('/', optionalAuth, JobTrackerController.getTrackedJobs);
router.get('/stats', optionalAuth, JobTrackerController.getJobStats);
router.get('/:id', optionalAuth, JobTrackerController.getTrackedJobById);
router.post('/', optionalAuth, JobTrackerController.createTrackedJob);
router.put('/:id', optionalAuth, JobTrackerController.updateTrackedJob);
router.patch('/:id', optionalAuth, JobTrackerController.updateTrackedJob);
router.delete('/:id', optionalAuth, JobTrackerController.deleteTrackedJob);
router.post('/:id/sync-roadmap', optionalAuth, JobTrackerController.syncJobToRoadmap);

export default router;
