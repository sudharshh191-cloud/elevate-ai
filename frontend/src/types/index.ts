export type InterviewDomain = 
  | 'Frontend' 
  | 'Backend' 
  | 'Fullstack' 
  | 'System Design' 
  | 'DevOps' 
  | 'Machine Learning' 
  | 'Behavioral';

export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
export type InterviewFormat = 'Voice' | 'Code' | 'Hybrid';

export interface IRubricCriterion {
  title: string;
  weight: number;
  keyPointsToLookFor: string[];
}

export interface ICodeTemplate {
  language: string;
  starterCode: string;
  solutionCode?: string;
  testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
}

export interface ITestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  errorOutput?: string;
  isHidden?: boolean;
}

export interface ICodeExecutionResult {
  status: 'COMPLETED' | 'TIMEOUT' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'SECURITY_ERROR' | 'EXECUTION_ERROR';
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTimeMs: number;
  memoryUsageKb: number | null;
  tests: ITestCaseResult[];
  rawOutput?: string;
  errorOutput?: string;
  sandboxMode: 'docker' | 'isolated-subprocess';
}

export interface IQuestion {
  questionId?: string;
  problemNumber?: number;
  title?: string;
  questionText: string;
  domain: string;
  category: string;
  difficulty: string;
  format: InterviewFormat;
  expectedDurationMinutes: number;
  hints: string[];
  rubricCriteria: IRubricCriterion[];
  idealAnswerOutline: string;
  source?: 'LIVE_AI' | 'DEVELOPMENT_FALLBACK';
  codeTemplate?: ICodeTemplate;
  tags?: string[];
}

export interface IQuestionBankItem {
  _id: string;
  problemNumber?: number;
  title: string;
  questionText: string;
  domain: InterviewDomain;
  category: string;
  difficulty: ExperienceLevel;
  format: InterviewFormat;
  expectedDurationMinutes: number;
  hints: string[];
  rubricCriteria: IRubricCriterion[];
  idealAnswerOutline?: string;
  codeTemplate?: ICodeTemplate;
  tags: string[];
  source?: string;
  usageCount?: number;
}

export interface IQuestionCategoryItem {
  name: string;
  count: number;
  domain: string;
}

export interface IQuestionSearchResponse {
  questions: IQuestionBankItem[];
  total: number;
  page: number;
  totalPages: number;
}

export type AssessmentPracticeMode = 'learn_practice' | 'topic_assessment' | 'mock_assessment';

export interface IInstantFeedback {
  score: number;
  technicalAccuracy: number;
  communication: number;
  strengths: string[];
  improvements: string[];
  coachNote: string;
}

export interface IResponseItem {
  questionIndex: number;
  questionText: string;
  format: InterviewFormat;
  responseType: 'text' | 'voice_transcript' | 'code' | 'mixed';
  textResponse?: string;
  codeSubmission?: {
    code: string;
    language: string;
    executionOutput?: string;
    passedTestCases?: number;
    totalTestCases?: number;
  };
  audioMetrics?: {
    durationSeconds: number;
    wpm?: number;
    fillerWordsCount?: number;
    confidenceScore?: number;
  };
  instantFeedback?: IInstantFeedback;
  timeSpentSeconds: number;
}

export interface IInterviewSession {
  _id: string;
  title: string;
  domain: InterviewDomain;
  difficulty: ExperienceLevel;
  format: InterviewFormat;
  status: 'created' | 'in-progress' | 'completed' | 'abandoned';
  terminationReason?: 'USER_EXITED' | 'FULLSCREEN_TIMEOUT' | 'DURATION_EXPIRED' | string | null;
  questions: IQuestion[];
  currentQuestionIndex: number;
  responses: IResponseItem[];
  startedAt: string;
  completedAt?: string;
  totalDurationSeconds?: number;
  allocatedDurationMinutes?: number;
  expiresAt?: string;
}

