import { Router } from 'express';
import { SystemDesignController } from '../controllers/systemDesign.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Save or update architecture diagram
router.post('/', requireAuth, SystemDesignController.saveDiagram);

// List user's saved diagrams
router.get('/', requireAuth, SystemDesignController.getDiagrams);

// Get single diagram by ID
router.get('/:id', requireAuth, SystemDesignController.getDiagramById);

// Delete diagram by ID
router.delete('/:id', requireAuth, SystemDesignController.deleteDiagram);

// Evaluate architecture diagram via Gemini AI
router.post('/evaluate', requireAuth, SystemDesignController.evaluateDiagram);

export default router;
