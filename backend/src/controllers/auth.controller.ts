import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser, calculateProfileCompleteness } from '../models/User.js';
import { OTP } from '../models/OTP.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { EmailService } from '../services/email.service.js';
import { ENV } from '../config/env.js';
import { isMongoConnected } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { NotificationController } from './notification.controller.js';
import { AdaptiveRoadmapService } from '../services/adaptiveRoadmap.service.js';

export class AuthController {
  /**
   * Helper to format sanitized user profile with all foundation data and completeness
   */
  static formatUser(user: any) {
    return {
      id: user._id?.toString() || user.id,
      _id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      userType: user.userType || 'JOB_SEEKER',
      onboardingCompleted: user.onboardingCompleted ?? false,
      avatar: user.avatar || '',
      headline: user.headline || '',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      website: user.website || '',
      githubUrl: user.githubUrl || '',
      linkedinUrl: user.linkedinUrl || '',
      targetRole: user.targetRole || 'Fullstack Engineer',
      trackLevel: user.trackLevel || user.experienceLevel || 'Intermediate',
      experienceLevel: user.experienceLevel || 'Mid',
      careerGoalObjective: user.careerGoalObjective || '',
      careerPreferences: user.careerPreferences || {
        preferredRoles: [],
        preferredLocations: [],
        workModes: [],
        industries: [],
      },
      skills: user.skills || [],
      education: user.education || [],
      experience: user.experience || [],
      projects: user.projects || [],
      certifications: user.certifications || [],
      achievements: user.achievements || [],
      languages: user.languages || [],
      studentProfile: user.studentProfile,
      professionalProfile: user.professionalProfile,
      careerSwitcherProfile: user.careerSwitcherProfile,
      resumeUrl: user.resumeUrl,
      stats: user.stats,
      parsedResumeData: user.parsedResumeData,
      profileCompleteness: calculateProfileCompleteness(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Seed default demo user in MongoDB if not already present
   */
  static async seedDemoUserIfMissing(): Promise<void> {
    try {
      if (!isMongoConnected()) return;
      const demoEmail = 'demo@ai-interview.io';
      const existing = await User.findOne({ email: demoEmail });
      if (!existing) {
        await User.create({
          name: 'Alex Vance',
          email: demoEmail,
          passwordHash: await bcrypt.hash('Password123!', 10),
          isVerified: true,
          userType: 'JOB_SEEKER',
          onboardingCompleted: true,
          targetRole: 'Senior Fullstack Engineer',
          trackLevel: 'Senior',
          experienceLevel: 'Senior',
          skills: [
            { name: 'React / TypeScript', level: 94, category: 'Frontend' },
            { name: 'Node.js / Express', level: 90, category: 'Backend' },
            { name: 'System Architecture', level: 86, category: 'Architecture' },
            { name: 'Distributed Redis & SQL', level: 82, category: 'Backend' },
            { name: 'Web Audio & Real-Time', level: 88, category: 'Frontend' },
            { name: 'CI/CD & Kubernetes', level: 78, category: 'DevOps' },
          ],
          parsedResumeData: {
            summary:
              'Senior Fullstack Software Engineer with 6+ years specializing in high-performance web systems, distributed caching, and micro-frontend architectures.',
            extractedSkills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Redis', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'WebSockets'],
            experienceYears: 6,
            atsScore: 94,
            targetRoleMatch: 92,
            recommendedFocusAreas: [
              'Distributed Consensus & Multi-Region Replication (Raft/Paxos)',
              'STAR Method Behavioral Structuring for Staff-Level Scenarios',
              'Advanced Audio Pacing & Filler Word Reduction',
            ],
          },
          stats: {
            totalInterviews: 16,
            completedInterviews: 14,
            averageScore: 88.5,
            domainScores: {
              Frontend: 93,
              Backend: 89,
              'System Design': 85,
              Behavioral: 88,
            },
            streakDays: 6,
            lastActiveDate: new Date(),
          },
        });
        console.log('✅ Default demo candidate seeded in MongoDB.');
      } else {
        if (existing.onboardingCompleted === undefined) {
          existing.onboardingCompleted = true;
          existing.userType = existing.userType || 'JOB_SEEKER';
          await existing.save();
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Demo user seeding skipped:', err.message);
    }
  }

  /**
   * POST /api/auth/check-user
   * Step 1: Checks if user exists in MongoDB to route to Password step vs Register step
   */
  static async checkUser(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.body;

      if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const email = identifier.trim().toLowerCase();
      const user = await User.findOne({ email });

      if (user) {
        res.json({
          exists: true,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified ?? true,
          targetRole: user.targetRole,
        });
      } else {
        res.json({
          exists: false,
          email,
          name: null,
          isVerified: false,
        });
      }
    } catch (error: any) {
      console.error('Check user error:', error);
      res.status(500).json({ error: error.message || 'User verification failed' });
    }
  }

  /**
   * POST /api/auth/login
   * Validates credentials with bcrypt, issues JWT, returns sanitized user profile
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, keepMeSignedIn = false } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        res.status(401).json({ error: 'No account found with this email address.' });
        return;
      }

      // Check if account is verified
      if (user.isVerified === false) {
        res.status(401).json({
          error: 'Please verify your email address before signing in. A verification code was sent to your email.',
          requireVerification: true,
          email: user.email,
        });
        return;
      }

      // Validate bcrypt password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Incorrect password. Please try again or reset your password.' });
        return;
      }

      const expiresIn = keepMeSignedIn ? '30d' : '7d';
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        ENV.JWT_SECRET,
        { expiresIn }
      );

      res.json({
        message: 'Signed in successfully',
        token,
        user: AuthController.formatUser(user),
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Login failed' });
    }
  }

  /**
   * POST /api/auth/register
   * Creates a new candidate account (unverified), sends 6-digit OTP to email, and requires verification before issuing JWT
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, confirmPassword, targetRole, experienceLevel } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check existing user in MongoDB
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser.isVerified) {
        res.status(400).json({ error: 'An account already exists with this email address.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const defaultSkills = [
        { name: 'TypeScript / JavaScript', level: 85, category: 'Technical' },
        { name: 'System Architecture', level: 75, category: 'System Design' },
        { name: 'Data Structures & Algorithms', level: 80, category: 'Technical' },
      ];

      if (existingUser && !existingUser.isVerified) {
        existingUser.name = name.trim();
        existingUser.passwordHash = passwordHash;
        existingUser.targetRole = targetRole || 'Fullstack Engineer';
        existingUser.experienceLevel = (experienceLevel as any) || 'Mid';
        existingUser.onboardingCompleted = false;
        await existingUser.save();
      } else {
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          isVerified: false,
          userType: 'JOB_SEEKER',
          onboardingCompleted: false,
          targetRole: targetRole || 'Fullstack Engineer',
          trackLevel: 'Intermediate',
          experienceLevel: (experienceLevel as any) || 'Mid',
          skills: defaultSkills,
          stats: {
            totalInterviews: 0,
            completedInterviews: 0,
            averageScore: 0,
            domainScores: {},
            streakDays: 1,
            lastActiveDate: new Date(),
          },
        });
      }

      // Generate 6-digit numeric OTP (100000 - 999999)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 8);

      // Save to MongoDB OTP collection
      await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });
      await OTP.create({
        email: normalizedEmail,
        otpHash,
        type: 'verification',
        attempts: 0,
      });

      // Dispatch real email via Nodemailer SMTP
      const sendResult = await EmailService.sendOtpEmail(normalizedEmail, otp, 'verification');

      res.status(201).json({
        message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
        email: normalizedEmail,
        requireOtp: true,
        expiresInSeconds: 600,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Registration failed' });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Generates a single-use cryptographically secure reset token, stores hash in MongoDB, and dispatches email via Nodemailer SMTP
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        // Return generic success to avoid user enumeration
        res.json({
          message: 'If an account exists with this email, a password reset link has been dispatched.',
          success: true,
        });
        return;
      }

      // Generate 32-byte cryptographically secure random hex token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // 15-minute expiration
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Invalidate any previous reset tokens for this user
      await PasswordResetToken.deleteMany({ userId: user._id });

      // Save hashed token in MongoDB
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
        usedAt: null,
      });

      // Construct frontend reset URL
      const origin = req.headers.origin || ENV.CORS_ORIGIN || 'http://localhost:5173';
      const resetLink = `${origin}/reset-password?token=${rawToken}`;

      // Dispatch HTML email via Nodemailer SMTP
      await EmailService.sendPasswordResetEmail(user.email, resetLink, user.name);

      res.json({
        message: 'A password reset link has been sent to your email address.',
        success: true,
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: error.message || 'Failed to process password reset' });
    }
  }

  /**
   * POST /api/auth/verify-reset-token
   * Validates if a reset token is valid, unexpired, and not yet used
   */
  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const token = (req.body.token || req.query.token) as string;

      if (!token) {
        res.status(400).json({ valid: false, error: 'Reset token is required.' });
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const resetDoc = await PasswordResetToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }).populate('userId', 'email name');

      if (!resetDoc || !resetDoc.userId) {
        res.status(400).json({
          valid: false,
          error: 'This password reset link is invalid or has expired. Please request a new one.',
        });
        return;
      }

      const user = resetDoc.userId as any;
      res.json({
        valid: true,
        email: user.email,
        name: user.name,
      });
    } catch (error: any) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ valid: false, error: 'Failed to verify token' });
    }
  }

  /**
   * POST /api/auth/reset-password-with-token
   * Validates reset token and updates user password in MongoDB
   */
  static async resetPasswordWithToken(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required.' });
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match.' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const resetDoc = await PasswordResetToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });

      if (!resetDoc) {
        res.status(400).json({
          error: 'This reset token is invalid or has expired. Please request a new password reset.',
        });
        return;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update User in MongoDB
      await User.findByIdAndUpdate(resetDoc.userId, { passwordHash });

      // Invalidate and delete token
      resetDoc.usedAt = new Date();
      await resetDoc.save();
      await PasswordResetToken.deleteOne({ _id: resetDoc._id });

      res.json({
        message: 'Password successfully updated! You can now sign in with your new password.',
        success: true,
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: error.message || 'Failed to update password' });
    }
  }

  /**
   * POST /api/auth/send-otp
   * Generates secure 6-digit numeric OTP, bcrypt hashes it, and persists with 600s TTL in MongoDB
   */
  static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, type = 'login' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email address is required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists for reset_password or login or verification
      if (type === 'reset_password' || type === 'login' || type === 'verification') {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          res.status(404).json({ error: 'No account found with this email address.' });
          return;
        }
      }

      // Generate 6-digit numeric OTP (100000 - 999999)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 8);

      // Save to MongoDB with TTL auto-expiry
      await OTP.deleteMany({ email: normalizedEmail, type });
      await OTP.create({
        email: normalizedEmail,
        otpHash,
        type,
        attempts: 0,
      });

      // Dispatch HTML email via Nodemailer Gmail transport
      const sendResult = await EmailService.sendOtpEmail(normalizedEmail, otp, type);

      res.json({
        message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
        email: normalizedEmail,
        type,
        expiresInSeconds: 600,
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Validates 6-digit PIN against MongoDB hash
   */
  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, type = 'login' } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const record = await OTP.findOne({ email: normalizedEmail, type });

      if (!record) {
        res.status(400).json({
          error: 'Verification code has expired or was not requested. Please request a new code.',
        });
        return;
      }

      // Check max attempts
      if (record.attempts >= 5) {
        res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      // Verify OTP hash
      const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);
      if (!isMatch) {
        await OTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
        res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
        return;
      }

      // Delete used OTP from MongoDB
      await OTP.deleteOne({ _id: record._id });

      // Route based on OTP Type
      if (type === 'login' || type === 'verification') {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        if (type === 'verification') {
          user.isVerified = true;
          await user.save();
        }

        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email },
          ENV.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: type === 'verification' ? 'Email verified successfully' : 'Signed in with OTP successfully',
          token,
          user: AuthController.formatUser(user),
        });
      } else if (type === 'reset_password') {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          res.status(404).json({ error: 'No account found with this email address.' });
          return;
        }

        // Generate 32-byte cryptographically secure single-use reset token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 15-minute expiration
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Invalidate any previous reset tokens for this user
        await PasswordResetToken.deleteMany({ userId: user._id });

        // Save hashed token in MongoDB
        await PasswordResetToken.create({
          userId: user._id,
          tokenHash,
          expiresAt,
          usedAt: null,
        });

        res.json({
          message: 'OTP verified successfully. You can now reset your password.',
          verified: true,
          resetToken: rawToken,
          email: normalizedEmail,
        });
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: error.message || 'Verification failed' });
    }
  }

  /**
   * GET /api/auth/profile
   * Retrieves authenticated profile from MongoDB using validated JWT
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userIdentifier = req.user?.userId;
      const userEmail = req.user?.email;

      let user = null;
      if (userIdentifier) {
        user = await User.findById(userIdentifier);
      } else if (userEmail) {
        user = await User.findOne({ email: userEmail });
      }

      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      const formatted = AuthController.formatUser(user);
      res.json({
        user: formatted,
        completeness: formatted.profileCompleteness,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/parse-resume
   * Connects to Python FastAPI NLP service to parse real PDF/DOCX/TXT resume or raw text, extract skills, and persist to MongoDB
   */
  static async uploadAndParseResume(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;

      if (!userId && !userEmail) {
        res.status(401).json({ error: 'Authentication required to parse and save resume.' });
        return;
      }

      // Look up user to retrieve existing targetRole if not explicitly supplied
      const user = await User.findOne({ $or: [{ _id: userId }, { email: userEmail }] });
      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      const rawTargetRole = typeof req.body?.targetRole === 'string' ? req.body.targetRole.trim() : '';
      const targetRole = rawTargetRole || user.targetRole || 'Software Engineer';
      const rawText = req.body?.rawText;
      const uploadedFile = req.file;

      if (!uploadedFile && (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0)) {
        res.status(400).json({ error: 'Please upload a PDF/DOCX resume file or provide resume text for parsing.' });
        return;
      }

      const pythonBaseUrl = ENV.PYTHON_NLP_SERVICE_URL || 'http://localhost:8000';
      let parsedData: any;

      if (uploadedFile) {
        // 1. Process real binary file (PDF, DOCX, TXT) via Python NLP service
        try {
          const pythonFileUrl = `${pythonBaseUrl}/parse-resume-file`;
          console.log(`📡 [ResumeParser] Sending file (${uploadedFile.originalname}, ${uploadedFile.size} bytes) to Python NLP at: ${pythonFileUrl}`);

          const formData = new FormData();
          const fileBlob = new Blob([new Uint8Array(uploadedFile.buffer)], { type: uploadedFile.mimetype || 'application/pdf' });
          formData.append('file', fileBlob, uploadedFile.originalname);
          formData.append('target_role', targetRole);

          const nlpResponse = await fetch(pythonFileUrl, {
            method: 'POST',
            body: formData,
          });

          if (!nlpResponse.ok) {
            const errData: any = await nlpResponse.json().catch(() => ({ detail: 'Failed to extract text from resume file' }));
            res.status(nlpResponse.status || 400).json({
              error: errData.detail || errData.message || 'Failed to extract text from resume file.',
            });
            return;
          }

          const nlpData = await nlpResponse.json();
          parsedData = {
            rawText: uploadedFile.originalname,
            summary: nlpData.summary,
            extractedSkills: nlpData.extracted_skills || [],
            experienceYears: nlpData.experience_years || 0,
            targetRoleMatch: nlpData.target_role_match || 0,
            atsScore: nlpData.ats_score || 0,
            recommendedFocusAreas: nlpData.recommended_focus_areas || [],
            education: nlpData.education || [],
            workHighlights: nlpData.work_highlights || [],
          };
          console.log(`✅ [ResumeParser] Python service extracted ${parsedData.extractedSkills.length} skills from ${uploadedFile.originalname}.`);
        } catch (fetchErr: any) {
          console.error('Python NLP service error:', fetchErr);
          res.status(503).json({
            error: 'Python NLP service is currently unavailable. Please ensure the NLP microservice is running on port 8000.',
          });
          return;
        }
      } else if (rawText) {
        // 2. Process raw text via Python NLP service
        try {
          const pythonTextUrl = `${pythonBaseUrl}/parse-resume`;
          console.log(`📡 [ResumeParser] Sending text (${rawText.length} chars) to Python NLP at: ${pythonTextUrl}`);

          const nlpResponse = await fetch(pythonTextUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw_text: rawText.trim(),
              target_role: targetRole,
            }),
          });

          if (!nlpResponse.ok) {
            const errData: any = await nlpResponse.json().catch(() => ({ detail: 'Failed to parse resume text' }));
            res.status(nlpResponse.status || 400).json({
              error: errData.detail || errData.message || 'Failed to parse resume text.',
            });
            return;
          }

          const nlpData = await nlpResponse.json();
          parsedData = {
            rawText: rawText.trim().slice(0, 1000),
            summary: nlpData.summary,
            extractedSkills: nlpData.extracted_skills || [],
            experienceYears: nlpData.experience_years || 0,
            targetRoleMatch: nlpData.target_role_match || 0,
            atsScore: nlpData.ats_score || 0,
            recommendedFocusAreas: nlpData.recommended_focus_areas || [],
            education: nlpData.education || [],
            workHighlights: nlpData.work_highlights || [],
          };
          console.log(`✅ [ResumeParser] Python service extracted ${parsedData.extractedSkills.length} skills from text.`);
        } catch (fetchErr: any) {
          console.error('Python NLP service error:', fetchErr);
          res.status(503).json({
            error: 'Python NLP service is currently unavailable. Please ensure the NLP microservice is running on port 8000.',
          });
          return;
        }
      }

      // 3. Persist to MongoDB User Record
      user.parsedResumeData = parsedData;
      if (rawTargetRole) {
        user.targetRole = rawTargetRole;
      }

      if (parsedData.extractedSkills && parsedData.extractedSkills.length > 0) {
        user.skills = parsedData.extractedSkills.map((s: string) => ({
          name: s,
          level: 85,
          category: 'Technical',
        }));
      }

      await user.save();

      // Trigger in-app notification in MongoDB
      await NotificationController.createNotification({
        userId: user._id,
        type: 'resume_parsed',
        title: 'Resume Analysis Complete',
        message: `Your resume was analyzed with ATS score ${parsedData.atsScore}% and ${parsedData.extractedSkills.length} competencies indexed.`,
        referenceType: 'Resume',
      });

      // Trigger Adaptive Roadmap updates from resume insights
      try {
        await AdaptiveRoadmapService.recordResumeUpdate(
          user._id,
          parsedData.extractedSkills || [],
          parsedData.recommendedFocusAreas || []
        );
      } catch (err: any) {
        console.error('Error updating roadmap from resume upload:', err);
      }

      res.json({
        message: 'Resume successfully parsed, skills indexed, and candidate profile updated in MongoDB',
        parsedData,
        user: AuthController.formatUser(user),
      });
    } catch (error: any) {
      console.error('Resume parsing error:', error);
      res.status(500).json({ error: error.message || 'Resume parsing failed' });
    }
  }

  /**
   * POST /api/auth/onboarding
   * Saves onboarding details and sets onboardingCompleted to true
   */
  static async saveOnboarding(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userIdentifier = req.user?.userId;
      const userEmail = req.user?.email;

      let user = null;
      if (userIdentifier) {
        user = await User.findById(userIdentifier);
      } else if (userEmail) {
        user = await User.findOne({ email: userEmail });
      }

      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      const oldRole = user.targetRole;

      const {
        userType,
        targetRole,
        trackLevel,
        experienceLevel,
        studentProfile,
        professionalProfile,
        careerSwitcherProfile,
        skills,
      } = req.body;

      if (userType) {
        user.userType = userType;
      }
      user.onboardingCompleted = true;

      if (targetRole) {
        user.targetRole = targetRole;
      }
      if (trackLevel) {
        user.trackLevel = trackLevel;
        const lvl = trackLevel.toLowerCase();
        if (user.userType === 'PROFESSIONAL') {
          if (lvl.includes('principal') || lvl.includes('staff')) user.experienceLevel = 'Staff';
          else if (lvl.includes('manager') || lvl.includes('lead')) user.experienceLevel = 'Lead';
          else if (lvl.includes('senior')) user.experienceLevel = 'Senior';
          else user.experienceLevel = 'Mid';
        } else if (user.userType === 'STUDENT' || user.userType === 'CAREER_SWITCHER') {
          user.experienceLevel = 'Junior';
        } else {
          if (lvl.includes('senior')) user.experienceLevel = 'Senior';
          else if (lvl.includes('mid')) user.experienceLevel = 'Mid';
          else if (lvl.includes('lead')) user.experienceLevel = 'Lead';
          else user.experienceLevel = 'Junior';
        }
      } else if (experienceLevel) {
        user.experienceLevel = experienceLevel;
        user.trackLevel = experienceLevel;
      }

      if (userType === 'STUDENT' && studentProfile) {
        user.studentProfile = {
          ...user.studentProfile,
          ...studentProfile,
        };
        if (studentProfile.targetJobRoles && studentProfile.targetJobRoles.length > 0 && !targetRole) {
          user.targetRole = studentProfile.targetJobRoles[0];
        }
      } else if (userType === 'PROFESSIONAL' && professionalProfile) {
        user.professionalProfile = {
          ...user.professionalProfile,
          ...professionalProfile,
        };
        if (professionalProfile.targetRole && !targetRole) {
          user.targetRole = professionalProfile.targetRole;
        }
      } else if (userType === 'CAREER_SWITCHER' && careerSwitcherProfile) {
        user.careerSwitcherProfile = {
          ...user.careerSwitcherProfile,
          ...careerSwitcherProfile,
        };
        if (careerSwitcherProfile.targetCareerRole && !targetRole) {
          user.targetRole = careerSwitcherProfile.targetCareerRole;
        }
      }

      if (skills && Array.isArray(skills) && skills.length > 0) {
        user.skills = skills;
      } else if (userType === 'STUDENT' && studentProfile) {
        const langSkills = studentProfile.programmingLanguages || [];
        const techSkills = studentProfile.technicalSkills || [];
        const combined = Array.from(new Set([...langSkills, ...techSkills]));
        if (combined.length > 0) {
          user.skills = combined.map((s: string) => ({
            name: s,
            level: 75,
            category: 'Technical',
          }));
        }
      } else if (userType === 'PROFESSIONAL' && professionalProfile?.currentSkills?.length) {
        user.skills = professionalProfile.currentSkills.map((s: string) => ({
          name: s,
          level: 85,
          category: 'Technical',
        }));
      } else if (userType === 'CAREER_SWITCHER' && careerSwitcherProfile?.currentSkills?.length) {
        user.skills = careerSwitcherProfile.currentSkills.map((s: string) => ({
          name: s,
          level: 70,
          category: 'Technical',
        }));
      }

      await user.save();

      // Trigger notification for completing onboarding
      await NotificationController.createNotification({
        userId: user._id,
        type: 'system_alert',
        title: 'Profile Configured 🎉',
        message: `Welcome to ELEVATE.AI! Your profile has been customized for ${user.userType === 'STUDENT' ? 'Student Campus Placements' : user.userType === 'PROFESSIONAL' ? 'Senior Professional Growth' : user.userType === 'CAREER_SWITCHER' ? 'Career Transition' : 'Job Seeker Practice'}. Target Role: ${user.targetRole} (${user.trackLevel || user.experienceLevel}).`,
        referenceType: 'System',
      });

      // Align adaptive roadmap with new target role
      if (user.targetRole) {
        try {
          await AdaptiveRoadmapService.recordTargetRoleChange(
            user._id,
            oldRole || '',
            user.targetRole,
            user.trackLevel || user.experienceLevel || 'Intermediate'
          );
        } catch (err: any) {
          console.error('Error updating roadmap from onboarding role change:', err);
        }
      }

      res.json({
        message: 'Onboarding completed successfully',
        user: AuthController.formatUser(user),
      });
    } catch (error: any) {
      console.error('Save onboarding error:', error);
      res.status(500).json({ error: error.message || 'Failed to save onboarding profile' });
    }
  }

  /**
   * PUT /api/auth/profile
   * Updates user profile fields
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userIdentifier = req.user?.userId;
      const userEmail = req.user?.email;

      let user = null;
      if (userIdentifier) {
        user = await User.findById(userIdentifier);
      } else if (userEmail) {
        user = await User.findOne({ email: userEmail });
      }

      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      const oldRole = user.targetRole;

      const {
        name,
        avatar,
        headline,
        bio,
        location,
        phone,
        website,
        githubUrl,
        linkedinUrl,
        targetRole,
        trackLevel,
        experienceLevel,
        userType,
        careerGoalObjective,
        careerPreferences,
        education,
        experience,
        projects,
        certifications,
        achievements,
        languages,
        skills,
        studentProfile,
        professionalProfile,
        careerSwitcherProfile,
      } = req.body;

      if (typeof name === 'string' && name.trim()) user.name = name.trim();
      if (typeof avatar === 'string') user.avatar = avatar.trim();
      if (typeof headline === 'string') user.headline = headline.trim();
      if (typeof bio === 'string') user.bio = bio.trim();
      if (typeof location === 'string') user.location = location.trim();
      if (typeof phone === 'string') user.phone = phone.trim();
      if (typeof website === 'string') user.website = website.trim();
      if (typeof githubUrl === 'string') user.githubUrl = githubUrl.trim();
      if (typeof linkedinUrl === 'string') user.linkedinUrl = linkedinUrl.trim();

      if (typeof targetRole === 'string' && targetRole.trim()) user.targetRole = targetRole.trim();
      if (typeof userType === 'string' && ['STUDENT', 'JOB_SEEKER', 'PROFESSIONAL', 'CAREER_SWITCHER'].includes(userType)) {
        user.userType = userType as any;
      }
      if (typeof careerGoalObjective === 'string') user.careerGoalObjective = careerGoalObjective.trim();
      if (careerPreferences && typeof careerPreferences === 'object') {
        user.careerPreferences = {
          preferredRoles: Array.isArray(careerPreferences.preferredRoles) ? careerPreferences.preferredRoles : user.careerPreferences?.preferredRoles || [],
          preferredLocations: Array.isArray(careerPreferences.preferredLocations) ? careerPreferences.preferredLocations : user.careerPreferences?.preferredLocations || [],
          workModes: Array.isArray(careerPreferences.workModes) ? careerPreferences.workModes : user.careerPreferences?.workModes || [],
          industries: Array.isArray(careerPreferences.industries) ? careerPreferences.industries : user.careerPreferences?.industries || [],
        };
      }

      if (trackLevel) {
        user.trackLevel = trackLevel;
        const lvl = trackLevel.toLowerCase();
        if (user.userType === 'PROFESSIONAL') {
          if (lvl.includes('principal') || lvl.includes('staff')) user.experienceLevel = 'Staff';
          else if (lvl.includes('manager') || lvl.includes('lead')) user.experienceLevel = 'Lead';
          else if (lvl.includes('senior')) user.experienceLevel = 'Senior';
          else user.experienceLevel = 'Mid';
        } else if (user.userType === 'STUDENT' || user.userType === 'CAREER_SWITCHER') {
          user.experienceLevel = 'Junior';
        } else {
          if (lvl.includes('senior')) user.experienceLevel = 'Senior';
          else if (lvl.includes('mid')) user.experienceLevel = 'Mid';
          else if (lvl.includes('lead')) user.experienceLevel = 'Lead';
          else user.experienceLevel = 'Junior';
        }
      } else if (experienceLevel) {
        user.experienceLevel = experienceLevel;
        user.trackLevel = experienceLevel;
      }

      if (Array.isArray(education)) user.education = education;
      if (Array.isArray(experience)) user.experience = experience;
      if (Array.isArray(projects)) user.projects = projects;
      if (Array.isArray(certifications)) user.certifications = certifications;
      if (Array.isArray(achievements)) user.achievements = achievements;
      if (Array.isArray(languages)) user.languages = languages;
      if (Array.isArray(skills)) user.skills = skills;

      if (studentProfile && typeof studentProfile === 'object') {
        user.studentProfile = { ...user.studentProfile, ...studentProfile };
      }
      if (professionalProfile && typeof professionalProfile === 'object') {
        user.professionalProfile = { ...user.professionalProfile, ...professionalProfile };
      }
      if (careerSwitcherProfile && typeof careerSwitcherProfile === 'object') {
        user.careerSwitcherProfile = { ...user.careerSwitcherProfile, ...careerSwitcherProfile };
      }

      await user.save();

      // Trigger adaptive roadmap re-alignment if target role was modified
      if (user.targetRole && oldRole && oldRole.toLowerCase() !== user.targetRole.toLowerCase()) {
        try {
          await AdaptiveRoadmapService.recordTargetRoleChange(
            user._id,
            oldRole,
            user.targetRole,
            user.trackLevel || user.experienceLevel || 'Intermediate'
          );
        } catch (err: any) {
          console.error('Error updating roadmap from profile target role update:', err);
        }
      }

      const formatted = AuthController.formatUser(user);

      res.json({
        message: 'Profile updated successfully',
        user: formatted,
        completeness: formatted.profileCompleteness,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  }
}