export interface IRealQuestionResult {
  questionIndex: number;
  problemNumber?: number;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
  status: 'PASSED' | 'PARTIAL' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'UNATTEMPTED';
  statusDisplay: string;
  passedTestCases: number;
  totalTestCases: number;
  score: number;
  timeSpentSeconds: number;
  language?: string;
  compilerError?: string;
  runtimeError?: string;
}

export interface ISkillEvidenceItem {
  topic: string;
  category: string;
  problemsEncountered: number;
  problemsPassed: number;
  totalTestCases: number;
  passedTestCases: number;
  testCasePassRate: number;
  evidenceText: string;
  status: 'DEMONSTRATED' | 'DEVELOPING' | 'NEEDS_WORK' | 'NO_EVIDENCE';
}

export interface IPerformanceAreaItem {
  area: string;
  hasEvidence: boolean;
  evidenceSummary?: string;
  problemsAttempted: number;
  problemsPassed: number;
  successRate?: number;
}

export interface IPerformanceOverview {
  totalQuestions: number;
  attemptedQuestions: number;
  completedQuestions: number;
  passedQuestions: number;
  partialQuestions: number;
  failedQuestions: number;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  compileErrorsCount: number;
  runtimeErrorsCount: number;
  timeoutsCount: number;
  durationUsedSeconds: number;
  allocatedDurationSeconds: number;
  averageTimePerCompletedQuestionSeconds?: number;
  languagesUsed: Record<string, number>;
  topicsEncountered: string[];
  completionStatus: 'completed' | 'abandoned' | 'in-progress';
  terminationReason?: string | null;
}

export interface IAssessmentEvidence {
  _id?: string;
  skill: string;
  topic: string;
  category?: string;
  problemsAttempted: number;
  problemsPassed: number;
  passedTestCases: number;
  totalTestCases: number;
  successRate: number;
  evidenceText: string;
  lastAssessedAt: string | Date;
  source: 'ASSESSMENT';
}

export interface IFeedbackReport {
  reportId: string;
  sessionId: string;
  domain: string;
  difficulty: string;
  overallScore: number;
  createdAt?: string | Date;
  performanceTier: string;
  executiveSummary: string;
  metrics: {
    technicalAccuracy: number;
    communicationClarity: number;
    problemSolving: number;
    confidenceAndDelivery: number;
    codeQualityAndEfficiency: number;
  };
  radarChartData: Array<{ metric: string; score: number; benchmark: number }>;
  topStrengths: string[];
  criticalGaps: string[];
  actionableRoadmap: Array<{
    week: number;
    topic: string;
    recommendedAction: string;
    practiceResources: string[];
  }>;
  questionDetails: Array<{
    questionIndex: number;
    questionText: string;
    category: string;
    userResponseText?: string;
    userSubmittedCode?: string;
    score: number;
    technicalAccuracyScore: number;
    communicationScore: number;
    idealAnswerSummary: string;
    keyPointsCovered: string[];
    keyPointsMissed: string[];
    codeReviewFeedback?: {
      timeComplexity?: string;
      spaceComplexity?: string;
      bestPracticeTips?: string[];
    };
    constructiveCritique: string;
  }>;
  performanceOverview?: IPerformanceOverview;
  questionResults?: IRealQuestionResult[];
  skillEvidence?: ISkillEvidenceItem[];
  performanceAreas?: IPerformanceAreaItem[];
  shareId?: string;
  shareEnabled?: boolean;
}

export type UserPersonaType = 'STUDENT' | 'JOB_SEEKER' | 'PROFESSIONAL' | 'CAREER_SWITCHER';

export interface IStudentProfile {
  collegeName?: string;
  degree?: string;
  branchMajor?: string;
  currentYear?: string;
  graduationYear?: number;
  cgpa?: number;
  programmingLanguages?: string[];
  technicalSkills?: string[];
  areasOfInterest?: string[];
  targetJobRoles?: string[];
  internshipInterest?: boolean;
  placementPrepStatus?: string;
}

export interface IProfessionalProfile {
  currentRole?: string;
  yearsOfExperience?: number;
  industry?: string;
  currentSkills?: string[];
  targetRole?: string;
}

