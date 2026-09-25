import mongoose, { Document, Schema, Types } from 'mongoose';

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
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'SYSTEM_DESIGN'
  | 'AI_ANALYSIS'
  | 'COMBINED';

export interface IRoadmapActionTarget {
  type: 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence' | 'roadmap';
  label: string;
  focusTopic?: string;
}

export interface IRoadmapItem extends Document {
  userId: Types.ObjectId;
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
  lastUpdatedReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapItemSchema = new Schema<IRoadmapItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'DSA',
        'Programming',
        'CS Fundamentals',
        'SQL',
        'Backend',
        'Frontend',
        'Full Stack',
        'System Design',
        'Cloud',
        'DevOps',
        'AI/ML',
        'Data',
        'Behavioral',
        'Interview',
        'Other',
      ],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    evidence: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: [
        'RESUME',
        'JOB_DESCRIPTION',
        'CODING',
        'ASSESSMENT',
        'INTERVIEW',
        'SYSTEM_DESIGN',
        'AI_ANALYSIS',
        'COMBINED',
      ],
      default: 'COMBINED',
    },
    recommendedActions: {
      type: [String],
      default: [],
    },
    actionTarget: {
      type: {
        type: String,
        enum: ['arena', 'resume', 'system-design', 'analytics', 'profile', 'job-intelligence', 'roadmap'],
        default: 'arena',
      },
      label: { type: String, default: 'Practice' },
      focusTopic: { type: String },
    },
    order: {
      type: Number,
      default: 0,
    },
    lastUpdatedReason: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to facilitate fast queries and deduplication per user + title
RoadmapItemSchema.index({ userId: 1, title: 1 });
RoadmapItemSchema.index({ userId: 1, status: 1, priority: 1 });

export const RoadmapItem = mongoose.model<IRoadmapItem>('RoadmapItem', RoadmapItemSchema);
