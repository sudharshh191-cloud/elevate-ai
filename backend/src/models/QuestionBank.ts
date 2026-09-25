import mongoose, { Document, Schema } from 'mongoose';

export interface IRubricCriterion {
  title: string;
  weight: number; // 0 - 100
  keyPointsToLookFor: string[];
}

export interface ICodeTemplate {
  language: string;
  starterCode: string;
  solutionCode?: string;
  testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
}

export interface IQuestionBank extends Document {
  problemNumber?: number;
  title: string;
  questionText: string;
  domain: 'Frontend' | 'Backend' | 'Fullstack' | 'System Design' | 'DevOps' | 'Machine Learning' | 'Behavioral';
  category: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
  format: 'Voice' | 'Code' | 'Hybrid';
  expectedDurationMinutes: number;
  rubricCriteria: IRubricCriterion[];
  idealAnswerOutline: string;
  hints: string[];
  codeTemplate?: ICodeTemplate;
  tags: string[];
  source: 'curated' | 'ai-generated';
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    problemNumber: { type: Number, index: true },
    title: { type: String, required: true, index: true },
    questionText: { type: String, required: true },
    domain: {
      type: String,
      required: true,
      enum: ['Frontend', 'Backend', 'Fullstack', 'System Design', 'DevOps', 'Machine Learning', 'Behavioral'],
      index: true,
    },
    category: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'],
      default: 'Mid',
      index: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['Voice', 'Code', 'Hybrid'],
      default: 'Hybrid',
      index: true,
    },
    expectedDurationMinutes: { type: Number, default: 15 },
    rubricCriteria: [
      {
        title: { type: String, required: true },
        weight: { type: Number, default: 25 },
        keyPointsToLookFor: [String],
      },
    ],
    idealAnswerOutline: { type: String, required: true },
    hints: [String],
    codeTemplate: {
      language: { type: String, default: 'typescript' },
      starterCode: { type: String, default: '' },
      solutionCode: { type: String },
      testCases: [
        {
          input: String,
          expectedOutput: String,
          isHidden: { type: Boolean, default: false },
        },
      ],
    },
    tags: [{ type: String, index: true }],
    source: {
      type: String,
      enum: ['curated', 'ai-generated'],
      default: 'curated',
    },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound text and keyword index for fast search
QuestionBankSchema.index({ title: 'text', questionText: 'text', category: 'text', tags: 'text' });

export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);