export interface ICareerSwitcherProfile {
  currentBackground?: string;
  yearsOfExperience?: number;
  currentSkills?: string[];
  targetCareerRole?: string;
  skillsToLearn?: string[];
}

export interface IEducationItem {
  _id?: string;
  institution: string;
  degree: string;
  department?: string;
  currentYear?: string;
  graduationYear?: number;
  gpa?: number | string;
  description?: string;
}

export interface IExperienceItem {
  _id?: string;
  company: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
}

export interface IProjectItem {
  _id?: string;
  name: string;
  description: string;
  technologies?: string[];
  projectLink?: string;
  githubLink?: string;
  startDate?: string;
  endDate?: string;
}

export interface ICertificationItem {
  _id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface IAchievementItem {
  _id?: string;
  title: string;
  description?: string;
  date?: string;
  organization?: string;
}

export interface ILanguageItem {
  _id?: string;
  language: string;
  proficiency: string;
}

export interface ICareerPreferences {
  preferredRoles?: string[];
  preferredLocations?: string[];
  workModes?: string[];
  industries?: string[];
}

export interface IProfileCompletenessSection {
  id: string;
  title: string;
  weight: number;
  completed: boolean;
  description: string;
}

export interface IProfileCompleteness {
  score: number;
  percentage: number;
  tier: 'Incomplete' | 'Basic' | 'Intermediate' | 'Advanced' | 'All-Star';
  completedSectionsCount: number;
  totalSectionsCount: number;
  sections: IProfileCompletenessSection[];
  nextRecommendedStep?: string;
}

export interface IUserProfile {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  userType?: UserPersonaType;
  onboardingCompleted?: boolean;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  targetRole: string;
  trackLevel?: string;
  experienceLevel: ExperienceLevel;
  careerGoalObjective?: string;
  careerPreferences?: ICareerPreferences;
  skills: Array<{ name: string; level: number; category: string }>;
  resumeSkills?: string[];
  assessmentEvidence?: IAssessmentEvidence[];
  education?: IEducationItem[];
  experience?: IExperienceItem[];
  projects?: IProjectItem[];
  certifications?: ICertificationItem[];
  achievements?: IAchievementItem[];
  languages?: ILanguageItem[];
  studentProfile?: IStudentProfile;
  professionalProfile?: IProfessionalProfile;
  careerSwitcherProfile?: ICareerSwitcherProfile;
  resumeUrl?: string;
  parsedResumeData?: {
    summary?: string;
    extractedSkills: string[];
    experienceYears?: number;
    atsScore?: number;
    targetRoleMatch?: number;
    recommendedFocusAreas?: string[];
  };
  profileCompleteness?: IProfileCompleteness;
  recentJobAnalyses?: IJobDescriptionAnalysis[];
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    domainScores: Record<string, number>;
    streakDays: number;
  };
}

export interface ISystemDesignProblem {
  id: string;
  title: string;
  difficulty: ExperienceLevel;
  category: string;
  description: string;
  expectedScale: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  trafficAssumptions: {
    dau: number;
    requestsPerUser: number;
    peakMultiplier: number;
    readWriteRatio: number;
    payloadSizeKb: number;
  };
}

export interface ISystemDesignNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
}

export interface ISystemDesignEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
}

export interface ITrafficConfig {
  dau: number;
  requestsPerUser: number;
  peakMultiplier: number;
  readWriteRatio: number;
  payloadSizeKb: number;
}

export interface ICalculatedMetrics {
  totalDailyRequests: number;
  avgRps: number;
  peakRps: number;
  readRps: number;
  writeRps: number;
  ingressBandwidthMbps: number;
  egressBandwidthMbps: number;
  dailyStorageGb: number;
  annualStorageTb: number;
}

export interface ISystemDesignValidation {
  severity: 'error' | 'warning' | 'info';
  message: string;
  componentId?: string;
}

