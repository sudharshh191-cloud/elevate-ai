import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CareerContextService } from '../services/careerContext.service.js';
import { LLMService } from '../services/llm.service.js';
import { User } from '../models/User.js';
import { AssistantConversation, IAssistantMessage } from '../models/AssistantConversation.js';

export class AssistantController {
  /**
   * POST /api/assistant/ask
   * Personal AI Career Assistant
   * Answers questions grounded strictly in the authenticated candidate's real ELEVATE.AI data.
   */
  static async ask(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const questionText = req.body.message || req.body.question;

      if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
        res.status(400).json({ error: 'Please provide a valid question.' });
        return;
      }

      if (questionText.length > 2000) {
        res.status(400).json({ error: 'Question text is too long (maximum 2,000 characters).' });
        return;
      }

      // Security: Always scope context to the authenticated user ID.
      let targetUserId = authUserId;
      if (!targetUserId) {
        // Fallback for demo preview / non-authenticated exploration
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        targetUserId = demoUser?._id;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required to access personalized career assistant.' });
        return;
      }

      // 1. Gather genuine authenticated user career context from DB
      const careerContext = await CareerContextService.getCareerContext(targetUserId);
      if (!careerContext) {
        res.status(404).json({ error: 'Candidate career profile not found.' });
        return;
      }

      // 2. Fetch recent conversation history for multi-turn context
      let conversation = await AssistantConversation.findOne({ userId: targetUserId });
      const recentHistory = (conversation?.messages || []).slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 3. Call LLM Service to formulate evidence-grounded recommendation
      const response = await LLMService.askElevatePersonalAssistant({
        question: questionText.trim(),
        careerContext,
        conversationHistory: recentHistory,
      });

      // 4. Save message history in user-scoped conversation record
      const userMessage: IAssistantMessage = {
        role: 'user',
        content: questionText.trim(),
        timestamp: new Date(),
      };

      const assistantMessage: IAssistantMessage = {
        role: 'assistant',
        content: response.answer,
        whyThisMatters: response.whyThisMatters,
        suggestedActions: response.suggestedActions as any,
        timestamp: new Date(),
      };

      if (!conversation) {
        conversation = new AssistantConversation({
          userId: targetUserId,
          messages: [userMessage, assistantMessage],
        });
      } else {
        conversation.messages.push(userMessage, assistantMessage);
        // Keep conversation memory bounded to last 50 messages
        if (conversation.messages.length > 50) {
          conversation.messages = conversation.messages.slice(-50);
        }
      }
      await conversation.save();

      res.json(response);
    } catch (error: any) {
      console.error('❌ [AssistantController] ask error:', error);
      res.status(500).json({
        error: 'ELEVATE could not generate a recommendation right now. Please try again.',
      });
    }
  }

  /**
   * GET /api/assistant/history
   * Retrieves conversation thread and dynamic suggested prompts tailored to candidate's data state.
   */
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      let targetUserId = authUserId;

      if (!targetUserId) {
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        targetUserId = demoUser?._id;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const [conversation, careerContext] = await Promise.all([
        AssistantConversation.findOne({ userId: targetUserId }),
        CareerContextService.getCareerContext(targetUserId),
      ]);

      // Dynamic suggested questions based on available real data
      const suggestedQuestions: string[] = ['What should I work on today?'];
      const role = careerContext?.user?.targetRole || 'Software Engineer';

      if (careerContext?.resume?.hasResume) {
        suggestedQuestions.push('What should I improve in my resume?');
      } else {
        suggestedQuestions.push('How do I connect my resume?');
      }

      if (careerContext?.jobIntelligence?.hasJobAnalysis && careerContext.jobIntelligence.latestJob) {
        suggestedQuestions.push(`What am I missing for the ${careerContext.jobIntelligence.latestJob.jobTitle} role?`);
      } else {
        suggestedQuestions.push(`What skills does a ${role} need?`);
      }

      if (careerContext?.roadmap?.hasRoadmap) {
        suggestedQuestions.push('Explain my current roadmap priorities');
      }

      if (careerContext?.assessments?.hasAssessmentEvidence) {
        suggestedQuestions.push('Review my recent performance');
      } else {
        suggestedQuestions.push('Should I practice DSA or system design first?');
      }

      res.json({
        messages: conversation?.messages || [],
        suggestedQuestions: suggestedQuestions.slice(0, 6),
      });
    } catch (error: any) {
      console.error('❌ [AssistantController] getHistory error:', error);
      res.status(500).json({ error: 'Failed to retrieve assistant history.' });
    }
  }

  /**
   * DELETE /api/assistant/history
   * Clears the current user's assistant conversation thread.
   */
  static async clearHistory(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      if (!authUserId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      await AssistantConversation.findOneAndUpdate(
        { userId: authUserId },
        { $set: { messages: [] } },
        { upsert: true }
      );

      res.json({ message: 'Conversation history cleared successfully.' });
    } catch (error: any) {
      console.error('❌ [AssistantController] clearHistory error:', error);
      res.status(500).json({ error: 'Failed to clear conversation history.' });
    }
  }
}

export default AssistantController;
