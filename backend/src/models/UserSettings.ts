import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserSettings extends Document {
  userId: Types.ObjectId;
  theme: 'dark' | 'executive_hybrid' | 'light';
  audioSensitivity: number; // 0 - 100
  preferredDomain: string;
  preferredDifficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
  preferredFormat: 'Voice' | 'Code' | 'Hybrid';
  enableVoiceAvatar: boolean;
  enableLiveCoaching: boolean;
  enableSoundEffects: boolean;
  notifications: {
    emailAlerts: boolean;
    weeklyProgressSummary: boolean;
    interviewReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: {
      type: String,
      enum: ['dark', 'executive_hybrid', 'light'],
      default: 'executive_hybrid',
    },
    audioSensitivity: { type: Number, min: 0, max: 100, default: 80 },
    preferredDomain: { type: String, default: 'Frontend' },
    preferredDifficulty: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'],
      default: 'Senior',
    },
    preferredFormat: {
      type: String,
      enum: ['Voice', 'Code', 'Hybrid'],
      default: 'Hybrid',
    },
    enableVoiceAvatar: { type: Boolean, default: true },
    enableLiveCoaching: { type: Boolean, default: true },
    enableSoundEffects: { type: Boolean, default: true },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      weeklyProgressSummary: { type: Boolean, default: true },
      interviewReminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
