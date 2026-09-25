import mongoose, { Types } from 'mongoose';
import { User, IUser } from '../models/User.js';
import { RoadmapItem, IRoadmapItem } from '../models/RoadmapItem.js';
import { CodeExecutionLog } from '../models/CodeExecutionLog.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { SystemDesignDiagram } from '../models/SystemDesignDiagram.js';

export interface ICareerContext {
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
    targetRole: string;
    trackLevel: string;
    experienceLevel: string;
    onboardingCompleted: boolean;
    headline?: string;
    bio?: string;
    location?: string;
    careerGoalObjective?: string;
    completenessScore: number;
    completenessTier: string;
    skills: Array<{ name: string; level: number; category: string }>;
  };
  resume: {
    hasResume: boolean;
    extractedSkills: string[];
    experienceYears?: number | null;
    atsScore?: number | null;
    targetRoleMatch?: number | null;
    recommendedFocusAreas: string[];
    summary?: string;
    experience: Array<{ company: string; role: string; description?: string; skills?: string[] }>;
    projects: Array<{ name: string; description: string; technologies?: string[] }>;
    certifications: Array<{ name: string; issuer: string }>;
  };
  jobIntelligence: {
    hasJobAnalysis: boolean;
    totalAnalysesCount: number;
    latestJob?: {
      jobTitle: string;
      company?: string;
      matchScore: number;
      requiredSkills: string[];
      preferredSkills: string[];
      strongMatchingSkills: string[];
      skillsToDevelop: string[];
      gaps: Array<{ skill: string; priority: string; reason: string; actionType: string; actionLabel: string }>;
      nextSteps: Array<{ title: string; reason: string; actionType: string; actionLabel: string; focusTopic?: string }>;
      likelyInterviewTopics: string[];
      preparationStrategy: string[];
      overview?: string;
    } | null;
  };
  roadmap: {
    hasRoadmap: boolean;
    totalItemsCount: number;
    highPriority: Array<{ title: string; category: string; priority: string; status: string; reason: string; targetSkills?: string[] }>;
    inProgress: Array<{ title: string; category: string; priority: string; status: string; reason: string }>;
    notStarted: Array<{ title: string; category: string; priority: string; status: string; reason: string }>;
    completed: Array<{ title: string; category: string; priority: string; status: string; reason: string }>;
  };
  practice: {
    hasPracticeHistory: boolean;
    totalExecutions: number;
    passedExecutions: number;
    languagesUsed: string[];
    recentSubmissions: Array<{ language: string; status: string; testCasesPassed: number; totalTestCases: number; date: Date }>;
  };
  assessments: {
    hasAssessmentEvidence: boolean;
    totalAssessments: number;
    averageScore: number | null;
    verifiedSkillsCount: number;
    assessmentEvidence: Array<{
      skill: string;
      topic?: string;
      score: number;
      assessmentTitle?: string;
      verifiedAt?: string;
      level?: string;
    }>;
    recentQuestionOutcomes: Array<{
      assessmentTitle?: string;
      status: string;
      score: number;
      date: Date;
    }>;
  };
  interviews: {
    hasInterviewHistory: boolean;
    totalSessions: number;
    completedSessions: number;
    averageScore: number | null;
    recentSessions: Array<{ title: string; domain: string; difficulty: string; status: string; score: number | null; tier: string | null; growthAreas: string[] }>;
  };
  systemDesign: {
    hasDiagramHistory: boolean;
    totalDiagrams: number;
    recentDiagrams: Array<{ title: string; domain: string; difficulty: string; nodeCount: number }>;
  };
}

/**
 * Strips prompt injection tokens and truncates excessive string lengths from untrusted candidate content
 */
function sanitizeText(str?: string, maxLen = 1000): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
    .replace(/\b(system prompt|ignore previous instructions|disregard previous|as an ai assistant)\b/gi, '[filtered]')
    .trim()
    .slice(0, maxLen);
}

