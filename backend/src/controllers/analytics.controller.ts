import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { User } from '../models/User.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';
import { RoadmapItem } from '../models/RoadmapItem.js';
import { LLMService } from '../services/llm.service.js';
import { CareerContextService } from '../services/careerContext.service.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Gathers 100% real, user-specific data from MongoDB across:
   * 1. Profile & Onboarding context
   * 2. Practice & Code execution logs (Coding Arena)
   * 3. Parsed Resume data & ATS skills (Resume Hub)
   * 4. Mock Interview sessions & Feedback reports
   * 5. System Design Studio diagrams
   * 6. Real chronological activity timeline
   * 7. Real dynamic "ELEVATE TODAY" next steps
   */
  static async getDashboardAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const targetUserId = authUserId || req.query.userId;

      let validUserId: Types.ObjectId | undefined;
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId as string)) {
        validUserId = new Types.ObjectId(targetUserId as string);
      } else {
        const defaultUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (defaultUser) validUserId = defaultUser._id as Types.ObjectId;
      }

      if (!validUserId) {
        res.status(401).json({ error: 'User not authenticated or found' });
        return;
      }

      const user = await User.findById(validUserId);
      if (!user) {
        res.status(404).json({ error: 'User account not found' });
        return;
      }

      // Fetch all real activity across the 4 modules concurrently
      const [codeLogs, sessions, reports, diagrams] = await Promise.all([
        CodeExecutionLog.find({ userId: validUserId }).sort({ createdAt: -1 }).limit(20),
        InterviewSession.find({ userId: validUserId }).sort({ createdAt: -1 }).limit(10).populate('feedbackReportRef'),
        FeedbackReport.find({ userId: validUserId }).sort({ createdAt: -1 }).limit(10),
        SystemDesignDiagram.find({ userId: validUserId }).sort({ updatedAt: -1 }).limit(10),
      ]);

      // 1. Practice & Coding Metrics
      const totalExecutions = codeLogs.length;
      const passedExecutions = codeLogs.filter((l) => l.status === 'passed').length;
      const failedExecutions = codeLogs.filter((l) => l.status !== 'passed').length;
      const passRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0;

      const languageCounts: Record<string, number> = {};
      codeLogs.forEach((log) => {
        const lang = log.language || 'typescript';
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });

      const recentCodeExecutions = codeLogs.slice(0, 5).map((log) => ({
        id: log._id.toString(),
        language: log.language,
        status: log.status,
        testCasesPassed: log.testCasesPassed,
        totalTestCases: log.totalTestCases,
        executionTimeMs: log.executionTimeMs,
        createdAt: log.createdAt,
      }));

      // 2. Career Profile / Resume Data
      const resume = user.parsedResumeData;
      const hasResume = Boolean(
        user.resumeUrl ||
        (resume && resume.extractedSkills && resume.extractedSkills.length > 0)
      );

      const careerProfile = {
        hasResume,
        summary: resume?.summary || '',
        extractedSkills: resume?.extractedSkills || [],
        resumeSkills: resume?.extractedSkills || [],
        skillsCount: resume?.extractedSkills?.length || 0,
        atsScore: typeof resume?.atsScore === 'number' ? resume.atsScore : null,
        targetRoleMatch: typeof resume?.targetRoleMatch === 'number' ? resume.targetRoleMatch : null,
        experienceYears: typeof resume?.experienceYears === 'number' ? resume.experienceYears : null,
        recommendedFocusAreas: resume?.recommendedFocusAreas || [],
        resumeUrl: user.resumeUrl || null,
        assessmentEvidence: user.assessmentEvidence || [],
        hasAssessmentEvidence: Boolean(user.assessmentEvidence && user.assessmentEvidence.length > 0),
        lastUpdated: user.updatedAt,
      };

      // 3. Mock Interviews & Reports
      const completedInterviews = sessions.filter((s) => s.status === 'completed').length;
      const avgInterviewScore =
        reports.length > 0
          ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length)
          : null;

      const recentInterviews = sessions.slice(0, 5).map((s) => {
        const report = s.feedbackReportRef as any;
        return {
          id: s._id.toString(),
          title: s.title,
          domain: s.domain,
          date: s.createdAt,
          duration: `${Math.max(1, Math.round((s.totalDurationSeconds || 0) / 60))} mins`,
          score: report?.overallScore ?? null,
          verdict: report?.performanceTier ?? null,
          status: s.status,
        };
      });

      // 4. System Design Studio
      const recentDiagrams = diagrams.slice(0, 5).map((d) => ({
        id: d._id.toString(),
        title: d.templateTitle,
        domain: d.domain,
        difficulty: d.difficulty,
        nodeCount: d.nodes?.length || 0,
        updatedAt: d.updatedAt,
      }));

      // 5. Activity Dates & Streak Calculation
      const activityTimestamps: Date[] = [
        ...codeLogs.map((l) => l.createdAt),
        ...sessions.map((s) => s.createdAt),
        ...diagrams.map((d) => d.updatedAt),
      ];
      if (hasResume && user.updatedAt) {
        activityTimestamps.push(user.updatedAt);
      }

      // Calculate active days streak
      let calculatedStreak = 0;
      if (activityTimestamps.length > 0) {
        const uniqueDayStrings = Array.from(
          new Set(
            activityTimestamps.map((d) => new Date(d).toISOString().split('T')[0])
          )
        ).sort().reverse();

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        // Check if most recent is today or yesterday
        if (uniqueDayStrings.length > 0 && (uniqueDayStrings[0] === todayStr || uniqueDayStrings[0] === yesterdayStr)) {
          let curr = new Date(uniqueDayStrings[0]);
          calculatedStreak = 1;
          for (let i = 1; i < uniqueDayStrings.length; i++) {
            const prev = new Date(curr);
            prev.setDate(prev.getDate() - 1);
            const expectedStr = prev.toISOString().split('T')[0];
            if (uniqueDayStrings[i] === expectedStr) {
              calculatedStreak++;
              curr = prev;
            } else {
              break;
            }
          }
        }
      }

      // 6. Chronological Unified Activity Timeline
      const activityEvents: Array<{
        id: string;
        type: 'coding' | 'interview' | 'resume' | 'system-design';
        title: string;
        description: string;
        timestamp: Date;
        badge?: string;
        badgeColor?: string;
      }> = [];

      codeLogs.slice(0, 10).forEach((l) => {
        activityEvents.push({
          id: `code_${l._id}`,
          type: 'coding',
          title: `Code Executed: ${l.language.toUpperCase()}`,
          description: l.status === 'passed' 
            ? `Passed all ${l.totalTestCases} test cases in ${l.executionTimeMs || 0}ms`
            : `Execution result: ${l.status} (${l.testCasesPassed}/${l.totalTestCases} passed)`,
          timestamp: l.createdAt,
          badge: l.status === 'passed' ? 'PASSED' : 'ATTEMPTED',
          badgeColor: l.status === 'passed' ? 'emerald' : 'amber',
        });
      });

      sessions.slice(0, 5).forEach((s) => {
        const rep = s.feedbackReportRef as any;
        activityEvents.push({
          id: `session_${s._id}`,
          type: 'interview',
          title: `Mock Interview: ${s.title}`,
          description: s.status === 'completed'
            ? `Completed in ${Math.round(s.totalDurationSeconds / 60)}m • Score: ${rep?.overallScore ?? 'N/A'}/100`
            : `Assessment started (${s.status})`,
          timestamp: s.createdAt,
          badge: s.status === 'completed' ? `${rep?.overallScore || 0}%` : 'IN PROGRESS',
          badgeColor: s.status === 'completed' ? 'indigo' : 'slate',
        });
      });

      diagrams.slice(0, 5).forEach((d) => {
        activityEvents.push({
          id: `diagram_${d._id}`,
          type: 'system-design',
          title: `Architecture: ${d.templateTitle}`,
          description: `Designed ${d.nodes?.length || 0} system components (${d.domain} • ${d.difficulty})`,
          timestamp: d.updatedAt,
          badge: 'STUDIO',
          badgeColor: 'violet',
        });
      });

      if (hasResume) {
        activityEvents.push({
          id: `resume_${user._id}`,
          type: 'resume',
          title: 'Resume Analyzed in Hub',
          description: `${careerProfile.skillsCount} technical skills parsed • ATS Score: ${careerProfile.atsScore ?? 'Evaluated'}`,
          timestamp: user.updatedAt,
          badge: 'RESUME',
          badgeColor: 'blue',
        });
      }

      // Sort timeline descending by timestamp
      activityEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 7. Dynamic Real Action Next Steps (ELEVATE TODAY)
      const todayActions: Array<{
        id: string;
        title: string;
        subtitle: string;
        category: 'practice' | 'resume' | 'interview' | 'system-design' | 'onboarding';
        actionLabel: string;
        targetTab: 'arena' | 'resume' | 'system-design' | 'analytics';
        priority: 'high' | 'medium' | 'normal';
      }> = [];

      if (!user.onboardingCompleted) {
        todayActions.push({
          id: 'act_onboarding',
          title: 'Complete Your Career Target Profile',
          subtitle: 'Choose your role and track level to get personalized coding challenges and rubrics.',
          category: 'onboarding',
          actionLabel: 'Complete Profile',
          targetTab: 'analytics',
          priority: 'high',
        });
      }

      if (!hasResume) {
        todayActions.push({
          id: 'act_resume',
          title: 'Upload & Analyze Your Resume',
          subtitle: 'Extract skills, benchmark your profile for target roles, and discover high-impact gaps.',
          category: 'resume',
          actionLabel: 'Open Resume Hub',
          targetTab: 'resume',
          priority: 'high',
        });
      }

      if (passedExecutions === 0) {
        todayActions.push({
          id: 'act_first_code',
          title: `Solve Your First ${user.targetRole || 'Engineering'} Problem`,
          subtitle: 'Jump into the Coding Arena to write, run, and benchmark test cases in real-time.',
          category: 'practice',
          actionLabel: 'Start Practice',
          targetTab: 'arena',
          priority: hasResume ? 'high' : 'medium',
        });
      } else {
        todayActions.push({
          id: 'act_continue_code',
          title: `Continue Coding Practice (${user.targetRole || 'Technical'} Track)`,
          subtitle: `You have solved ${passedExecutions} problem${passedExecutions > 1 ? 's' : ''}. Sharpen your execution speed on core algorithms.`,
          category: 'practice',
          actionLabel: 'Enter Coding Arena',
          targetTab: 'arena',
          priority: 'high',
        });
      }

      if (completedInterviews === 0) {
        todayActions.push({
          id: 'act_mock_interview',
          title: 'Test Yourself in a Mock Technical Arena',
          subtitle: 'Experience a 60-minute interactive technical round with real code execution and rubrics.',
          category: 'interview',
          actionLabel: 'Launch Assessment',
          targetTab: 'arena',
          priority: 'medium',
        });
      }

      if (diagrams.length === 0) {
        todayActions.push({
          id: 'act_system_design',
          title: 'Design a Distributed System Architecture',
          subtitle: 'Draft microservices, databases, and message queues in the System Design Studio.',
          category: 'system-design',
          actionLabel: 'Open Design Studio',
          targetTab: 'system-design',
          priority: 'normal',
        });
      }

      // Final Response
      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          userType: user.userType,
          targetRole: user.targetRole,
          trackLevel: user.trackLevel,
          onboardingCompleted: user.onboardingCompleted,
          streakDays: calculatedStreak,
        },
        progressCounters: {
          codingProblemsSolved: passedExecutions,
          codingSubmissionsTotal: totalExecutions,
          codingPassRate: passRate,
          resumesAnalyzed: hasResume ? 1 : 0,
          mockInterviewsCompleted: completedInterviews,
          mockInterviewsTotal: sessions.length,
          systemDesignDiagrams: diagrams.length,
          streakDays: calculatedStreak,
        },
        practice: {
          totalExecutions,
          passedExecutions,
          failedExecutions,
          passRate,
          languagesUsed: languageCounts,
          recentCodeExecutions,
        },
        careerProfile,
        interviews: {
          total: sessions.length,
          completed: completedInterviews,
          averageScore: avgInterviewScore,
          recentInterviews,
        },
        systemDesign: {
          total: diagrams.length,
          recentDiagrams,
        },
        todayActions: todayActions.slice(0, 3),
        recentActivity: activityEvents.slice(0, 10),
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/analytics/ask-elevate
   * Interactive AI Career & Preparation Assistant
   */
  static async askElevateAssistant(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const questionText = req.body.message || req.body.question;

      if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
        res.status(400).json({ error: 'Please provide a valid question.' });
        return;
      }

      let targetUserId = authUserId;
      if (!targetUserId) {
        const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
        targetUserId = demoUser?._id;
      }

      if (!targetUserId) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const careerContext = await CareerContextService.getCareerContext(targetUserId);
      if (!careerContext) {
        res.status(404).json({ error: 'Career profile not found.' });
        return;
      }

      const response = await LLMService.askElevatePersonalAssistant({
        question: questionText.trim(),
        careerContext,
      });

      res.json(response);
    } catch (error: any) {
      console.error('❌ [AnalyticsController] askElevateAssistant error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/analytics/analyze-job
   * Analyzes job description against candidate profile, resume, and platform activity
   */
  static async analyzeJobDescription(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const { jobDescription, jobTitle, company } = req.body;

      if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
        res.status(400).json({ error: 'Please provide a detailed job description (minimum 20 characters).' });
        return;
      }

      if (jobDescription.length > 30000) {
        res.status(400).json({ error: 'Job description text exceeds maximum limit (30,000 characters).' });
        return;
      }

      let user = null;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        user = await User.findById(authUserId);
      } else {
        user = await User.findOne({ email: 'demo@ai-interview.io' });
      }

      if (!user) {
        res.status(404).json({ error: 'User profile not found.' });
        return;
      }

      // Gather candidate platform evidence concurrently
      const [codeLogs, sessions, diagrams] = await Promise.all([
        CodeExecutionLog.find({ userId: user._id, status: 'passed' }).limit(30),
        InterviewSession.find({ userId: user._id, status: 'completed' }).limit(10),
        SystemDesignDiagram.find({ userId: user._id }).limit(10),
      ]);

      const passedExecutions = codeLogs.length;
      const languagesUsed = Array.from(new Set(codeLogs.map((c) => c.language).filter(Boolean)));
      const completedInterviews = sessions.length;
      const domainsTested = Array.from(new Set(sessions.map((s) => s.domain).filter(Boolean)));
      const diagramsCount = diagrams.length;

      const response = await LLMService.analyzeJobDescription({
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle?.trim() || undefined,
        company: company?.trim() || undefined,
        targetRole: user.targetRole,
        userType: user.userType,
        trackLevel: user.trackLevel,
        experienceYears: user.parsedResumeData?.experienceYears,
        userSkills: (user.skills || []).map((s) => s.name),
        resumeSkills: user.parsedResumeData?.extractedSkills || [],
        userSummary: user.parsedResumeData?.summary || user.bio,
        experience: user.experience,
        projects: user.projects,
        certifications: user.certifications,
        codingStats: {
          passedExecutions,
          languagesUsed,
        },
        interviewStats: {
          completedInterviews,
          domainsTested,
        },
        systemDesignStats: {
          diagramsCount,
        },
      });

      // Persist analysis to user's recentJobAnalyses (capped at 15 items)
      const newAnalysisItem = {
        jobTitle: response.jobTitle,
        company: response.company,
        jobDescription: jobDescription.trim().slice(0, 5000), // Keep snippet for re-inspection
        matchScore: response.matchScore,
        requiredSkills: response.requiredSkills || [],
        preferredSkills: response.preferredSkills || [],
        strongMatchingSkills: response.strongMatchingSkills || [],
        skillsToDevelop: response.skillsToDevelop || [],
        categorizedRequirements: response.categorizedRequirements || [],
        evidenceBreakdown: response.evidenceBreakdown || [],
        gaps: response.gaps || [],
        nextSteps: response.nextSteps || [],
        likelyInterviewTopics: response.likelyInterviewTopics || [],
        preparationStrategy: response.preparationStrategy || [],
        overview: response.overview || '',
        createdAt: new Date(),
      };

      if (!user.recentJobAnalyses) {
        user.recentJobAnalyses = [];
      }

      user.recentJobAnalyses.unshift(newAnalysisItem as any);
      if (user.recentJobAnalyses.length > 15) {
        user.recentJobAnalyses = user.recentJobAnalyses.slice(0, 15);
      }

      await user.save();

      // Trigger Adaptive Roadmap Intelligence Loop for new job gaps
      const jobMissingSkills = (response as any).missingSkills || response.skillsToDevelop || [];
      if (jobMissingSkills && jobMissingSkills.length > 0) {
        try {
          await AdaptiveRoadmapService.recordJobIntelligence(user._id as any, {
            jobTitle: jobTitle || response.jobTitle,
            company: company || response.company,
            missingSkills: jobMissingSkills,
            requiredSkills: response.requiredSkills || [],
          });
        } catch (err: any) {
          console.warn('⚠️ [AnalyticsController] Roadmap sync for job gaps skipped:', err.message);
        }
      }

      const savedId = user.recentJobAnalyses[0]?._id?.toString();

      res.json({
        ...response,
        analysisId: savedId,
        savedAt: newAnalysisItem.createdAt,
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] analyzeJobDescription error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/analytics/recent-jobs
   * Returns authenticated user's recent job analyses
   */
  static async getRecentJobAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      let user = null;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        user = await User.findById(authUserId);
      } else {
        user = await User.findOne({ email: 'demo@ai-interview.io' });
      }

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const recent = (user.recentJobAnalyses || []).sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      res.json({
        analyses: recent,
        total: recent.length,
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] getRecentJobAnalyses error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/analytics/recent-jobs/:id
   * Returns a specific saved job analysis for the authenticated user
   */
  static async getJobAnalysisById(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const { id } = req.params;

      let user = null;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        user = await User.findById(authUserId);
      } else {
        user = await User.findOne({ email: 'demo@ai-interview.io' });
      }

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const analysis = user.recentJobAnalyses?.find((a: any) => a._id?.toString() === id);
      if (!analysis) {
        res.status(404).json({ error: 'Job analysis not found or not owned by user.' });
        return;
      }

      res.json({ analysis });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] getJobAnalysisById error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/analytics/recent-jobs/:id
   * Deletes a specific saved job analysis for the authenticated user
   */
  static async deleteJobAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const { id } = req.params;

      let user = null;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        user = await User.findById(authUserId);
      } else {
        user = await User.findOne({ email: 'demo@ai-interview.io' });
      }

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      user.recentJobAnalyses = (user.recentJobAnalyses || []).filter((a: any) => a._id?.toString() !== id);
      await user.save();

      res.json({ message: 'Job analysis deleted successfully' });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] deleteJobAnalysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/analytics/roadmap/add-gap
   * Seamlessly turns a Job Intelligence gap into an existing Adaptive Roadmap item
   */
  static async addJobGapToRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      let validUserId: Types.ObjectId | undefined;
      if (authUserId && mongoose.Types.ObjectId.isValid(authUserId)) {
        validUserId = new Types.ObjectId(authUserId);
      } else {
        const defaultUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (defaultUser) validUserId = defaultUser._id as Types.ObjectId;
      }

      if (!validUserId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { skill, category, reason, jobTitle, company, actionTarget } = req.body;
      if (!skill || typeof skill !== 'string') {
        res.status(400).json({ error: 'Skill name is required' });
        return;
      }

      const user = await User.findById(validUserId);
      const targetRole = user?.targetRole || 'Software Engineer';
      const cleanSkill = skill.trim();
      const { title, category: autoCategory, focusTopic } = AdaptiveRoadmapService.normalizeSkill(cleanSkill);

      // Check if item already exists in candidate's roadmap using normalization
      const existing = await AdaptiveRoadmapService.findEquivalentItem(validUserId, cleanSkill);

      const evidenceLine = jobTitle
        ? `Required by ${jobTitle}${company ? ` at ${company}` : ''}`
        : 'Required by target job description';

      if (existing) {
        if (!existing.evidence.includes(evidenceLine)) {
          existing.evidence.push(evidenceLine);
        }
        existing.source = 'JOB_DESCRIPTION';
        existing.priority = 'HIGH';
        if (reason) existing.reason = reason;
        if (actionTarget) existing.actionTarget = actionTarget;
        existing.lastUpdatedReason = `Updated from Job Intelligence gap addition for ${jobTitle || 'target job'}`;
        existing.updatedAt = new Date();
        await existing.save();

        res.json({
          message: `Updated existing plan for ${cleanSkill}`,
          roadmapItem: existing,
          isNew: false,
        });
        return;
      }

      // Determine appropriate category
      let mappedCategory: any = autoCategory || 'Programming';
      if (category) {
        const catLower = category.toLowerCase();
        if (catLower.includes('cloud') || catLower.includes('infra')) mappedCategory = 'Cloud';
        else if (catLower.includes('data') || catLower.includes('sql') || catLower.includes('db')) mappedCategory = 'SQL';
        else if (catLower.includes('system') || catLower.includes('architecture')) mappedCategory = 'System Design';
        else if (catLower.includes('frontend')) mappedCategory = 'Frontend';
        else if (catLower.includes('backend')) mappedCategory = 'Backend';
        else if (catLower.includes('devops')) mappedCategory = 'DevOps';
        else if (catLower.includes('dsa') || catLower.includes('algorithm')) mappedCategory = 'DSA';
      }

      const count = await RoadmapItem.countDocuments({ userId: validUserId });

      const newItem = await RoadmapItem.create({
        userId: validUserId,
        targetRole,
        title,
        category: mappedCategory,
        priority: 'HIGH',
        status: 'NOT_STARTED',
        reason:
          reason ||
          `Required by target job posting: ${jobTitle || targetRole}. Closing this gap will elevate candidate match readiness.`,
        evidence: [evidenceLine],
        source: 'JOB_DESCRIPTION',
        recommendedActions: [
          `Review core ${focusTopic} patterns and documentation`,
          `Solve practical benchmark challenges in the Practice Arena`,
          `Demonstrate ${focusTopic} implementation in technical interview scenarios`,
        ],
        actionTarget: actionTarget || {
          type: mappedCategory === 'System Design' ? 'system-design' : 'arena',
          label: mappedCategory === 'System Design' ? 'Design Architecture' : 'Practice',
          focusTopic,
        },
        order: count,
        lastUpdatedReason: `Added from Job Intelligence gap addition for ${jobTitle || 'target role'}`,
      });

      res.status(201).json({
        message: `Added ${cleanSkill} to your Adaptive Roadmap`,
        roadmapItem: newItem,
        isNew: true,
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] addJobGapToRoadmap error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Helper to gather verified telemetry parameters for roadmap generation
   */
  private static async buildRoadmapParams(userId: Types.ObjectId, extraJdGaps?: string[]) {
    const user = await User.findById(userId);
    if (!user) return null;

    const [codeLogs, sessions, reports, diagrams] = await Promise.all([
      CodeExecutionLog.find({ userId }).sort({ createdAt: -1 }).limit(30),
      InterviewSession.find({ userId, status: 'completed' }).sort({ createdAt: -1 }).limit(10),
      FeedbackReport.find({ userId }).sort({ createdAt: -1 }).limit(10),
      SystemDesignDiagram.find({ userId }).sort({ updatedAt: -1 }).limit(10),
    ]);

    const totalExecutions = codeLogs.length;
    const passedExecutions = codeLogs.filter((l) => l.status === 'passed').length;
    const failedExecutions = codeLogs.filter((l) => l.status !== 'passed').length;
    const passRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0;
    const languagesUsed = Array.from(new Set(codeLogs.map((l) => l.language).filter(Boolean)));

    const completedInterviews = sessions.length;
    const averageScore =
      reports.length > 0
        ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length)
        : null;

    const growthAreas: string[] = [];
    reports.forEach((r) => {
      if (Array.isArray(r.criticalGaps)) {
        growthAreas.push(...r.criticalGaps);
      }
      if (Array.isArray(r.actionableRoadmap)) {
        r.actionableRoadmap.forEach((a) => {
          if (a.topic) growthAreas.push(a.topic);
        });
      }
    });

    return {
      targetRole: user.targetRole || 'Software Engineer',
      trackLevel: user.trackLevel || 'Intermediate',
      userType: user.userType || 'JOB_SEEKER',
      experienceYears: user.parsedResumeData?.experienceYears,
      extractedSkills: user.parsedResumeData?.extractedSkills || [],
      recommendedFocusAreas: user.parsedResumeData?.recommendedFocusAreas || [],
      jdSkillGaps: extraJdGaps || [],
      codingStats: {
        totalExecutions,
        passedExecutions,
        failedExecutions,
        passRate,
        languagesUsed,
      },
      interviewStats: {
        completedInterviews,
        averageScore,
        growthAreas: Array.from(new Set(growthAreas)),
        domainsTested: Array.from(new Set(sessions.map((s) => s.domain))),
      },
      systemDesignStats: {
        diagramsCount: diagrams.length,
        componentsUsed: Array.from(new Set(diagrams.flatMap((d) => d.components || []))),
        weaknesses: [],
      },
    };
  }

  /**
   * GET /api/analytics/roadmap
   * Fetches persisted adaptive roadmap items for the candidate
   */
  static async getRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const targetUserId = authUserId || req.query.userId;

      let validUserId: Types.ObjectId | undefined;
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId as string)) {
        validUserId = new Types.ObjectId(targetUserId as string);
      } else {
        const defaultUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (defaultUser) validUserId = defaultUser._id as Types.ObjectId;
      }

      if (!validUserId) {
        res.status(401).json({ error: 'User not authenticated or found' });
        return;
      }

      const sortedItems = await AdaptiveRoadmapService.getRoadmap(validUserId);

      res.json({
        roadmapItems: sortedItems,
        total: sortedItems.length,
        inProgressCount: sortedItems.filter((i) => i.status === 'IN_PROGRESS').length,
        completedCount: sortedItems.filter((i) => i.status === 'COMPLETED').length,
        notStartedCount: sortedItems.filter((i) => i.status === 'NOT_STARTED').length,
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] getRoadmap error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/analytics/roadmap/generate
   * Generates or refreshes the candidate's roadmap without losing user completion state
   */
  static async generateOrRefreshRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const targetUserId = authUserId || req.body?.userId;

      let validUserId: Types.ObjectId | undefined;
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId as string)) {
        validUserId = new Types.ObjectId(targetUserId as string);
      } else {
        const defaultUser = await User.findOne({ email: 'demo@ai-interview.io' });
        if (defaultUser) validUserId = defaultUser._id as Types.ObjectId;
      }

      if (!validUserId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { jdSkillGaps } = req.body || {};
      const sortedItems = await AdaptiveRoadmapService.refreshRoadmap(validUserId, jdSkillGaps);

      res.json({
        message: 'Roadmap refreshed successfully',
        roadmapItems: sortedItems,
        total: sortedItems.length,
        inProgressCount: sortedItems.filter((i) => i.status === 'IN_PROGRESS').length,
        completedCount: sortedItems.filter((i) => i.status === 'COMPLETED').length,
        notStartedCount: sortedItems.filter((i) => i.status === 'NOT_STARTED').length,
      });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] generateOrRefreshRoadmap error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/analytics/roadmap/:id
   * Updates status ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') or ordering
   */
  static async updateRoadmapItem(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const { id } = req.params;
      const { status, order } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Valid roadmap item ID is required.' });
        return;
      }

      const item = await RoadmapItem.findById(id);
      if (!item) {
        res.status(404).json({ error: 'Roadmap item not found.' });
        return;
      }

      // Security check: ensure item belongs to authenticated user
      if (authUserId && !item.userId.equals(new Types.ObjectId(authUserId))) {
        res.status(403).json({ error: 'Unauthorized to modify this roadmap item.' });
        return;
      }

      if (status && ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
        item.status = status;
        if (status === 'COMPLETED') {
          item.completedAt = new Date();
        } else {
          item.completedAt = undefined;
        }
      }

      if (typeof order === 'number') {
        item.order = order;
      }

      await item.save();
      res.json({ message: 'Roadmap item updated successfully', roadmapItem: item });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] updateRoadmapItem error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/analytics/roadmap/:id
   * Deletes a specific roadmap item scoped to authenticated user
   */
  static async deleteRoadmapItem(req: Request, res: Response): Promise<void> {
    try {
      const authUserId = (req as any).user?.userId;
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Valid roadmap item ID is required.' });
        return;
      }

      const item = await RoadmapItem.findById(id);
      if (!item) {
        res.status(404).json({ error: 'Roadmap item not found.' });
        return;
      }

      // Security check: ensure item belongs to authenticated user
      if (authUserId && !item.userId.equals(new Types.ObjectId(authUserId))) {
        res.status(403).json({ error: 'Unauthorized to delete this roadmap item.' });
        return;
      }

      await RoadmapItem.findByIdAndDelete(id);
      res.json({ message: 'Roadmap item removed successfully' });
    } catch (error: any) {
      console.error('❌ [AnalyticsController] deleteRoadmapItem error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
