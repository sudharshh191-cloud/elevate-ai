import mongoose, { Document, Schema } from 'mongoose';

export type OTPType = 'login' | 'reset_password' | 'verification';

export interface IOTP extends Document {
  email: string;
  otpHash: string;
  type: OTPType;
  attempts: number;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['login', 'reset_password', 'verification'],
      default: 'login',
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Auto-delete document after 10 minutes (600 seconds) via MongoDB TTL
    },
  },
  { timestamps: false }
);

// Compound index for fast queries
OTPSchema.index({ email: 1, type: 1 });

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);
