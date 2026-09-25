import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';
import { LLMService } from '../services/llm.service.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class SystemDesignController {
  /**
   * POST /api/system-design
   * Saves or updates a candidate's system design diagram in MongoDB
   */
  static async saveDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required to save architecture designs.' });
        return;
      }

      const {
        id,
        problemId = 'url-shortener',
        templateTitle = 'Custom System Architecture',
        domain = 'System Design',
        difficulty = 'Senior',
        trafficEstimation,
        trafficConfig,
        calculatedMetrics,
        nodes = [],
        edges = [],
        components = [],
        notes = '',
        validationResults = [],
      } = req.body;

      let diagramDoc: any = null;

      if (id && mongoose.Types.ObjectId.isValid(id)) {
        diagramDoc = await SystemDesignDiagram.findById(id);
        if (diagramDoc) {
          // Ownership verification
          if (diagramDoc.userId && diagramDoc.userId.toString() !== authUserId) {
            res.status(403).json({ error: 'Access denied: You cannot modify another user’s design.' });
            return;
          }

          diagramDoc.problemId = problemId;
          diagramDoc.templateTitle = templateTitle;
          diagramDoc.domain = domain;
          diagramDoc.difficulty = difficulty;
          diagramDoc.trafficEstimation = trafficEstimation;
          diagramDoc.trafficConfig = trafficConfig;
          diagramDoc.calculatedMetrics = calculatedMetrics;
          diagramDoc.nodes = nodes;
          diagramDoc.edges = edges;
          diagramDoc.components = components;
          diagramDoc.notes = notes;
          diagramDoc.validationResults = validationResults;
          diagramDoc.version = (diagramDoc.version || 1) + 1;
          await diagramDoc.save();
        }
      }

      if (!diagramDoc) {
        diagramDoc = await SystemDesignDiagram.create({
          userId: new Types.ObjectId(authUserId),
          problemId,
          templateTitle,
          domain,
          difficulty,
          trafficEstimation,
          trafficConfig,
          calculatedMetrics,
          nodes,
          edges,
          components,
          notes,
          validationResults,
          version: 1,
        });
      }

      res.status(200).json({
        message: 'Architecture design saved successfully',
        diagram: diagramDoc,
      });
    } catch (error: any) {
      console.error('Error in saveDiagram:', error);
      res.status(500).json({ error: error.message || 'Failed to save system design diagram' });
    }
  }

  /**
   * GET /api/system-design
   * Lists all saved diagrams for the authenticated candidate
   */
  static async getDiagrams(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const diagrams = await SystemDesignDiagram.find({
        userId: new Types.ObjectId(authUserId),
      }).sort({ updatedAt: -1 });

      res.json({ diagrams });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch diagrams' });
    }
  }

  /**
   * GET /api/system-design/:id
   * Fetches a single diagram by ID with ownership verification
   */
  static async getDiagramById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid diagram ID' });
        return;
      }

      const diagram = await SystemDesignDiagram.findById(id);
      if (!diagram) {
        res.status(404).json({ error: 'System design diagram not found.' });
        return;
      }

      // Ownership verification
      if (diagram.userId && diagram.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to view this design.' });
        return;
      }

      res.json({ diagram });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch diagram' });
    }
  }

  /**
   * DELETE /api/system-design/:id
   * Deletes a saved diagram with ownership verification
   */
  static async deleteDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid diagram ID' });
        return;
      }

      const diagram = await SystemDesignDiagram.findById(id);
      if (!diagram) {
        res.status(404).json({ error: 'System design diagram not found.' });
        return;
      }

      if (diagram.userId && diagram.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to delete this design.' });
        return;
      }

      await SystemDesignDiagram.deleteOne({ _id: id });
      res.json({ message: 'Architecture design deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete diagram' });
    }
  }

  /**
   * POST /api/system-design/evaluate
   * Evaluates the candidate's architecture graph via Gemini LLM
   */
  static async evaluateDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required to evaluate architecture designs.' });
        return;
      }

      const {
        problemTitle = 'Distributed System Architecture',
        requirements,
        nodes = [],
        edges = [],
        trafficConfig,
        calculatedMetrics,
        validationWarnings = [],
        diagramId,
      } = req.body;

      if (!nodes || nodes.length === 0) {
        res.status(400).json({ error: 'Please add at least one component to the canvas before evaluation.' });
        return;
      }

      // Evaluate via Gemini LLM Service
      const evaluation = await LLMService.evaluateSystemDesign({
        problemTitle,
        requirements,
        nodes,
        edges,
        trafficConfig,
        calculatedMetrics,
        validationWarnings,
      });

      // Optionally attach evaluation result to saved diagram in MongoDB
      if (diagramId && mongoose.Types.ObjectId.isValid(diagramId)) {
        const diagram = await SystemDesignDiagram.findById(diagramId);
        if (diagram && diagram.userId.toString() === authUserId) {
          diagram.evaluation = evaluation;
          await diagram.save();
        }
      }

      // Update adaptive roadmap based on system design evaluation evidence
      try {
        await AdaptiveRoadmapService.recordSystemDesignEvaluation(
          authUserId,
          evaluation,
          problemTitle
        );
      } catch (err: any) {
        console.error('Error updating roadmap from system design evaluation:', err);
      }

      res.json({
        message: 'Architecture evaluated successfully',
        evaluation,
      });
    } catch (error: any) {
      console.error('Error in evaluateDiagram:', error);
      res.status(500).json({ error: error.message || 'Failed to evaluate architecture' });
    }
  }
}
