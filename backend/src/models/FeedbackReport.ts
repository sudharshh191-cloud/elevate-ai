import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuestionFeedbackDetail {
  questionIndex: number;
  questionText: string;
  category: string;
  userResponseText?: string;
  userSubmittedCode?: string;
  audioAnalysis?: {
    paceRating: 'Too Slow' | 'Optimal' | 'Too Fast';
    fillerWordPercentage: number;
    toneConfidence: number; // 0 - 100
  };
  score: number; // 0 - 100
  technicalAccuracyScore: number;
  communicationScore: number;
  idealAnswerSummary: string;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
  codeReviewFeedback?: {
    timeComplexity?: string;
    spaceComplexity?: string;
    codeSmells?: string[];
    bestPracticeTips?: string[];
  };
  constructiveCritique: string;
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
  testCasePassRate: number; // 0 - 100
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

export interface IFeedbackReport extends Document {
  sessionId: Types.ObjectId;
  userId?: Types.ObjectId;
  domain: string;
  difficulty: string;
  overallScore: number; // 0 - 100
  performanceTier: string;
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
  questionDetails: IQuestionFeedbackDetail[];
  performanceOverview?: IPerformanceOverview;
  questionResults?: IRealQuestionResult[];
  skillEvidence?: ISkillEvidenceItem[];
  performanceAreas?: IPerformanceAreaItem[];
  executiveSummary: string;
  // Public Shareable Scorecard Properties
  shareId?: string;
  shareEnabled?: boolean;
  shareCreatedAt?: Date;
  shareRevokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionFeedbackDetailSchema = new Schema<IQuestionFeedbackDetail>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    category: { type: String, default: 'Architecture' },
    userResponseText: String,
    userSubmittedCode: String,
    audioAnalysis: {
      paceRating: { type: String, enum: ['Too Slow', 'Optimal', 'Too Fast'], default: 'Optimal' },
      fillerWordPercentage: { type: Number, default: 0 },
      toneConfidence: { type: Number, default: 80 },
    },
    score: { type: Number, default: 85 },
    technicalAccuracyScore: { type: Number, default: 85 },
    communicationScore: { type: Number, default: 85 },
    idealAnswerSummary: String,
    keyPointsCovered: [String],
    keyPointsMissed: [String],
    codeReviewFeedback: {
      timeComplexity: String,
      spaceComplexity: String,
      codeSmells: [String],
      bestPracticeTips: [String],
    },
    constructiveCritique: String,
  },
  { _id: false }
);

const RealQuestionResultSchema = new Schema<IRealQuestionResult>(
  {
    questionIndex: { type: Number, required: true },
    problemNumber: Number,
    title: { type: String, required: true },
    topic: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    status: {
      type: String,
      enum: ['PASSED', 'PARTIAL', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIMEOUT', 'UNATTEMPTED'],
      required: true,
    },
    statusDisplay: { type: String, required: true },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    language: String,
    compilerError: String,
    runtimeError: String,
  },
  { _id: false }
);

const SkillEvidenceItemSchema = new Schema<ISkillEvidenceItem>(
  {
    topic: { type: String, required: true },
    category: { type: String, required: true },
    problemsEncountered: { type: Number, default: 0 },
    problemsPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    testCasePassRate: { type: Number, default: 0 },
    evidenceText: { type: String, required: true },
    status: {
      type: String,
      enum: ['DEMONSTRATED', 'DEVELOPING', 'NEEDS_WORK', 'NO_EVIDENCE'],
      default: 'NO_EVIDENCE',
    },
  },
  { _id: false }
);

const PerformanceAreaItemSchema = new Schema<IPerformanceAreaItem>(
  {
    area: { type: String, required: true },
    hasEvidence: { type: Boolean, default: false },
    evidenceSummary: String,
    problemsAttempted: { type: Number, default: 0 },
    problemsPassed: { type: Number, default: 0 },
    successRate: Number,
  },
  { _id: false }
);

const PerformanceOverviewSchema = new Schema<IPerformanceOverview>(
  {
    totalQuestions: { type: Number, default: 0 },
    attemptedQuestions: { type: Number, default: 0 },
    completedQuestions: { type: Number, default: 0 },
    passedQuestions: { type: Number, default: 0 },
    partialQuestions: { type: Number, default: 0 },
    failedQuestions: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    failedTestCases: { type: Number, default: 0 },
    compileErrorsCount: { type: Number, default: 0 },
    runtimeErrorsCount: { type: Number, default: 0 },
    timeoutsCount: { type: Number, default: 0 },
    durationUsedSeconds: { type: Number, default: 0 },
    allocatedDurationSeconds: { type: Number, default: 0 },
    averageTimePerCompletedQuestionSeconds: Number,
    languagesUsed: { type: Map, of: Number, default: {} },
    topicsEncountered: [String],
    completionStatus: {
      type: String,
      enum: ['completed', 'abandoned', 'in-progress'],
      default: 'completed',
    },
    terminationReason: String,
  },
  { _id: false }
);

const FeedbackReportSchema = new Schema<IFeedbackReport>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    domain: { type: String, required: true },
    difficulty: { type: String, required: true },
    overallScore: { type: Number, required: true },
    performanceTier: {
      type: String,
      default: 'Evaluated',
    },
    metrics: {
      technicalAccuracy: { type: Number, default: 0 },
      communicationClarity: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      confidenceAndDelivery: { type: Number, default: 0 },
      codeQualityAndEfficiency: { type: Number, default: 0 },
    },
    radarChartData: [
      {
        metric: String,
        score: Number,
        benchmark: { type: Number, default: 75 },
      },
    ],
    topStrengths: [String],
    criticalGaps: [String],
    actionableRoadmap: [
      {
        week: Number,
        topic: String,
        recommendedAction: String,
        practiceResources: [String],
      },
    ],
    questionDetails: [QuestionFeedbackDetailSchema],
    performanceOverview: PerformanceOverviewSchema,
    questionResults: [RealQuestionResultSchema],
    skillEvidence: [SkillEvidenceItemSchema],
    performanceAreas: [PerformanceAreaItemSchema],
    executiveSummary: { type: String, required: true },
    // Public Scorecard Sharing fields
    shareId: { type: String, unique: true, sparse: true, index: true },
    shareEnabled: { type: Boolean, default: false },
    shareCreatedAt: { type: Date },
    shareRevokedAt: { type: Date },
  },
  { timestamps: true }
);

FeedbackReportSchema.index({ userId: 1, createdAt: -1 });
FeedbackReportSchema.index({ domain: 1, overallScore: -1 });
FeedbackReportSchema.index({ shareId: 1, shareEnabled: 1 });

export const FeedbackReport = mongoose.model<IFeedbackReport>('FeedbackReport', FeedbackReportSchema);
