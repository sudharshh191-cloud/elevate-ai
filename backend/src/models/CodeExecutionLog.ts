import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICodeExecutionLog extends Document {
  userId?: Types.ObjectId;
  sessionId?: Types.ObjectId;
  questionIndex: number;
  language: string;
  code: string;
  status: 'passed' | 'failed' | 'syntax_error' | 'timeout';
  executionTimeMs?: number;
  memoryUsageKb?: number;
  testCasesPassed: number;
  totalTestCases: number;
  rawOutput?: string;
  errorOutput?: string;
  createdAt: Date;
}

const CodeExecutionLogSchema = new Schema<ICodeExecutionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', index: true },
    questionIndex: { type: Number, required: true },
    language: { type: String, required: true, default: 'typescript' },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['passed', 'failed', 'syntax_error', 'timeout'],
      required: true,
      default: 'passed',
    },
    executionTimeMs: { type: Number, default: 0 },
    memoryUsageKb: { type: Number, default: 0 },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    rawOutput: String,
    errorOutput: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CodeExecutionLogSchema.index({ userId: 1, createdAt: -1 });
CodeExecutionLogSchema.index({ sessionId: 1, questionIndex: 1 });

export const CodeExecutionLog = mongoose.model<ICodeExecutionLog>(
  'CodeExecutionLog',
  CodeExecutionLogSchema
);
