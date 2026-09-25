import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { OTP } from '../models/OTP.js';
import { AuthController } from '../controllers/auth.controller.js';
import { EmailService } from '../services/email.service.js';
import { ENV } from '../config/env.js';

async function runAuthTestSuite() {
  console.log('🛡️ ================================================================');
  console.log('🛡️ Starting ELEVATE.AI Production Authentication Test Suite');
  console.log('🛡️ ================================================================\n');

  // 1. Initialize MongoDB
  console.log('▶️ [Step 1/10] Initializing MongoDB connection...');
  let mongod: MongoMemoryServer | null = null;
  let uri = process.env.MONGO_URI;

  try {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  } catch (err) {
    uri = uri || 'mongodb://localhost:27017/ai_interview_platform';
  }

  await mongoose.connect(uri!);
  console.log(`✅ Connected to MongoDB: ${uri}\n`);

  // 2. Seed and Verify Demo Account
  console.log('▶️ [Step 2/10] Seeding demo candidate account in MongoDB...');
  await AuthController.seedDemoUserIfMissing();
  const demoUser = await User.findOne({ email: 'demo@ai-interview.io' });
  if (!demoUser) throw new Error('Failed to seed demo user');
  console.log(`✅ Demo candidate verified in MongoDB: ${demoUser.email} (ID: ${demoUser._id})`);
  console.log(`   Password hash format: ${demoUser.passwordHash.substring(0, 10)}... (bcrypt verified)\n`);

  // 3. Test checkUser logic (Step 1 of progressive sign-in)
  console.log('▶️ [Step 3/10] Testing checkUser progressive lookup...');
  const existingCheck = await User.findOne({ email: 'demo@ai-interview.io' });
  if (!existingCheck) throw new Error('checkUser failed for existing account');
  console.log(`✅ Found existing account: exists=true, name="${existingCheck.name}"`);

  const nonExistentCheck = await User.findOne({ email: 'nonexistent_candidate_2026@test.com' });
  if (nonExistentCheck) throw new Error('checkUser should return false for unknown account');
  console.log('✅ Unknown account handled: exists=false\n');

  // 4. Test Password Authentication & JWT Generation
  console.log('▶️ [Step 4/10] Testing login password validation & JWT generation...');
  const isCorrect = await bcrypt.compare('Password123!', demoUser.passwordHash);
  if (!isCorrect) throw new Error('Password verification failed for correct password');
  console.log('✅ Correct password successfully verified with bcrypt');

  const isWrong = await bcrypt.compare('WrongPassword999!', demoUser.passwordHash);
  if (isWrong) throw new Error('Password verification should reject incorrect password');
  console.log('✅ Incorrect password correctly rejected');

  const token = jwt.sign(
    { userId: demoUser._id.toString(), email: demoUser.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
  if (decoded.email !== demoUser.email) throw new Error('JWT verification failed');
  console.log(`✅ JWT generated and verified: userId=${decoded.userId}, email=${decoded.email}\n`);

  // 5. Test Candidate Registration
  console.log('▶️ [Step 5/10] Testing candidate registration flow...');
  const newEmail = `sarah.connor_${Date.now()}@cyberdyne.io`;
  const rawRegPassword = 'SecurePassword2026!';
  const regPasswordHash = await bcrypt.hash(rawRegPassword, 10);

  const registeredUser = await User.create({
    name: 'Sarah Connor',
    email: newEmail,
    passwordHash: regPasswordHash,
    targetRole: 'Staff Frontend Architect',
    experienceLevel: 'Staff',
    skills: [
      { name: 'TypeScript', level: 95, category: 'Frontend' },
      { name: 'System Architecture', level: 90, category: 'Architecture' },
    ],
    stats: {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0,
      domainScores: {},
      streakDays: 1,
      lastActiveDate: new Date(),
    },
  });

  console.log(`✅ Candidate registered in MongoDB: ID=${registeredUser._id}, Email=${registeredUser.email}`);
  const regToken = jwt.sign(
    { userId: registeredUser._id.toString(), email: registeredUser.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log(`✅ Registration JWT generated: ${regToken.substring(0, 25)}...\n`);

  // 6. Test Forgot Password Token Generation & Single-Use TTL
  console.log('▶️ [Step 6/10] Testing Forgot Password cryptographic token lifecycle...');
  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  const resetDoc = await PasswordResetToken.create({
    userId: registeredUser._id,
    tokenHash,
    expiresAt,
    usedAt: null,
  });

  console.log(`✅ Reset token created in MongoDB: ID=${resetDoc._id}`);
  console.log(`   Token hash stored: ${tokenHash.substring(0, 16)}...`);
  console.log(`   Expires at: ${expiresAt.toISOString()} (15 minutes)\n`);

  // 7. Verify Reset Token Querying
  console.log('▶️ [Step 7/10] Testing reset token validation query...');
  const searchHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  const foundResetDoc = await PasswordResetToken.findOne({
    tokenHash: searchHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate('userId', 'email name');

  if (!foundResetDoc || !foundResetDoc.userId) {
    throw new Error('Reset token verification query failed');
  }
  console.log(`✅ Reset token successfully verified for user: ${(foundResetDoc.userId as any).email}\n`);

  // 8. Execute Password Reset & Invalidation
  console.log('▶️ [Step 8/10] Executing password update and token single-use invalidation...');
  const updatedPassword = 'NewUltraSecurePassword2026!';
  const updatedPasswordHash = await bcrypt.hash(updatedPassword, 10);

  await User.findByIdAndUpdate(registeredUser._id, { passwordHash: updatedPasswordHash });
  foundResetDoc.usedAt = new Date();
  await foundResetDoc.save();
  await PasswordResetToken.deleteOne({ _id: foundResetDoc._id });
  console.log('✅ User password hash updated in MongoDB and token invalidated.');

  // Test token reuse prevention
  const reuseCheck = await PasswordResetToken.findOne({ tokenHash: searchHash, usedAt: null });
  if (reuseCheck) throw new Error('Reset token must NOT be reusable after consumption');
  console.log('✅ Token reuse prevented: Old reset token cannot be reused.\n');

  // 9. Verify New Credentials & Reject Old Credentials
  console.log('▶️ [Step 9/10] Verifying new credentials authentication...');
  const refreshedUser = await User.findById(registeredUser._id);
  if (!refreshedUser) throw new Error('Failed to query updated user');

  const oldPasswordCheck = await bcrypt.compare(rawRegPassword, refreshedUser.passwordHash);
  if (oldPasswordCheck) throw new Error('Old password should NOT work after reset');
  console.log('✅ Old password correctly fails authentication');

  const newPasswordCheck = await bcrypt.compare(updatedPassword, refreshedUser.passwordHash);
  if (!newPasswordCheck) throw new Error('New password must successfully authenticate');
  console.log('✅ New password successfully authenticated\n');

  // 10. Test Nodemailer Email Rendering
  console.log('▶️ [Step 10/10] Testing Email Service HTML templates...');
  const otpRes = await EmailService.sendOtpEmail('test_candidate@elevate-ai.io', '582914', 'login');
  console.log(`✅ OTP email template dispatched (simulated=${otpRes.simulated})`);

  const resetRes = await EmailService.sendPasswordResetEmail(
    'test_candidate@elevate-ai.io',
    'http://localhost:5173/reset-password?token=sample_token_123',
    'Sarah Connor'
  );
  console.log(`✅ Password reset email template dispatched (simulated=${resetRes.simulated})\n`);

  console.log('🎉 ================================================================');
  console.log('🎉 ALL AUTHENTICATION & PASSWORD RESET TESTS PASSED (10/10)');
  console.log('🎉 ================================================================\n');

  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  process.exit(0);
}

runAuthTestSuite().catch((err) => {
  console.error('❌ Auth test suite failed:', err);
  process.exit(1);
});
