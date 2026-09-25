import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ResetPasswordPageProps {
  onNavigateHome: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigateHome }) => {
  const { openAuthModal } = useAuth();
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Extract token from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      setIsVerifyingToken(false);
      setTokenError('No password reset token was found in the link. Please check your email or request a new reset link.');
      return;
    }

    setToken(tokenParam);

    const verifyToken = async () => {
      setIsVerifyingToken(true);
      setTokenError(null);
      try {
        const res = await ApiService.verifyResetToken(tokenParam);
        if (res.valid) {
          setEmail(res.email || null);
        } else {
          setTokenError(res.error || 'This reset link is invalid or has expired.');
        }
      } catch (err: any) {
        setTokenError(err.message || 'Unable to verify reset token.');
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Exceptional'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-indigo-600'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiService.resetPasswordWithToken(token, newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono font-bold text-slate-800">
            ELEVATE<span className="text-indigo-600 font-black">.AI</span> Security
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Reset Account Password</h1>
        <p className="text-xs text-slate-500">Staff & Principal AI Mock Assessment Arena</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {isVerifyingToken ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-slate-500 font-mono">Verifying cryptographic reset token...</p>
          </div>
        ) : tokenError ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Invalid or Expired Link</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{tokenError}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => openAuthModal('forgot_password')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Request New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateHome}
                className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Password Successfully Updated</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your password has been securely reset. You can now sign in with your new credentials.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  onNavigateHome();
                  openAuthModal('signin');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to ELEVATE.AI</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Create New Password</h2>
              {email && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Resetting credentials for <span className="text-indigo-700 font-mono">{email}</span>
                </p>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-2.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Strength:</span>
                    <span className="font-semibold text-slate-800">{strengthLabels[strength]}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          strength >= step ? strengthColors[strength] : 'bg-slate-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
