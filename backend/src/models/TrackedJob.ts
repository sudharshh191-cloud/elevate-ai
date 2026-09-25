import mongoose, { Schema, Document, Types } from 'mongoose';
import { IJobAnalysisEvidenceItem, IJobAnalysisGapItem } from './User.js';

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

export interface ITrackedJob extends Document {
  userId: Types.ObjectId;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  source?: string;
  jobUrl?: string;
  location?: string;
  employmentType?: string;
  salaryRange?: string;
  status: ApplicationStatus;
  dateAdded: Date;
  dateApplied?: Date;
  lastUpdated: Date;
  notes?: string;
  targetRole?: string;
  jobAnalysisId?: string;
  analysisSnapshot?: ITrackedJobAnalysisSnapshot;
  nextAction?: ITrackedJobNextAction;
  createdAt: Date;
  updatedAt: Date;
}

const TrackedJobSchema = new Schema<ITrackedJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    jobDescription: {
      type: String,
      trim: true,
      maxlength: [50000, 'Job description cannot exceed 50,000 characters'],
    },
    source: {
      type: String,
      trim: true,
      default: 'Job Intelligence',
      maxlength: [100, 'Source cannot exceed 100 characters'],
    },
    jobUrl: {
      type: String,
      trim: true,
      maxlength: [2000, 'Job URL cannot exceed 2,000 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    employmentType: {
      type: String,
      trim: true,
      default: 'Full-time',
      maxlength: [50, 'Employment type cannot exceed 50 characters'],
    },
    salaryRange: {
      type: String,
      trim: true,
      maxlength: [100, 'Salary range cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
      default: 'SAVED',
      index: true,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    dateApplied: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [10000, 'Notes cannot exceed 10,000 characters'],
    },
    targetRole: {
      type: String,
      trim: true,
      maxlength: [200, 'Target role cannot exceed 200 characters'],
    },
    jobAnalysisId: {
      type: String,
      trim: true,
    },
    analysisSnapshot: {
      matchScore: { type: Number, min: 0, max: 100 },
      requiredSkills: [String],
      missingSkills: [String],
      matchedSkills: [String],
      evidenceBreakdown: [
        {
          skill: String,
          category: String,
          status: { type: String, enum: ['MATCHED', 'PARTIAL', 'NO_EVIDENCE'] },
          evidenceText: String,
          source: String,
        },
      ],
      gaps: [
        {
          skill: String,
          category: String,
          priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
          reason: String,
          actionType: String,
          actionLabel: String,
        },
      ],
      likelyInterviewTopics: [String],
      preparationStrategy: [String],
      overview: String,
    },
    nextAction: {
      label: String,
      actionType: {
        type: String,
        enum: ['arena', 'resume', 'system-design', 'analytics', 'profile', 'roadmap'],
        default: 'arena',
      },
      focusTopic: String,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user-scoped querying and sorting
TrackedJobSchema.index({ userId: 1, lastUpdated: -1 });
TrackedJobSchema.index({ userId: 1, status: 1 });
TrackedJobSchema.index({ userId: 1, company: 1, jobTitle: 1 });

export const TrackedJob = mongoose.model<ITrackedJob>('TrackedJob', TrackedJobSchema);