export interface ISystemDesignEvaluation {
  overallScore: number;
  verdict: 'Staff Architect' | 'Principal Ready' | 'Senior Pass' | 'Needs Work';
  executiveSummary: string;
  dimensions: {
    scalability: number;
    reliability: number;
    availability: number;
    performance: number;
    dataDesign: number;
    security: number;
    costEfficiency: number;
  };
  topStrengths: string[];
  criticalGaps: string[];
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  tradeoffs: Array<{
    decision: string;
    upside: string;
    downside: string;
  }>;
}

export interface ISystemDesignDiagram {
  _id?: string;
  id?: string;
  userId?: string;
  problemId: string;
  templateTitle: string;
  domain?: string;
  difficulty: ExperienceLevel;
  trafficEstimation?: string;
  trafficConfig?: ITrafficConfig;
  calculatedMetrics?: ICalculatedMetrics;
  nodes: ISystemDesignNode[];
  edges: ISystemDesignEdge[];
  components: string[];
  notes?: string;
  validationResults?: ISystemDesignValidation[];
  evaluation?: ISystemDesignEvaluation;
  version?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IDashboardAnalytics {
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
    targetRole?: string;
    trackLevel?: string;
    onboardingCompleted: boolean;
    streakDays: number;
  };
  progressCounters: {
    codingProblemsSolved: number;
    codingSubmissionsTotal: number;
    codingPassRate: number;
    resumesAnalyzed: number;
    mockInterviewsCompleted: number;
    mockInterviewsTotal: number;
    systemDesignDiagrams: number;
    streakDays: number;
  };
  practice: {
    totalExecutions: number;
    passedExecutions: number;
    failedExecutions: number;
    passRate: number;
    languagesUsed: Record<string, number>;
    recentCodeExecutions: Array<{
      id: string;
      language: string;
      status: string;
      testCasesPassed: number;
      totalTestCases: number;
      executionTimeMs?: number;
      createdAt: string;
    }>;
  };
  careerProfile: {
    hasResume: boolean;
    summary?: string;
    extractedSkills: string[];
    skillsCount: number;
    atsScore: number | null;
    targetRoleMatch: number | null;
    experienceYears: number | null;
    recommendedFocusAreas: string[];
    resumeUrl: string | null;
    lastUpdated?: string;
  };
  interviews: {
    total: number;
    completed: number;
    averageScore: number | null;
    recentInterviews: Array<{
      id: string;
      title: string;
      domain: string;
      date: string;
      duration: string;
      score: number | null;
      verdict: string | null;
      status: string;
    }>;
  };
  systemDesign: {
    total: number;
    recentDiagrams: Array<{
      id: string;
      title: string;
      domain: string;
      difficulty: string;
      nodeCount: number;
      updatedAt: string;
    }>;
  };
  todayActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    category: 'practice' | 'resume' | 'interview' | 'system-design' | 'onboarding';
    actionLabel: string;
    targetTab: 'arena' | 'resume' | 'system-design' | 'analytics';
    priority: 'high' | 'medium' | 'normal';
  }>;
  recentActivity: Array<{
    id: string;
    type: 'coding' | 'interview' | 'resume' | 'system-design';
    title: string;
    description: string;
    timestamp: string;
    badge?: string;
    badgeColor?: string;
  }>;
}

export interface IJobAnalysisRequirementCategory {
  category: string;
  skills: string[];
}

export interface IJobAnalysisEvidenceItem {
  skill: string;
  category?: string;
  status: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE';
  evidenceText: string;
  source: 'RESUME' | 'PROFILE' | 'PRACTICE' | 'SYSTEM_DESIGN' | 'INTERVIEW' | 'NONE';
}

export interface IJobAnalysisGapItem {
  skill: string;
  category?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  actionType: 'arena' | 'resume' | 'system-design' | 'profile' | 'analytics';
  actionLabel: string;
}

export interface IJobAnalysisNextStep {
  title: string;
  reason: string;
  actionType: 'arena' | 'resume' | 'system-design' | 'profile' | 'analytics';
  actionLabel: string;
  focusTopic?: string;
}

