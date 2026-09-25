import React, { useState, useEffect } from 'react';
import { X, Lock, Sparkles, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { SignInStepOne } from './SignInStepOne';
import { PasswordStep } from './PasswordStep';
import { OtpVerifyStep } from './OtpVerifyStep';
import { RegisterStep } from './RegisterStep';
import { ResetPasswordStep } from './ResetPasswordStep';
import { ApiService } from '../../services/api';
import { useAuth, AuthModalMode } from '../../context/AuthContext';

export type AuthFlowStep =
  | 'step1'
  | 'password'
  | 'otp'
  | 'register'
  | 'forgot_email'
  | 'new_password';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    promptFeatureName,
    closeAuthModal,
    login,
    loginWithOtp,
    register,
  } = useAuth();

  const [currentStep, setCurrentStep] = useState<AuthFlowStep>('step1');
  const [identifier, setIdentifier] = useState('demo@ai-interview.io');
  const [userName, setUserName] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<'login' | 'reset_password' | 'verification'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [accountNotFoundPrompt, setAccountNotFoundPrompt] = useState(false);

  // Sync modal mode when opened
  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setSuccessBanner(null);
      setAccountNotFoundPrompt(false);
      setResetToken(null);
      if (authModalMode === 'register') {
        setCurrentStep('register');
      } else if (authModalMode === 'forgot_password') {
        setCurrentStep('forgot_email');
      } else {
        setCurrentStep('step1');
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  // Step 1: Check User Existence
  const handleCheckUser = async (inputVal: string) => {
    setIsLoading(true);
    setError(null);
    setAccountNotFoundPrompt(false);
    try {
      setIdentifier(inputVal);
      const res = await ApiService.checkUser(inputVal);
      if (res.exists) {
        setUserName(res.name || null);
        setCurrentStep('password');
      } else {
        setUserName(null);
        setAccountNotFoundPrompt(true);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to check account');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Sign In
  const handlePasswordSignIn = async (password: string, keepMeSignedIn: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(identifier, password, keepMeSignedIn);
    } catch (err: any) {
      setError(err.message || 'Incorrect password. Please try again or reset your password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request OTP Login
  const handleRequestOtpLogin = async () => {
    setIsSendingOtp(true);
    setError(null);
    try {
      setOtpType('login');
      await ApiService.sendOtp(identifier, 'login');
      setCurrentStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Trigger Forgot Password OTP Flow
  const handleSendForgotOtp = async () => {
    if (!identifier || !identifier.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setOtpType('reset_password');
      await ApiService.sendOtp(identifier, 'reset_password');
      setCurrentStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (otpType === 'reset_password') {
        const res = await ApiService.verifyOtp(identifier, otp, 'reset_password');
        if (res.resetToken) {
          setResetToken(res.resetToken);
          setCurrentStep('new_password');
        } else {
          throw new Error('Failed to verify password reset code');
        }
      } else {
        await loginWithOtp(identifier, otp, otpType);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid passcode');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit New Password
  const handleResetPasswordSubmit = async (newPassword: string) => {
    if (!resetToken) {
      setError('Reset token is missing or expired. Please request a new verification code.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.resetPasswordWithToken(resetToken, newPassword, newPassword);
      setSuccessBanner(res.message || 'Password successfully updated! Please sign in with your new password.');
      setResetToken(null);
      setCurrentStep('password');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration
  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const finalEmail = data.email.trim().toLowerCase();
      setIdentifier(finalEmail);
      await register({
        name: data.name,
        email: finalEmail,
        targetRole: data.targetRole || 'Fullstack Engineer',
        experienceLevel: data.experienceLevel || 'Mid',
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setOtpType('verification');
      setCurrentStep('otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-2 -top-10 sm:-right-10 sm:top-0 p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors z-50 cursor-pointer shadow-md"
          title="Close Auth"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Feature Gate Banner (if opened via protected feature click) */}
        {promptFeatureName && (
          <div className="mb-4 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-sm text-center space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In Required</span>
            </div>
            <p className="text-xs text-slate-700">
              Create your ELEVATE.AI account or sign in to access <strong className="text-slate-900">{promptFeatureName}</strong>.
            </p>
          </div>
        )}

        {successBanner && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center shadow-2xs">
            {successBanner}
          </div>
        )}

        <AuthLayout>
          {/* Email & Password Flow */}
          {currentStep === 'step1' && (
            <div className="space-y-4">
              <SignInStepOne
                initialIdentifier={identifier}
                onContinue={handleCheckUser}
                isLoading={isLoading}
                error={error}
              />

              {/* Account Not Found Banner */}
              {accountNotFoundPrompt && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-in fade-in">
                  <p className="font-semibold">No ELEVATE.AI account found for this email.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountNotFoundPrompt(false);
                      setCurrentStep('register');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-4 h-4 text-amber-700" />
                    <span>Create New Candidate Account</span>
                  </button>
                </div>
              )}

              {/* Toggle to Register */}
              <div className="pt-2 text-center text-xs text-slate-500">
                <span>New to ELEVATE.AI? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAccountNotFoundPrompt(false);
                    setCurrentStep('register');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  Create your account
                </button>
              </div>
            </div>
          )}

          {currentStep === 'password' && (
            <PasswordStep
              email={identifier}
              userName={userName}
              onSignIn={handlePasswordSignIn}
              onRequestOtp={handleRequestOtpLogin}
              onForgotPassword={() => {
                setError(null);
                setCurrentStep('forgot_email');
              }}
              onChangeEmail={() => {
                setError(null);
                setAccountNotFoundPrompt(false);
                setCurrentStep('step1');
              }}
              isLoading={isLoading}
              isSendingOtp={isSendingOtp}
              error={error}
            />
          )}

          {currentStep === 'otp' && (
            <OtpVerifyStep
              email={identifier}
              type={otpType}
              onVerify={handleVerifyOtp}
              onResendOtp={async () => {
                setIsSendingOtp(true);
                setError(null);
                try {
                  await ApiService.sendOtp(identifier, otpType);
                } catch (err: any) {
                  setError(err.message || 'Failed to resend verification code');
                } finally {
                  setIsSendingOtp(false);
                }
              }}
              onBack={() => {
                setError(null);
                if (otpType === 'verification') {
                  setCurrentStep('register');
                } else if (otpType === 'reset_password') {
                  setCurrentStep('forgot_email');
                } else {
                  setCurrentStep('password');
                }
              }}
              isLoading={isLoading}
              isResending={isSendingOtp}
              error={error}
            />
          )}

          {currentStep === 'register' && (
            <div className="space-y-3">
              <RegisterStep
                email={identifier}
                onRegister={handleRegister}
                onChangeEmail={() => {
                  setError(null);
                  setCurrentStep('step1');
                }}
                isLoading={isLoading}
                error={error}
              />
              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCurrentStep('step1');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {currentStep === 'forgot_email' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendForgotOtp();
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Reset Your Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered email and we'll send a 6-digit verification code to reset your password.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-sans shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending Verification Code...' : 'Send Verification Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentStep('password');
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {currentStep === 'new_password' && resetToken && (
            <ResetPasswordStep
              email={identifier}
              resetToken={resetToken}
              onResetSuccess={() => {
                setSuccessBanner('Password updated successfully! Please sign in with your new password.');
                setResetToken(null);
                setCurrentStep('password');
              }}
              onResetSubmit={handleResetPasswordSubmit}
              onCancel={() => {
                setError(null);
                setResetToken(null);
                setCurrentStep('password');
              }}
              isLoading={isLoading}
              error={error}
            />
          )}
        </AuthLayout>
      </div>
    </div>
  );
};
