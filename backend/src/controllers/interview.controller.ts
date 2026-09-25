import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { InterviewSession, IInterviewSession, IQuestionSnapshot } from '../models/InterviewSession.js';
import { FeedbackReport, IFeedbackReport } from '../models/FeedbackReport.js';
import { User } from '../models/User.js';
import { QuestionBank, IQuestionBank } from '../models/QuestionBank.js';
import { QuestionBankService } from '../services/questionBank.service.js';
import { LLMService } from '../services/llm.service.js';
import { getCache } from '../config/redis.js';
import { isMongoConnected } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { PdfReportService } from '../services/pdfReport.service.js';
import { NotificationController } from './notification.controller.js';
import { RoadmapItem } from '../models/RoadmapItem.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class InterviewController {
  /**
   * GET /api/interview/questions/search
   * Real-time search across QuestionBank by title, problem number, category, tags, or domain
   */
  static async searchQuestionBank(req: Request, res: Response): Promise<void> {
    try {
      const {
        q,
        category,
        domain,
        difficulty,
        format,
        limit = 20,
        page = 1,
      } = req.query;

      const result = await QuestionBankService.searchQuestions({
        q: q ? String(q) : undefined,
        category: category ? String(category) : undefined,
        domain: domain ? String(domain) : undefined,
        difficulty: difficulty ? String(difficulty) : undefined,
        format: format ? String(format) : undefined,
        limit: Math.min(100, Math.max(1, Number(limit) || 20)),
        page: Math.max(1, Number(page) || 1),
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error searching QuestionBank:', error);
      res.status(500).json({ error: error.message || 'Failed to search questions' });
    }
  }

  /**
   * GET /api/interview/questions/categories
   * Aggregates distinct categories with question counts and domains
   */
  static async getQuestionCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await QuestionBankService.getCategories();
      res.json({ categories });
    } catch (error: any) {
      console.error('Error fetching question categories:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve categories' });
    }
  }

  /**
   * GET /api/interview/questions/recommended
   * Returns tailored questions based on authenticated user's persona, level, and target role
   */
  static async getRecommendedQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      let userDoc: any = null;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        userDoc = await User.findById(authUserId).catch(() => null);
      }

      const userSkills = userDoc?.parsedResumeData?.extractedSkills?.length
        ? userDoc.parsedResumeData.extractedSkills
        : userDoc?.skills?.map((s: any) => s.name) || [];

      const recommended = await QuestionBankService.getRecommendedQuestions({
        userType: userDoc?.userType || 'JOB_SEEKER',
        trackLevel: userDoc?.trackLevel || userDoc?.experienceLevel || 'Senior',
        experienceLevel: userDoc?.experienceLevel || 'Senior',
        targetRole: userDoc?.targetRole || 'Software Engineer',
        skills: userSkills,
        limit: Number(req.query.limit) || 6,
      });

      res.json({ recommended });
    } catch (error: any) {
      console.error('Error fetching recommended questions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch recommendations' });
    }
  }

  /**
   * POST /api/interview/start
   * Starts an InterviewSession using selected QuestionBank questions OR dynamic Gemini LLM generation
   */
  static async startSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required. Please sign in to start a mock assessment.' });
        return;
      }

      const {
        domain = 'Frontend',
        difficulty = 'Senior',
        format = 'Hybrid',
        targetRole,
        customJobDescription,
        customTopicFocus,
        count = 3,
        questionIds,
        selectedQuestionId,
        title,
      } = req.body;

      const validUserId = new Types.ObjectId(authUserId);
      const userDoc = await User.findById(validUserId).catch(() => null);

      let sessionQuestions: any[] = [];
      let sessionTitle = title || `${difficulty} ${domain} Mock Assessment`;
      let sessionDomain = domain;
      let sessionDifficulty = difficulty;
      let sessionFormat = format;

      // Case A: User explicitly picked question(s) from QuestionBank
      const rawTargetIds = questionIds || (selectedQuestionId ? [selectedQuestionId] : []);
      const targetIdList = Array.isArray(rawTargetIds) ? rawTargetIds : [rawTargetIds];
      const uniqueIds = Array.from(
        new Set(
          targetIdList
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
            .map((id) => id.toString())
        )
      );

      if (uniqueIds.length > 0) {
        const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));
        const foundQuestions = await QuestionBank.find({ _id: { $in: objectIds } }).lean();

        if (foundQuestions.length > 0) {
          const questionMap = new Map(foundQuestions.map((q: any) => [q._id.toString(), q]));
          // Guarantee exact requested order from candidate selection
          const orderedQuestions = uniqueIds
            .map((id) => questionMap.get(id))
            .filter(Boolean) as any[];

          sessionQuestions = orderedQuestions.map((q: any) => ({
            questionId: q._id,
            problemNumber: q.problemNumber,
            title: q.title,
            questionText: q.questionText,
            domain: q.domain,
            category: q.category,
            difficulty: q.difficulty,
            format: q.format,
            expectedDurationMinutes: q.expectedDurationMinutes || 15,
            hints: q.hints || [],
            rubricCriteria: q.rubricCriteria || [],
            idealAnswerOutline: q.idealAnswerOutline || '',
            codeTemplate: q.codeTemplate,
            tags: q.tags || [],
          }));

          const firstQ = orderedQuestions[0];
          sessionDomain = firstQ.domain || domain;
          sessionDifficulty = firstQ.difficulty || difficulty;
          sessionFormat = firstQ.format || format;
          sessionTitle = title || (orderedQuestions.length === 1 ? orderedQuestions[0].title : `${firstQ.category} Assessment`);

          // Increment usageCount asynchronously
          QuestionBank.updateMany({ _id: { $in: objectIds } }, { $inc: { usageCount: 1 } }).catch(() => {});
        }
      }

      // Case B: Generate dynamic questions tailored to candidate's domain, target role, and resume skills
      if (!sessionQuestions.length) {
        let userSkills: string[] = [];
        if (userDoc?.parsedResumeData?.extractedSkills?.length) {
          userSkills = userDoc.parsedResumeData.extractedSkills;
        } else if (userDoc?.skills?.length) {
          userSkills = userDoc.skills.map((s: any) => s.name);
        }

        const generatedQuestions = await LLMService.generateQuestions({
          domain,
          difficulty,
          format,
          targetRole: targetRole || userDoc?.targetRole || 'Senior Software Engineer',
          customJobDescription,
          customTopicFocus,
          userSkills,
          count,
        });

        // Deduplicate generated questions by title and question text
        const seenQuestionKeys = new Set<string>();
        sessionQuestions = generatedQuestions
          .filter((q: any) => {
            const key = (q.title || q.questionText || '').toLowerCase().trim();
            if (seenQuestionKeys.has(key)) return false;
            seenQuestionKeys.add(key);
            return true;
          })
          .map((q: any) => ({
            problemNumber: q.problemNumber,
            title: q.title,
            questionText: q.questionText,
            domain: q.domain || domain,
            category: q.category || 'General Technical',
            difficulty: q.difficulty || difficulty,
            format: q.format || format,
            expectedDurationMinutes: q.expectedDurationMinutes || 15,
            hints: q.hints || [],
            rubricCriteria: q.rubricCriteria || [],
            idealAnswerOutline: q.idealAnswerOutline || '',
            codeTemplate: q.codeTemplate,
            tags: q.tags || [],
            source: q.source || 'LIVE_AI',
          }));
      }

      // Calculate Single Source of Truth Duration & Timestamps
      const sumQuestionsDuration = sessionQuestions.reduce(
        (acc: number, q: any) => acc + (Number(q.expectedDurationMinutes) || 15),
        0
      );
      const allocatedDurationMinutes = req.body.durationMinutes
        ? Number(req.body.durationMinutes)
        : (sumQuestionsDuration > 0 ? sumQuestionsDuration : (count * 15 || 45));

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + allocatedDurationMinutes * 60 * 1000);

      // Persist to MongoDB
      let savedSession: IInterviewSession;
      try {
        savedSession = await InterviewSession.create({
          userId: validUserId,
          title: sessionTitle,
          domain: sessionDomain,
          difficulty: sessionDifficulty,
          format: sessionFormat,
          status: 'in-progress',
          questions: sessionQuestions,
          currentQuestionIndex: 0,
          responses: [],
          customJobDescription,
          customTopicFocus,
          startedAt,
          allocatedDurationMinutes,
          expiresAt,
          totalDurationSeconds: 0,
        });
      } catch (dbError: any) {
        if (!isMongoConnected()) {
          res.status(503).json({
            error: 'Database unavailable. Please ensure MongoDB is connected to save interview sessions.',
          });
          return;
        }
        throw dbError;
      }

      // Cache session in Redis for active polling
      const cache = getCache();
      await cache.set(`session:${savedSession._id}`, JSON.stringify(savedSession.toJSON()), 'EX', 7200);

      res.status(201).json({
        message: 'Interview session initialized and persisted',
        sessionId: savedSession._id.toString(),
        session: savedSession,
      });
    } catch (error: any) {
      console.error('Error starting interview session:', error);
      res.status(500).json({ error: error.message || 'Failed to start interview' });
    }
  }

  /**
   * GET /api/interview/:sessionId
   * Retrieve active session state with user authorization verification
   */
  static async getSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.params;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Interview session not found in database' });
        return;
      }

      // User ownership check
      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to view this interview session.' });
        return;
      }

      res.json({ session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/interview/submit-response
   * Accepts text, voice transcripts, or code submissions, evaluates via LLM, and persists response to MongoDB
   */
  static async submitResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const {
        sessionId,
        questionIndex = 0,
        responseType,
        textResponse,
        codeSubmission,
        audioMetrics,
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

      // User ownership check
      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to modify this interview session.' });
        return;
      }

      if (session.status === 'completed') {
        res.status(400).json({ error: 'This interview session has already been finalized.' });
        return;
      }

      const currentQuestion = session.questions[questionIndex] || session.questions[0];

      // Call LLM Evaluator for instant multi-dimensional coaching
      const evaluationResult = await LLMService.evaluateResponse({
        questionText: currentQuestion.questionText,
        domain: currentQuestion.domain,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        format: currentQuestion.format,
        rubricCriteria: currentQuestion.rubricCriteria,
        userResponseText: textResponse,
        userSubmittedCode: codeSubmission?.code,
        codeLanguage: codeSubmission?.language,
        audioMetrics,
      });

      const responseItem = {
        questionIndex,
        questionText: currentQuestion.questionText,
        format: currentQuestion.format,
        responseType: responseType || 'text',
        textResponse: textResponse || '',
        codeSubmission,
        audioMetrics,
        timeSpentSeconds,
        instantFeedback: evaluationResult.instantFeedback,
        evaluationDetails: evaluationResult,
        submittedAt: new Date(),
      };

      // Duplicate submission protection: update if question was already submitted, or push if new
      const existingIdx = session.responses.findIndex((r) => r.questionIndex === questionIndex);
      if (existingIdx >= 0) {
        session.responses[existingIdx] = responseItem as any;
      } else {
        session.responses.push(responseItem as any);
      }

      session.currentQuestionIndex = Math.min(session.questions.length, questionIndex + 1);
      session.totalDurationSeconds += timeSpentSeconds;

      await session.save();

      // Update Redis cache
      const cache = getCache();
      await cache.set(`session:${sessionId}`, JSON.stringify(session.toJSON()), 'EX', 7200);

      const isFinished = session.responses.length >= session.questions.length;

      res.json({
        message: 'Response evaluated and saved to database',
        evaluation: evaluationResult,
        nextQuestionIndex: session.currentQuestionIndex,
        isFinished,
      });
    } catch (error: any) {
      console.error('Error submitting response:', error);
      res.status(500).json({ error: error.message || 'Evaluation failed' });
    }
  }

  /**
   * POST /api/interview/finish
   * Generates full comprehensive 360-degree feedback report and saves to MongoDB
   */
  static async finishSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.body;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing sessionId' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found in database' });
        return;
      }

      // User ownership check
      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to finish this interview session.' });
        return;
      }

      // Idempotency check: if session is already completed, return existing report
      if (session.status === 'completed' && session.feedbackReportRef) {
        const existingDoc = await FeedbackReport.findById(session.feedbackReportRef);
        if (existingDoc) {
          const feedbackJson = existingDoc.toJSON();
          res.json({
            message: 'Interview session already completed',
            report: {
              ...feedbackJson,
              reportId: existingDoc._id.toString(),
              sessionId: session._id.toString(),
            },
          });
          return;
        }
      }

      session.status = 'completed';
      session.completedAt = new Date();

      // Compute Real Assessment Results & Performance Overview
      const totalQuestionsCount = Math.max(1, session.questions?.length || 1);
      const responses = session.responses || [];

      let passedQuestionsCount = 0;
      let partialQuestionsCount = 0;
      let failedQuestionsCount = 0;
      let totalTestCasesCount = 0;
      let passedTestCasesCount = 0;
      let compileErrorsCount = 0;
      let runtimeErrorsCount = 0;
      let timeoutsCount = 0;
      const languagesUsedMap: Record<string, number> = {};

      const questionResults = session.questions.map((q: any, idx: number) => {
        const resp = responses.find((r: any) => r.questionIndex === idx);
        const topic = q.category || (q.tags && q.tags.length > 0 ? q.tags[0] : 'General');
        const problemNumber = q.problemNumber;
        const title = q.title || `Question ${idx + 1}`;
        const difficulty = q.difficulty || session.difficulty;
        const category = q.category || 'Technical';

        if (!resp) {
          const qTotalTests = q.codeTemplate?.testCases?.length || 0;
          totalTestCasesCount += qTotalTests;
          failedQuestionsCount++;
          return {
            questionIndex: idx,
            problemNumber,
            title,
            topic,
            category,
            difficulty,
            status: 'UNATTEMPTED' as const,
            statusDisplay: 'Unattempted',
            passedTestCases: 0,
            totalTestCases: qTotalTests,
            score: 0,
            timeSpentSeconds: 0,
          };
        }

        const lang = resp.codeSubmission?.language || 'javascript';
        languagesUsedMap[lang] = (languagesUsedMap[lang] || 0) + 1;

        const execStatus = resp.evaluationDetails?.executionStatus ||
          (resp.codeSubmission?.passedTestCases === resp.codeSubmission?.totalTestCases && (resp.codeSubmission?.totalTestCases || 0) > 0
            ? 'COMPLETED'
            : 'PARTIAL');

        const pTests = typeof resp.codeSubmission?.passedTestCases === 'number' ? resp.codeSubmission.passedTestCases : 0;
        const tTests = typeof resp.codeSubmission?.totalTestCases === 'number'
          ? resp.codeSubmission.totalTestCases
          : (q.codeTemplate?.testCases?.length || (pTests > 0 ? pTests : 1));

        totalTestCasesCount += tTests;
        passedTestCasesCount += pTests;

        let qStatus: 'PASSED' | 'PARTIAL' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'UNATTEMPTED' = 'PARTIAL';
        let statusDisplay = `${pTests}/${tTests} tests passed`;

        if (execStatus === 'COMPILE_ERROR') {
          qStatus = 'COMPILE_ERROR';
          statusDisplay = 'Compilation Error';
          compileErrorsCount++;
          failedQuestionsCount++;
        } else if (execStatus === 'RUNTIME_ERROR') {
          qStatus = 'RUNTIME_ERROR';
          statusDisplay = 'Runtime Error';
          runtimeErrorsCount++;
          if (pTests === 0) failedQuestionsCount++;
          else partialQuestionsCount++;
        } else if (execStatus === 'TIMEOUT') {
          qStatus = 'TIMEOUT';
          statusDisplay = 'Time Limit Exceeded';
          timeoutsCount++;
          if (pTests === 0) failedQuestionsCount++;
          else partialQuestionsCount++;
        } else if (pTests === tTests && tTests > 0) {
          qStatus = 'PASSED';
          statusDisplay = `Passed (${pTests}/${tTests} tests)`;
          passedQuestionsCount++;
        } else if (pTests > 0) {
          qStatus = 'PARTIAL';
          statusDisplay = `${pTests}/${tTests} tests passed`;
          partialQuestionsCount++;
        } else {
          qStatus = 'PARTIAL';
          statusDisplay = `0/${tTests} tests passed`;
          failedQuestionsCount++;
        }

        return {
          questionIndex: idx,
          problemNumber,
          title,
          topic,
          category,
          difficulty,
          status: qStatus,
          statusDisplay,
          passedTestCases: pTests,
          totalTestCases: tTests,
          score: typeof resp.instantFeedback?.score === 'number' ? resp.instantFeedback.score : 0,
          timeSpentSeconds: resp.timeSpentSeconds || 0,
          language: lang,
          compilerError: execStatus === 'COMPILE_ERROR' ? (resp.evaluationDetails?.errorOutput || 'SyntaxError during compilation') : undefined,
          runtimeError: execStatus === 'RUNTIME_ERROR' ? (resp.evaluationDetails?.errorOutput || 'Runtime exception') : undefined,
        };
      });

      const failedTestCasesCount = Math.max(0, totalTestCasesCount - passedTestCasesCount);
      const attemptedQuestionsCount = responses.length;
      const completedQuestionsCount = questionResults.filter((q) => q.status !== 'UNATTEMPTED').length;

      const durationUsedSeconds = session.totalDurationSeconds ||
        (session.startedAt ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000) : 0);
      const allocatedDurationSeconds = (session.allocatedDurationMinutes || 45) * 60;
      const averageTimePerCompletedQuestionSeconds = completedQuestionsCount > 0
        ? Math.round(durationUsedSeconds / completedQuestionsCount)
        : 0;

      const topicsEncountered = Array.from(new Set(questionResults.map((q) => q.topic)));

      const performanceOverview = {
        totalQuestions: totalQuestionsCount,
        attemptedQuestions: attemptedQuestionsCount,
        completedQuestions: completedQuestionsCount,
        passedQuestions: passedQuestionsCount,
        partialQuestions: partialQuestionsCount,
        failedQuestions: failedQuestionsCount,
        totalTestCases: totalTestCasesCount,
        passedTestCases: passedTestCasesCount,
        failedTestCases: failedTestCasesCount,
        compileErrorsCount,
        runtimeErrorsCount,
        timeoutsCount,
        durationUsedSeconds,
        allocatedDurationSeconds,
        averageTimePerCompletedQuestionSeconds,
        languagesUsed: languagesUsedMap,
        topicsEncountered,
        completionStatus: session.status as 'completed' | 'abandoned' | 'in-progress',
        terminationReason: session.terminationReason || null,
      };

      // Generate Topic-Level Grounded Skill Evidence
      const topicGroups: Record<string, typeof questionResults> = {};
      questionResults.forEach((q) => {
        const top = q.topic || 'General';
        if (!topicGroups[top]) topicGroups[top] = [];
        topicGroups[top].push(q);
      });

      const skillEvidence = Object.entries(topicGroups).map(([topic, qList]) => {
        const pEncountered = qList.length;
        const pPassed = qList.filter((q) => q.status === 'PASSED').length;
        const totalTests = qList.reduce((acc, q) => acc + q.totalTestCases, 0);
        const passedTests = qList.reduce((acc, q) => acc + q.passedTestCases, 0);
        const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        let status: 'DEMONSTRATED' | 'DEVELOPING' | 'NEEDS_WORK' | 'NO_EVIDENCE' = 'DEVELOPING';
        let evidenceText = '';

        if (pPassed > 0 && passRate >= 80) {
          status = 'DEMONSTRATED';
          evidenceText = `Completed ${pPassed} ${topic.toLowerCase()} problem${pPassed > 1 ? 's' : ''} with ${passRate}% test-case success.`;
        } else if (passedTests > 0) {
          status = 'DEVELOPING';
          evidenceText = `Completed ${pEncountered} ${topic.toLowerCase()} problem${pEncountered > 1 ? 's' : ''} with partial test-case success (${passedTests}/${totalTests} tests passed, failed edge cases).`;
        } else {
          status = 'NEEDS_WORK';
          evidenceText = `Encountered ${pEncountered} ${topic.toLowerCase()} problem${pEncountered > 1 ? 's' : ''} with execution or test-case failures (0/${totalTests} tests passed).`;
        }

        return {
          topic,
          category: qList[0]?.category || 'Technical',
          problemsEncountered: pEncountered,
          problemsPassed: pPassed,
          totalTestCases: totalTests,
          passedTestCases: passedTests,
          testCasePassRate: passRate,
          evidenceText,
          status,
        };
      });

      // 12 Canonical Performance Areas
      const CANONICAL_AREAS = [
        'Arrays',
        'Strings',
        'Hashing',
        'Searching',
        'Sorting',
        'Linked Lists',
        'Trees',
        'Graphs',
        'Dynamic Programming',
        'SQL',
        'System Design',
        'Programming Languages',
      ];

      const performanceAreas = CANONICAL_AREAS.map((areaName) => {
        const matchingQuestions = questionResults.filter((q) => {
          const areaLower = areaName.toLowerCase();
          const topicLower = (q.topic || '').toLowerCase();
          const catLower = (q.category || '').toLowerCase();
          const titleLower = (q.title || '').toLowerCase();
          return topicLower.includes(areaLower) || catLower.includes(areaLower) || titleLower.includes(areaLower);
        });

        if (matchingQuestions.length > 0) {
          const mAttempted = matchingQuestions.length;
          const mPassed = matchingQuestions.filter((q) => q.status === 'PASSED').length;
          const mTotalTests = matchingQuestions.reduce((acc, q) => acc + q.totalTestCases, 0);
          const mPassedTests = matchingQuestions.reduce((acc, q) => acc + q.passedTestCases, 0);
          const mSuccessRate = mTotalTests > 0 ? Math.round((mPassedTests / mTotalTests) * 100) : 0;
          const matchingEv = skillEvidence.find((e) => e.topic.toLowerCase().includes(areaName.toLowerCase()));

          return {
            area: areaName,
            hasEvidence: true,
            evidenceSummary: matchingEv?.evidenceText || `Attempted ${mAttempted} problem(s) with ${mSuccessRate}% test success rate.`,
            problemsAttempted: mAttempted,
            problemsPassed: mPassed,
            successRate: mSuccessRate,
          };
        }

        return {
          area: areaName,
          hasEvidence: false,
          evidenceSummary: 'No assessment evidence yet.',
          problemsAttempted: 0,
          problemsPassed: 0,
        };
      });

      // Generate final synthesized report via LLMService
      const fullReport = await LLMService.generateSessionReport(session);

      // Check if report already exists for this session
      let feedbackDoc = await FeedbackReport.findOne({ sessionId: session._id });

      const reportPayload = {
        sessionId: session._id,
        userId: session.userId,
        domain: session.domain,
        difficulty: session.difficulty,
        ...fullReport,
        performanceOverview,
        questionResults,
        skillEvidence,
        performanceAreas,
        questionDetails: session.responses.map((r: any, idx: number) => ({
          questionIndex: idx + 1,
          questionText: r.questionText,
          category: session.questions[idx]?.category || 'Technical',
          userResponseText: r.textResponse,
          userSubmittedCode: r.codeSubmission?.code,
          score: typeof r.instantFeedback?.score === 'number' ? r.instantFeedback.score : 0,
          technicalAccuracyScore: typeof r.instantFeedback?.technicalAccuracy === 'number' ? r.instantFeedback.technicalAccuracy : 0,
          communicationScore: typeof r.instantFeedback?.communication === 'number' ? r.instantFeedback.communication : 50,
          idealAnswerSummary: session.questions[idx]?.idealAnswerOutline || 'Standard optimal architecture',
          keyPointsCovered: r.evaluationDetails?.keyPointsCovered || ['Attempted solution requirements'],
          keyPointsMissed: r.evaluationDetails?.keyPointsMissed || ['Further complexity optimization'],
          codeReviewFeedback: r.evaluationDetails?.codeReviewFeedback,
          constructiveCritique:
            r.evaluationDetails?.constructiveCritique || 'Recorded candidate solution attempt under assessment timing constraints.',
        })),
      };

      if (feedbackDoc) {
        Object.assign(feedbackDoc, reportPayload);
        await feedbackDoc.save();
      } else {
        feedbackDoc = await FeedbackReport.create(reportPayload);
      }

      session.feedbackReportRef = feedbackDoc._id as Types.ObjectId;
      await session.save();

      // Update User aggregate statistics & Persist Assessment Evidence into MongoDB
      if (session.userId) {
        const user = await User.findById(session.userId);
        if (user) {
          user.stats.totalInterviews = (user.stats.totalInterviews || 0) + 1;
          user.stats.completedInterviews = (user.stats.completedInterviews || 0) + 1;
          const prevCompleted = user.stats.completedInterviews - 1;
          const currentTotal = (user.stats.averageScore || 0) * prevCompleted;
          user.stats.averageScore = parseFloat(((currentTotal + fullReport.overallScore) / user.stats.completedInterviews).toFixed(1));

          if (!user.stats.domainScores) user.stats.domainScores = {} as any;
          (user.stats.domainScores as any)[session.domain] = fullReport.overallScore;
          user.stats.lastActiveDate = new Date();

          // Persist verified assessment evidence to User profile
          if (!user.assessmentEvidence) user.assessmentEvidence = [];
          skillEvidence.forEach((ev) => {
            const existingIdx = user.assessmentEvidence!.findIndex(
              (e) => e.topic.toLowerCase() === ev.topic.toLowerCase()
            );
            const evidenceEntry = {
              skill: ev.topic,
              topic: ev.topic,
              category: ev.category,
              problemsAttempted: ev.problemsEncountered,
              problemsPassed: ev.problemsPassed,
              passedTestCases: ev.passedTestCases,
              totalTestCases: ev.totalTestCases,
              successRate: ev.testCasePassRate,
              evidenceText: ev.evidenceText,
              lastAssessedAt: new Date(),
              source: 'ASSESSMENT' as const,
            };

            if (existingIdx >= 0) {
              user.assessmentEvidence![existingIdx] = evidenceEntry as any;
            } else {
              user.assessmentEvidence!.push(evidenceEntry as any);
            }
          });

          await user.save();

          // Adaptive Roadmap Intelligence Loop: Hook Assessment evidence & Interview growth areas
          if (skillEvidence && skillEvidence.length > 0) {
            await AdaptiveRoadmapService.recordAssessmentResult(user._id as Types.ObjectId, skillEvidence, fullReport.overallScore);
          }
          await AdaptiveRoadmapService.recordInterviewFeedback(user._id as Types.ObjectId, session, fullReport);
        }

        // Trigger in-app notifications in MongoDB for interview completion and scorecard synthesis
        await NotificationController.createNotification({
          userId: session.userId,
          type: 'interview_completed',
          title: 'Interview Completed',
          message: `You completed the ${session.difficulty} ${session.domain} Mock Assessment.`,
          referenceId: session._id.toString(),
          referenceType: 'InterviewSession',
        });

        await NotificationController.createNotification({
          userId: session.userId,
          type: 'scorecard_ready',
          title: 'Your Scorecard Is Ready',
          message: `Your 360° scorecard for ${session.domain} is synthesized (${fullReport.overallScore}/100).`,
          referenceId: session._id.toString(),
          referenceType: 'FeedbackReport',
        });
      }

      const feedbackJson = feedbackDoc.toJSON();
      const formattedReport = {
        ...feedbackJson,
        reportId: feedbackDoc._id.toString(),
        sessionId: session._id.toString(),
      };

      res.json({
        message: 'Interview completed and master report saved to MongoDB',
        report: formattedReport,
      });
    } catch (error: any) {
      console.error('Error finishing session:', error);
      res.status(500).json({ error: error.message || 'Failed to complete session' });
    }
  }

  /**
   * GET /api/interview/feedback/:sessionId
   * Fetches persisted scorecard from MongoDB with ownership check
   */
  static async getFeedbackReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.params;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      const report = await FeedbackReport.findOne({ sessionId });
      if (!report) {
        res.status(404).json({ error: 'Feedback report not found for this session.' });
        return;
      }

      // Check ownership
      if (report.userId && report.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to view this scorecard.' });
        return;
      }

      const reportJson = report.toJSON();
      res.json({
        report: {
          ...reportJson,
          reportId: report._id.toString(),
          sessionId: report.sessionId.toString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/interview/export-pdf/:sessionId
   * Generates a high-fidelity server-side PDF scorecard report
   */
  static async exportPdfReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.params;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Interview session not found.' });
        return;
      }

      const report = await FeedbackReport.findOne({ sessionId });
      if (!report) {
        res.status(404).json({ error: 'Feedback scorecard report not found for this session.' });
        return;
      }

      // Verify ownership
      if (report.userId && report.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to export this report.' });
        return;
      }

      const user = await User.findById(authUserId);

      const pdfBuffer = await PdfReportService.generateReportPdf({
        report,
        session,
        candidateName: user?.name || 'Staff Candidate',
        candidateEmail: user?.email || '',
        targetRole: user?.targetRole || 'Senior Software Engineer',
      });

      const sanitizedDomain = session.domain.replace(/\s+/g, '_');
      const filename = `ELEVATE_AI_${sanitizedDomain}_${session.difficulty}_Scorecard_${sessionId}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate PDF report' });
    }
  }

  /**
   * POST /api/interview/share/:sessionId
   * Creates or activates a public share token for the scorecard
   */
  static async generateShareLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.params;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      const report = await FeedbackReport.findOne({ sessionId });
      if (!report) {
        res.status(404).json({ error: 'Feedback report not found for this session.' });
        return;
      }

      // Verify ownership
      if (report.userId && report.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to share this scorecard.' });
        return;
      }

      if (!report.shareId) {
        report.shareId = crypto.randomBytes(16).toString('hex');
      }

      report.shareEnabled = true;
      report.shareCreatedAt = new Date();
      report.shareRevokedAt = undefined;
      await report.save();

      // Trigger notification
      await NotificationController.createNotification({
        userId: authUserId,
        type: 'scorecard_shared',
        title: 'Scorecard Shared',
        message: `Public share link generated for your ${report.domain} assessment.`,
        referenceId: report.shareId,
        referenceType: 'FeedbackReport',
      });

      res.json({
        message: 'Scorecard share link generated successfully',
        shareId: report.shareId,
        shareUrl: `/?share=${report.shareId}`,
        shareEnabled: true,
        shareCreatedAt: report.shareCreatedAt,
      });
    } catch (error: any) {
      console.error('Share link error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate share link' });
    }
  }

  /**
   * POST /api/interview/share/:sessionId/revoke
   * Revokes an existing public share link for the scorecard
   */
  static async revokeShareLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId } = req.params;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      const report = await FeedbackReport.findOne({ sessionId });
      if (!report) {
        res.status(404).json({ error: 'Feedback report not found for this session.' });
        return;
      }

      // Verify ownership
      if (report.userId && report.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to revoke this link.' });
        return;
      }

      report.shareEnabled = false;
      report.shareRevokedAt = new Date();
      await report.save();

      res.json({
        message: 'Scorecard share link revoked successfully',
        shareEnabled: false,
        shareRevokedAt: report.shareRevokedAt,
      });
    } catch (error: any) {
      console.error('Revoke share link error:', error);
      res.status(500).json({ error: error.message || 'Failed to revoke share link' });
    }
  }

  /**
   * GET /api/public/scorecard/:shareId
   * Public read-only endpoint returning sanitized scorecard data (NO JWT required)
   */
  static async getPublicScorecard(req: Request, res: Response): Promise<void> {
    try {
      const { shareId } = req.params;

      if (!shareId || typeof shareId !== 'string' || shareId.trim().length === 0) {
        res.status(400).json({ error: 'Invalid or missing share token.' });
        return;
      }

      const report = await FeedbackReport.findOne({
        shareId: shareId.trim(),
        shareEnabled: true,
      });

      if (!report) {
        res.status(404).json({
          error: 'This scorecard is unavailable or the share link has been revoked by the owner.',
        });
        return;
      }

      let candidateDisplayName = 'Staff Candidate';
      if (report.userId) {
        const user = await User.findById(report.userId);
        if (user?.name) candidateDisplayName = user.name;
      }

      // Return strictly sanitized scorecard info (NO private account info, NO password hashes, NO emails, NO OTPs)
      res.json({
        report: {
          candidateName: candidateDisplayName,
          domain: report.domain,
          difficulty: report.difficulty,
          overallScore: report.overallScore,
          performanceTier: report.performanceTier,
          metrics: report.metrics,
          radarChartData: report.radarChartData,
          topStrengths: report.topStrengths,
          criticalGaps: report.criticalGaps,
          actionableRoadmap: report.actionableRoadmap,
          questionDetails: (report.questionDetails || []).map((q) => ({
            questionIndex: q.questionIndex,
            questionText: q.questionText,
            category: q.category,
            score: q.score,
            technicalAccuracyScore: q.technicalAccuracyScore,
            communicationScore: q.communicationScore,
            idealAnswerSummary: q.idealAnswerSummary,
            constructiveCritique: q.constructiveCritique,
            keyPointsCovered: q.keyPointsCovered,
            keyPointsMissed: q.keyPointsMissed,
          })),
          executiveSummary: report.executiveSummary,
          createdAt: report.createdAt,
          shareId: report.shareId,
        },
      });
    } catch (error: any) {
      console.error('Public scorecard error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch public scorecard' });
    }
  }

  /**
   * GET /api/interview/history
   * Fetches paginated past interview sessions for the authenticated user from MongoDB
   */
  static async getInterviewHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      if (!authUserId || !mongoose.Types.ObjectId.isValid(authUserId)) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { limit = 10, page = 1 } = req.query;
      const filter = { userId: new Types.ObjectId(authUserId) };
      const skip = (Number(page) - 1) * Number(limit);

      const [sessions, total] = await Promise.all([
        InterviewSession.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('feedbackReportRef', 'overallScore performanceTier metrics shareId shareEnabled'),
        InterviewSession.countDocuments(filter),
      ]);

      res.json({
        sessions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch interview history' });
    }
  }

  /**
   * POST /api/interview/terminate
   * Explicitly terminates / abandons an active assessment session with a specific reason:
   * 'USER_EXITED' | 'FULLSCREEN_TIMEOUT' | 'DURATION_EXPIRED'
   */
  static async terminateSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId, reason = 'USER_EXITED' } = req.body;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing sessionId' });
        return;
      }

      const session = await InterviewSession.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      // User ownership check
      if (session.userId && session.userId.toString() !== authUserId) {
        res.status(403).json({ error: 'Access denied: You do not have permission to modify this interview session.' });
        return;
      }

      // If not already completed, update status to abandoned and record termination reason
      if (session.status !== 'completed') {
        session.status = 'abandoned';
        session.terminationReason = reason;
        session.completedAt = new Date();
        await session.save();

        // Update Redis cache
        const cache = getCache();
        await cache.set(`session:${sessionId}`, JSON.stringify(session.toJSON()), 'EX', 7200);
      }

      res.json({
        message: 'Assessment session successfully terminated',
        sessionId: session._id.toString(),
        status: session.status,
        terminationReason: session.terminationReason,
      });
    } catch (error: any) {
      console.error('Error terminating assessment session:', error);
      res.status(500).json({ error: error.message || 'Failed to terminate session' });
    }
  }

  /**
   * POST /api/interview/navigate
   * Persists the active question index on the session
   */
  static async updateCurrentQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user?.userId;
      const { sessionId, questionIndex } = req.body;

      if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId' });
        return;
      }

      if (typeof questionIndex !== 'number' || questionIndex < 0) {
        res.status(400).json({ error: 'Valid questionIndex is required' });
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

      session.currentQuestionIndex = Math.min(session.questions.length - 1, questionIndex);
      await session.save();

      // Update Redis cache
      const cache = getCache();
      await cache.set(`session:${sessionId}`, JSON.stringify(session.toJSON()), 'EX', 7200);

      res.json({ success: true, currentQuestionIndex: session.currentQuestionIndex });
    } catch (error: any) {
      console.error('Error updating current question index:', error);
      res.status(500).json({ error: error.message || 'Failed to update question index' });
    }
  }
}
