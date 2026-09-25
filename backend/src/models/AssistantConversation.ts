import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssistantMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  whyThisMatters?: string;
  suggestedActions?: Array<{
    label: string;
    type: 'PRACTICE' | 'RESUME' | 'JOB_INTELLIGENCE' | 'INTERVIEW' | 'SYSTEM_DESIGN' | 'ROADMAP' | 'PROFILE';
    route: string;
    focusTopic?: string;
  }>;
  timestamp: Date;
}

export interface IAssistantConversation extends Document {
  userId: Types.ObjectId;
  messages: IAssistantMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AssistantMessageSchema = new Schema<IAssistantMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    whyThisMatters: { type: String },
    suggestedActions: [
      {
        label: { type: String, required: true },
        type: {
          type: String,
          enum: [
            'PRACTICE',
            'RESUME',
            'JOB_INTELLIGENCE',
            'INTERVIEW',
            'SYSTEM_DESIGN',
            'ROADMAP',
            'PROFILE',
          ],
          required: true,
        },
        route: { type: String, required: true, default: 'dashboard' },
        focusTopic: { type: String },
      },
    ],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AssistantConversationSchema = new Schema<IAssistantConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    messages: { type: [AssistantMessageSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const AssistantConversation = mongoose.model<IAssistantConversation>(
  'AssistantConversation',
  AssistantConversationSchema
);
export default AssistantConversation;