export class CareerContextService {
  /**
   * Gathers all verified career, resume, roadmap, practice, and assessment data for the user.
   * NEVER fabricates missing data; leaves unpopulated fields as null / empty arrays.
   */
  static async getCareerContext(userId: string | Types.ObjectId): Promise<ICareerContext | null> {
    if (!userId) return null;

    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Fetch user and related collections concurrently
    const [user, roadmapItems, codeLogs, sessions, diagrams] = await Promise.all([
      User.findById(userObjId),
      RoadmapItem.find({ userId: userObjId }).sort({ order: 1 }),
      CodeExecutionLog.find({ userId: userObjId }).sort({ createdAt: -1 }).limit(20),
      InterviewSession.find({ userId: userObjId }).sort({ createdAt: -1 }).limit(10).populate('feedbackReportRef'),
      SystemDesignDiagram.find({ userId: userObjId }).sort({ updatedAt: -1 }).limit(10),
    ]);

    if (!user) {
      return null;
    }

    // 1. Profile Data
    const completeness = (user as any).profileCompleteness || ({} as any);
    const userProfile = {
      id: user._id.toString(),
      name: sanitizeText(user.name, 100),
      email: user.email,
      userType: user.userType || 'JOB_SEEKER',
      targetRole: sanitizeText(user.targetRole || 'Software Engineer', 100),
      trackLevel: sanitizeText(user.trackLevel || 'Fullstack', 100),
      experienceLevel: user.experienceLevel || 'Mid',
      onboardingCompleted: Boolean(user.onboardingCompleted),
      headline: sanitizeText(user.headline, 200),
      bio: sanitizeText(user.bio, 1000),
      location: sanitizeText(user.location, 100),
      careerGoalObjective: sanitizeText(user.careerGoalObjective, 500),
      completenessScore: typeof completeness.score === 'number' ? completeness.score : 0,
      completenessTier: completeness.tier || 'Incomplete',
      skills: (user.skills || []).map((s) => ({
        name: sanitizeText(s.name, 60),
        level: s.level || 3,
        category: sanitizeText(s.category || 'Engineering', 60),
      })),
    };

    // 2. Resume Data
    const resume = user.parsedResumeData;
    const hasResume = Boolean(
      (resume && Array.isArray(resume.extractedSkills) && resume.extractedSkills.length > 0) ||
      user.resumeUrl
    );

    const resumeData = {
      hasResume,
      extractedSkills: (resume?.extractedSkills || []).map((s) => sanitizeText(s, 60)),
      experienceYears: typeof resume?.experienceYears === 'number' ? resume.experienceYears : null,
      atsScore: typeof resume?.atsScore === 'number' ? resume.atsScore : null,
      targetRoleMatch: typeof resume?.targetRoleMatch === 'number' ? resume.targetRoleMatch : null,
      recommendedFocusAreas: (resume?.recommendedFocusAreas || []).map((f) => sanitizeText(f, 100)),
      summary: sanitizeText(resume?.summary, 1000),
      experience: (user.experience || []).map((exp) => ({
        company: sanitizeText(exp.company, 100),
        role: sanitizeText(exp.role, 100),
        description: sanitizeText(exp.description, 500),
        skills: (exp.skills || []).map((s) => sanitizeText(s, 60)),
      })),
      projects: (user.projects || []).map((proj) => ({
        name: sanitizeText(proj.name, 100),
        description: sanitizeText(proj.description, 500),
        technologies: (proj.technologies || []).map((t) => sanitizeText(t, 60)),
      })),
      certifications: (user.certifications || []).map((cert) => ({
        name: sanitizeText(cert.name, 100),
        issuer: sanitizeText(cert.issuer, 100),
      })),
    };

    // 3. Job Intelligence Data
    const recentJobs = user.recentJobAnalyses || [];
    const hasJobAnalysis = recentJobs.length > 0;
    const latestJob = hasJobAnalysis ? recentJobs[0] : null;

    const jobIntelligenceData = {
      hasJobAnalysis,
      totalAnalysesCount: recentJobs.length,
      latestJob: latestJob
        ? {
            jobTitle: sanitizeText(latestJob.jobTitle, 100),
            company: sanitizeText(latestJob.company, 100),
            matchScore: latestJob.matchScore || 0,
            requiredSkills: (latestJob.requiredSkills || []).map((s) => sanitizeText(s, 60)),
            preferredSkills: (latestJob.preferredSkills || []).map((s) => sanitizeText(s, 60)),
            strongMatchingSkills: (latestJob.strongMatchingSkills || []).map((s) => sanitizeText(s, 60)),
            skillsToDevelop: (latestJob.skillsToDevelop || []).map((s) => sanitizeText(s, 60)),
            gaps: (latestJob.gaps || []).map((g) => ({
              skill: sanitizeText(g.skill, 60),
              priority: g.priority,
              reason: sanitizeText(g.reason, 300),
              actionType: g.actionType,
              actionLabel: sanitizeText(g.actionLabel, 100),
            })),
            nextSteps: (latestJob.nextSteps || []).map((n) => ({
              title: sanitizeText(n.title, 100),
              reason: sanitizeText(n.reason, 300),
              actionType: n.actionType,
              actionLabel: sanitizeText(n.actionLabel, 100),
              focusTopic: sanitizeText(n.focusTopic, 100),
            })),
            likelyInterviewTopics: (latestJob.likelyInterviewTopics || []).map((t) => sanitizeText(t, 100)),
            preparationStrategy: (latestJob.preparationStrategy || []).map((p) => sanitizeText(p, 300)),
            overview: sanitizeText(latestJob.overview, 1000),
          }
        : null,
    };

    // 4. Adaptive Roadmap Data
    const highPriority = roadmapItems
      .filter((item) => item.priority === 'HIGH')
      .map((item) => ({
        title: sanitizeText(item.title, 100),
        category: item.category,
        priority: item.priority,
        status: item.status,
        reason: sanitizeText(item.reason, 300),
        targetSkills: (((item as any).skillsToLearn || (item as any).practiceResources || []) as string[]).map((s: string) => sanitizeText(s, 60)),
      }));

    const inProgress = roadmapItems
      .filter((item) => item.status === 'IN_PROGRESS')
      .map((item) => ({
        title: sanitizeText(item.title, 100),
        category: item.category,
        priority: item.priority,
        status: item.status,
        reason: sanitizeText(item.reason, 300),
      }));

    const notStarted = roadmapItems
      .filter((item) => item.status === 'NOT_STARTED')
      .map((item) => ({
        title: sanitizeText(item.title, 100),
        category: item.category,
        priority: item.priority,
        status: item.status,
        reason: sanitizeText(item.reason, 300),
      }));

    const completed = roadmapItems
      .filter((item) => item.status === 'COMPLETED')
      .map((item) => ({
        title: sanitizeText(item.title, 100),
        category: item.category,
        priority: item.priority,
        status: item.status,
        reason: sanitizeText(item.reason, 300),
      }));

    const roadmapData = {
      hasRoadmap: roadmapItems.length > 0,
      totalItemsCount: roadmapItems.length,
      highPriority,
      inProgress,
      notStarted,
      completed,
    };

    // 5. Practice / Coding Logs Data
    const passedExecutions = codeLogs.filter((l) => l.status === 'passed').length;
    const languagesUsed = Array.from(new Set(codeLogs.map((l) => l.language).filter(Boolean)));
    const recentSubmissions = codeLogs.slice(0, 5).map((l) => ({
      language: l.language,
      status: l.status,
      testCasesPassed: l.testCasesPassed || 0,
      totalTestCases: l.totalTestCases || 0,
      date: l.createdAt,
    }));

    const practiceData = {
      hasPracticeHistory: codeLogs.length > 0,
      totalExecutions: codeLogs.length,
      passedExecutions,
      languagesUsed,
      recentSubmissions,
    };

    // 6. Assessment Evidence & Outcomes
    const assessmentEvidence = (user.assessmentEvidence || []).map((ev: any) => ({
      skill: sanitizeText(ev.skill || ev.topic, 60),
      topic: sanitizeText(ev.topic || ev.skill, 60),
      score: typeof ev.score === 'number' ? ev.score : ev.scoreAchieved || 0,
      assessmentTitle: sanitizeText(ev.assessmentTitle, 100),
      verifiedAt: ev.verifiedAt ? new Date(ev.verifiedAt).toISOString() : undefined,
      level: ev.level || 'Intermediate',
    }));

    const assessmentSessions = sessions.filter((s) => s.status === 'completed');
    let totalScoreSum = 0;
    let scoreCount = 0;

    const recentQuestionOutcomes = sessions.slice(0, 5).map((s) => {
      const report = s.feedbackReportRef as any;
      const score = report?.overallScore ?? null;
      if (score !== null && typeof score === 'number') {
        totalScoreSum += score;
        scoreCount++;
      }
      return {
        assessmentTitle: sanitizeText(s.title, 100),
        status: s.status,
        score: score ?? 0,
        date: s.createdAt,
      };
    });

    const assessmentsData = {
      hasAssessmentEvidence: assessmentEvidence.length > 0 || assessmentSessions.length > 0,
      totalAssessments: assessmentSessions.length,
      averageScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : null,
      verifiedSkillsCount: assessmentEvidence.length,
      assessmentEvidence,
      recentQuestionOutcomes,
    };

    // 7. Interview Assessment Sessions
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const recentSessions = sessions.slice(0, 5).map((s) => {
      const report = s.feedbackReportRef as any;
      return {
        title: sanitizeText(s.title, 100),
        domain: sanitizeText(s.domain, 60),
        difficulty: sanitizeText(s.difficulty, 60),
        status: s.status,
        score: report?.overallScore ?? null,
        tier: report?.performanceTier ?? null,
        growthAreas: (report?.growthAreas || []).map((g: string) => sanitizeText(g, 100)),
      };
    });

    const interviewsData = {
      hasInterviewHistory: sessions.length > 0,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageScore: scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : null,
      recentSessions,
    };

    // 8. System Design Diagrams
    const systemDesignData = {
      hasDiagramHistory: diagrams.length > 0,
      totalDiagrams: diagrams.length,
      recentDiagrams: diagrams.slice(0, 5).map((d) => ({
        title: sanitizeText(d.templateTitle, 100),
        domain: sanitizeText(d.domain, 60),
        difficulty: sanitizeText(d.difficulty, 60),
        nodeCount: d.nodes?.length || 0,
      })),
    };

    return {
      user: userProfile,
      resume: resumeData,
      jobIntelligence: jobIntelligenceData,
      roadmap: roadmapData,
      practice: practiceData,
      assessments: assessmentsData,
      interviews: interviewsData,
      systemDesign: systemDesignData,
    };
  }
}

export default CareerContextService;
