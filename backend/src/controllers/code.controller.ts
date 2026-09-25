import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { CodeExecutionService } from '../services/codeExecution.service.js';
import { LLMService } from '../services/llm.service.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class CodeController {
  /**
   * POST /api/code/execute
   * Executes candidate code inside the secure isolated sandbox against sample/custom test cases
   */
  static async executeCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required to execute code.' });
        return;
      }

      const {
        sessionId,
        questionIndex = 0,
        language = 'typescript',
        code,
        testCases,
      } = req.body;

      let finalTestCases = testCases;

      // If sessionId is supplied, check session and extract question template test cases
      if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
        const session = await InterviewSession.findById(sessionId);
        if (session) {
          if (session.userId && session.userId.toString() !== authUserId) {
            res.status(403).json({ error: 'Access denied: You do not have permission to execute code in this session.' });
            return;
          }
          if (!finalTestCases || !finalTestCases.length) {
            const currentQ = session.questions[questionIndex] || session.questions[0];
            if (currentQ?.codeTemplate?.testCases?.length) {
              finalTestCases = currentQ.codeTemplate.testCases.map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: false,
              }));
            }
          }
        }
      }

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        res.status(400).json({ error: 'Code cannot be empty.' });
        return;
      }

      if (code.length > 50000) {
        res.status(400).json({ error: 'Code exceeds maximum allowed size (50,000 characters).' });
        return;
      }

      const normalizedLang = CodeExecutionService.normalizeLanguage(language);
      const supportedLanguages = CodeExecutionService.getSupportedLanguages();
      if (!supportedLanguages.includes(normalizedLang)) {
        res.status(400).json({
          error: `Runtime execution for '${language}' is not supported. Currently supported: Python, JavaScript, TypeScript, Java, C++, C.`,
          supportedLanguages,
        });
        return;
      }

      const executionResult = await CodeExecutionService.executeCode({
        userId: authUserId,
        sessionId: (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) ? new Types.ObjectId(sessionId) : undefined,
        questionIndex,
        language: normalizedLang,
        code,
        testCases: finalTestCases,
        isSubmission: false,
      });

      res.json(executionResult);
    } catch (error: any) {
      console.error('Error in CodeController.executeCode:', error);
      res.status(500).json({
        error: error.message || 'An error occurred during code sandbox execution.',
        status: 'EXECUTION_ERROR',
      });
    }
  }

  /**
   * POST /api/code/submit
   * Submits final solution, executes against complete test suite, calculates score & algorithmic critique
   */
  static async submitCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required to submit code.' });
        return;
      }

      const {
        sessionId,
        questionIndex = 0,
        language = 'typescript',
        code,
        customTestCases,
        timeSpentSeconds = 120,
      } = req.body;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing sessionId' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to submit code in this session.' });
        return;
      }

      if (session.status === 'completed') {
        res.status(400).json({ error: 'This interview session has already been finalized.' });
        return;
      }

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        res.status(400).json({ error: 'Submitted code cannot be empty.' });
        return;
      }

      if (code.length > 50000) {
        res.status(400).json({ error: 'Submitted code exceeds maximum allowed size (50,000 characters).' });
        return;
      }

      const normalizedLang = CodeExecutionService.normalizeLanguage(language);
      const currentQ = session.questions[questionIndex] || session.questions[0];

      // 1. Run full official test suite
      let testCases = (customTestCases && customTestCases.length > 0)
        ? customTestCases
        : (currentQ?.codeTemplate?.testCases || []);
      if (!testCases.length) {
        testCases = [{ input: '', expectedOutput: '' }];
      }

      const executionResult = await CodeExecutionService.executeCode({
        userId: authUserId,
        sessionId,
        questionIndex,
        language: normalizedLang,
        code,
        testCases,
        isSubmission: true,
      });

      // 2. Compute algorithmic score strictly based on real execution status and test pass ratio
      let testScore = 0;
      let finalScore = 0;

      // 3. AI Code Review & Feedback Evaluation
      const evaluationResult = await LLMService.evaluateResponse({
        questionText: currentQ.questionText,
        domain: currentQ.domain,
        category: currentQ.category,
        difficulty: currentQ.difficulty,
        format: currentQ.format,
        rubricCriteria: currentQ.rubricCriteria,
        userResponseText: `Code Implementation in ${normalizedLang.toUpperCase()}`,
        userSubmittedCode: code,
        codeLanguage: normalizedLang,
      });

      if (executionResult.status === 'COMPILE_ERROR') {
        testScore = 0;
        finalScore = Math.min(20, Math.round((evaluationResult.score || 70) * 0.2));
        evaluationResult.score = finalScore;
        evaluationResult.technicalAccuracyScore = 0;
        if (evaluationResult.instantFeedback) {
          evaluationResult.instantFeedback.score = finalScore;
          evaluationResult.instantFeedback.technicalAccuracy = 0;
          if (!evaluationResult.instantFeedback.improvements) evaluationResult.instantFeedback.improvements = [];
          evaluationResult.instantFeedback.improvements.unshift('Resolve syntax / compilation errors to allow code execution');
          evaluationResult.instantFeedback.coachNote = `Code failed compilation: ${executionResult.errorOutput?.slice(0, 150) || 'Syntax error'}`;
        }
      } else if (executionResult.status === 'TIMEOUT') {
        testScore = Math.round((executionResult.passedTests / Math.max(1, executionResult.totalTests)) * 40);
        finalScore = Math.min(40, testScore + Math.round((evaluationResult.score || 70) * 0.2));
        evaluationResult.score = finalScore;
        evaluationResult.technicalAccuracyScore = testScore;
        if (evaluationResult.instantFeedback) {
          evaluationResult.instantFeedback.score = finalScore;
          evaluationResult.instantFeedback.technicalAccuracy = testScore;
          if (!evaluationResult.instantFeedback.improvements) evaluationResult.instantFeedback.improvements = [];
          evaluationResult.instantFeedback.improvements.unshift('Optimize algorithmic time complexity to prevent execution timeout (> 5s)');
          evaluationResult.instantFeedback.coachNote = 'Time Limit Exceeded (> 5s). Ensure your solution avoids infinite loops or non-terminating recursion.';
        }
      } else if (executionResult.status === 'RUNTIME_ERROR') {
        testScore = Math.round((executionResult.passedTests / Math.max(1, executionResult.totalTests)) * 60);
        finalScore = Math.round(testScore * 0.7 + (evaluationResult.score || 70) * 0.3);
        evaluationResult.score = finalScore;
        evaluationResult.technicalAccuracyScore = testScore;
        if (evaluationResult.instantFeedback) {
          evaluationResult.instantFeedback.score = finalScore;
          evaluationResult.instantFeedback.technicalAccuracy = testScore;
          if (!evaluationResult.instantFeedback.improvements) evaluationResult.instantFeedback.improvements = [];
          evaluationResult.instantFeedback.improvements.unshift(`Fix runtime exceptions: ${executionResult.errorOutput?.slice(0, 100) || 'Unhandled error'}`);
          evaluationResult.instantFeedback.coachNote = 'A runtime exception occurred during test execution. Inspect error stack traces and boundary conditions.';
        }
      } else {
        // Status COMPLETED (All or partial tests executed)
        testScore = Math.round((executionResult.passedTests / Math.max(1, executionResult.totalTests)) * 100);
        finalScore = Math.round(testScore * 0.7 + (evaluationResult.score || 70) * 0.3);
        evaluationResult.score = finalScore;
        evaluationResult.technicalAccuracyScore = Math.round(testScore * 0.8 + (evaluationResult.technicalAccuracyScore || 80) * 0.2);
        if (evaluationResult.instantFeedback) {
          evaluationResult.instantFeedback.score = finalScore;
          evaluationResult.instantFeedback.technicalAccuracy = evaluationResult.technicalAccuracyScore;
        }
      }

      const responseItem = {
        questionIndex,
        questionText: currentQ.questionText,
        format: currentQ.format,
        responseType: 'code' as const,
        textResponse: `Executed ${executionResult.passedTests}/${executionResult.totalTests} test cases passed. Status: ${executionResult.status}`,
        codeSubmission: {
          code,
          language: normalizedLang,
          executionOutput: executionResult.rawOutput || executionResult.errorOutput || '',
          passedTestCases: executionResult.passedTests,
          totalTestCases: executionResult.totalTests,
        },
        timeSpentSeconds,
        instantFeedback: evaluationResult.instantFeedback,
        evaluationDetails: {
          ...evaluationResult,
          executionResult,
        },
        submittedAt: new Date(),
      };

      const existingIdx = session.responses.findIndex((r) => r.questionIndex === questionIndex);
      if (existingIdx >= 0) {
        session.responses[existingIdx] = responseItem as any;
      } else {
        session.responses.push(responseItem as any);
      }

      session.currentQuestionIndex = Math.min(session.questions.length, questionIndex + 1);
      session.totalDurationSeconds += timeSpentSeconds;

      await session.save();

      // Trigger Adaptive Roadmap updates
      try {
        await AdaptiveRoadmapService.recordCodingPractice(authUserId, {
          questionTitle: currentQ.questionText,
          category: (currentQ as any).category || (currentQ as any).topic || 'Algorithms',
          passedTests: executionResult.passedTests,
          totalTests: executionResult.totalTests,
          status: executionResult.status,
          language: normalizedLang,
        });
      } catch (err: any) {
        console.error('Error recording coding practice in AdaptiveRoadmap:', err);
      }

      const isFinished = session.responses.length >= session.questions.length;

      res.json({
        success: true,
        message: 'Code submission evaluated and persisted',
        executionResult,
        evaluation: evaluationResult,
        score: finalScore,
        passedTests: executionResult.passedTests,
        totalTests: executionResult.totalTests,
        isFinished,
        nextQuestionIndex: session.currentQuestionIndex,
      });
    } catch (error: any) {
      console.error('Error in CodeController.submitCode:', error);
      res.status(500).json({ error: error.message || 'Code submission evaluation failed' });
    }
  }

  /**
   * POST /api/code/draft
   * Autosaves candidate in-progress code draft
   */
  static async saveDraft(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { sessionId, questionIndex = 0, language, code } = req.body;
      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!session.drafts) {
        session.drafts = {};
      }
      session.drafts[String(questionIndex)] = {
        code: code || '',
        language: language || 'typescript',
        updatedAt: new Date(),
      };
      session.markModified('drafts');
      await session.save();

      res.json({ success: true, saved: true, timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
