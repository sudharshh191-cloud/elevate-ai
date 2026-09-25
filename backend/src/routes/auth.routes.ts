import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Configure Multer memory storage for resume uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const originalNameLower = file.originalname.toLowerCase();
    const isAllowed = ['.pdf', '.docx', '.txt', '.md'].some((ext) => originalNameLower.endsWith(ext));
    if (isAllowed || file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT resume files are supported.'));
    }
  },
});

import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.middleware.js';

// Public Authentication Endpoints
router.post('/check-user', AuthController.checkUser);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/register', authRateLimiter, AuthController.register);
router.post('/send-otp', otpRateLimiter, AuthController.sendOtp);
router.post('/verify-otp', authRateLimiter, AuthController.verifyOtp);

// Password Reset Flow
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/verify-reset-token', authRateLimiter, AuthController.verifyResetToken);
router.post('/reset-password-token', authRateLimiter, AuthController.resetPasswordWithToken);
router.post('/reset-password', authRateLimiter, AuthController.resetPasswordWithToken);

// Protected Candidate Account & Profile Endpoints
router.get('/', requireAuth, AuthController.getProfile);
router.put('/', requireAuth, AuthController.updateProfile);
router.patch('/', requireAuth, AuthController.updateProfile);
router.get('/me', requireAuth, AuthController.getProfile);
router.get('/profile', requireAuth, AuthController.getProfile);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.patch('/profile', requireAuth, AuthController.updateProfile);
router.post('/onboarding', requireAuth, AuthController.saveOnboarding);
router.post('/parse-resume', requireAuth, upload.single('resumeFile'), AuthController.uploadAndParseResume);
router.post('/upload-resume', requireAuth, upload.single('resumeFile'), AuthController.uploadAndParseResume);

export default router;
