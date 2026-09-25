import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuestionSnapshot {
  questionId?: Types.ObjectId;
  problemNumber?: number;
  title?: string;
  questionText: string;
  domain: string;
  category: string;
  difficulty: string;
  format: 'Voice' | 'Code' | 'Hybrid';
  expectedDurationMinutes: number;
  rubricCriteria: Array<{ title: string; weight: number; keyPointsToLookFor: string[] }>;
  idealAnswerOutline: string;
  hints: string[];
  source?: 'LIVE_AI' | 'DEVELOPMENT_FALLBACK';
  codeTemplate?: {
    language: string;
    starterCode: string;
    solutionCode?: string;
    testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
  };
  tags?: string[];
}

export interface IUserResponseItem {
  questionIndex: number;
  questionText: string;
  format: 'Voice' | 'Code' | 'Hybrid';
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
    confidenceScore?: number; // 0 - 100
  };
  timeSpentSeconds: number;
  instantFeedback?: {
    score: number; // 0 - 100
    technicalAccuracy: number;
    communication: number;
    strengths: string[];
    improvements: string[];
    coachNote: string;
  };
  evaluationDetails?: Record<string, any>;
  submittedAt: Date;
}

export interface IInterviewSession extends Document {
  userId?: Types.ObjectId;
  title: string;
  domain: 'Frontend' | 'Backend' | 'Fullstack' | 'System Design' | 'DevOps' | 'Machine Learning' | 'Behavioral';
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
  format: 'Voice' | 'Code' | 'Hybrid';
  status: 'created' | 'in-progress' | 'completed' | 'abandoned';
  terminationReason?: 'USER_EXITED' | 'FULLSCREEN_TIMEOUT' | 'DURATION_EXPIRED' | string | null;
  customJobDescription?: string;
  customTopicFocus?: string;
  targetCompanyProfile?: string;
  questions: IQuestionSnapshot[];
  currentQuestionIndex: number;
  responses: IUserResponseItem[];
  startedAt?: Date;
  completedAt?: Date;
  totalDurationSeconds: number;
  allocatedDurationMinutes?: number;
  expiresAt?: Date;
  feedbackReportRef?: Types.ObjectId;
  drafts?: Record<string, { code: string; language: string; updatedAt?: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

export const QuestionSnapshotSchema = new Schema<IQuestionSnapshot>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'QuestionBank' },
    problemNumber: { type: Number },
    title: { type: String },
    questionText: { type: String, required: true },
    domain: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    format: { type: String, enum: ['Voice', 'Code', 'Hybrid'], default: 'Hybrid' },
    expectedDurationMinutes: { type: Number, default: 5 },
    rubricCriteria: [
      {
        title: String,
        weight: Number,
        keyPointsToLookFor: [String],
      },
    ],
    idealAnswerOutline: String,
    hints: [String],
    source: { type: String, enum: ['LIVE_AI', 'DEVELOPMENT_FALLBACK'], default: 'LIVE_AI' },
    codeTemplate: {
      language: String,
      starterCode: String,
      solutionCode: String,
      testCases: [
        {
          input: String,
          expectedOutput: String,
          isHidden: { type: Boolean, default: false },
        },
      ],
    },
    tags: [{ type: String }],
  },
  { _id: false }
);

export const UserResponseItemSchema = new Schema<IUserResponseItem>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    format: { type: String, enum: ['Voice', 'Code', 'Hybrid'], default: 'Hybrid' },
    responseType: {
      type: String,
      enum: ['text', 'voice_transcript', 'code', 'mixed'],
      default: 'text',
    },
    textResponse: String,
    codeSubmission: {
      code: String,
      language: String,
      executionOutput: String,
      passedTestCases: Number,
      totalTestCases: Number,
    },
    audioMetrics: {
      durationSeconds: Number,
      wpm: Number,
      fillerWordsCount: Number,
      confidenceScore: Number,
    },
    timeSpentSeconds: { type: Number, default: 0 },
    instantFeedback: {
      score: Number,
      technicalAccuracy: Number,
      communication: Number,
      strengths: [String],
      improvements: [String],
      coachNote: String,
    },
    evaluationDetails: { type: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    domain: {
      type: String,
      required: true,
      enum: ['Frontend', 'Backend', 'Fullstack', 'System Design', 'DevOps', 'Machine Learning', 'Behavioral'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'],
      default: 'Mid',
    },
    format: {
      type: String,
      required: true,
      enum: ['Voice', 'Code', 'Hybrid'],
      default: 'Hybrid',
    },
    status: {
      type: String,
      enum: ['created', 'in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
      index: true,
    },
    terminationReason: {
      type: String,
      enum: ['USER_EXITED', 'FULLSCREEN_TIMEOUT', 'DURATION_EXPIRED', null],
      default: null,
    },
    customJobDescription: String,
    customTopicFocus: String,
    targetCompanyProfile: String,
    questions: [QuestionSnapshotSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    responses: [UserResponseItemSchema],
    drafts: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    totalDurationSeconds: { type: Number, default: 0 },
    allocatedDurationMinutes: { type: Number, default: 45 },
    expiresAt: Date,
    feedbackReportRef: { type: Schema.Types.ObjectId, ref: 'FeedbackReport' },
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ status: 1, createdAt: -1 });
InterviewSessionSchema.index({ domain: 1, difficulty: 1 });

export const InterviewSession = mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