export interface IJobDescriptionAnalysis {
  _id?: string;
  analysisId?: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  matchScore: number;
  requiredSkills: string[];
  preferredSkills: string[];
  categorizedRequirements?: IJobAnalysisRequirementCategory[];
  evidenceBreakdown?: IJobAnalysisEvidenceItem[];
  strongMatchingSkills: string[];
  skillsToDevelop: string[];
  gaps?: IJobAnalysisGapItem[];
  nextSteps?: IJobAnalysisNextStep[];
  likelyInterviewTopics: string[];
  preparationStrategy: string[];
  overview: string;
  savedAt?: string;
  createdAt?: string;
}

export type IJobIntelligenceResponse = IJobDescriptionAnalysis;

export type RoadmapCategory =
  | 'DSA'
  | 'Programming'
  | 'CS Fundamentals'
  | 'SQL'
  | 'Backend'
  | 'Frontend'
  | 'Full Stack'
  | 'System Design'
  | 'Cloud'
  | 'DevOps'
  | 'AI/ML'
  | 'Data'
  | 'Behavioral'
  | 'Interview'
  | 'Other';

export type RoadmapPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type RoadmapStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type RoadmapSource =
  | 'RESUME'
  | 'JOB_DESCRIPTION'
  | 'CODING'
  | 'INTERVIEW'
  | 'ASSESSMENT'
  | 'SYSTEM_DESIGN'
  | 'AI_ANALYSIS'
  | 'COMBINED';

export interface IRoadmapActionTarget {
  type: 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence' | 'roadmap';
  label: string;
  focusTopic?: string;
}

export interface IRoadmapItem {
  _id: string;
  id?: string;
  userId: string;
  targetRole: string;
  title: string;
  category: RoadmapCategory;
  priority: RoadmapPriority;
  status: RoadmapStatus;
  reason: string;
  evidence: string[];
  source: RoadmapSource;
  recommendedActions: string[];
  actionTarget?: IRoadmapActionTarget;
  order: number;
  completedAt?: string;
  lastUpdatedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRoadmapResponse {
  roadmapItems: IRoadmapItem[];
  total: number;
  inProgressCount: number;
  completedCount: number;
  notStartedCount: number;
}

export type IAssistantActionType =
  | 'PRACTICE'
  | 'RESUME'
  | 'JOB_INTELLIGENCE'
  | 'INTERVIEW'
  | 'SYSTEM_DESIGN'
  | 'ROADMAP'
  | 'PROFILE';

export interface IAssistantSuggestedAction {
  label: string;
  type: IAssistantActionType;
  route: string;
  focusTopic?: string;
}

export interface IAskElevateResponse {
  answer: string;
  whyThisMatters?: string;
  suggestedActions: IAssistantSuggestedAction[];
}

export interface IAssistantMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  whyThisMatters?: string;
  suggestedActions?: IAssistantSuggestedAction[];
  timestamp?: string;
}

// ========================================================
// PHASE 9: JOB TRACKER + OPPORTUNITY INTELLIGENCE TYPES
// ========================================================

export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ITrackedJobNextAction {
  label: string;
  actionType: 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'roadmap';
  focusTopic?: string;
  reason?: string;
}

export interface ITrackedJobAnalysisSnapshot {
  matchScore?: number;
  requiredSkills?: string[];
  missingSkills?: string[];
  matchedSkills?: string[];
  evidenceBreakdown?: IJobAnalysisEvidenceItem[];
  gaps?: IJobAnalysisGapItem[];
  likelyInterviewTopics?: string[];
  preparationStrategy?: string[];
  overview?: string;
}

export interface ITrackedJob {
  _id: string;
  id?: string;
  userId?: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  source?: string;
  jobUrl?: string;
  location?: string;
  employmentType?: string;
  salaryRange?: string;
  status: ApplicationStatus;
  dateAdded: string;
  dateApplied?: string;
  lastUpdated: string;
  notes?: string;
  targetRole?: string;
  jobAnalysisId?: string;
  analysisSnapshot?: ITrackedJobAnalysisSnapshot;
  nextAction?: ITrackedJobNextAction;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITrackedJobStats {
  total: number;
  saved: number;
  applied: number;
  assessment: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
  activeApplications: number;
  upcomingInterviews: number;
}



