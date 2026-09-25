import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ResetPasswordStepProps {
  email: string;
  resetToken: string;
  onResetSuccess: () => void;
  onResetSubmit: (newPassword: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const ResetPasswordStep: React.FC<ResetPasswordStepProps> = ({
  email,
  onResetSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Requirements checks
  const checks = {
    length: newPassword.length >= 8,
    mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const strengthCount = [checks.length, checks.mixedCase, checks.number, checks.symbol].filter(Boolean).length;
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-600'];

  const isValid = checks.length && checks.mixedCase && checks.number && checks.symbol && checks.match;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onResetSubmit(newPassword);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Create New Password</h2>
        </div>
        <p className="text-xs text-slate-500">
          Resetting password for <span className="text-slate-900 font-mono font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{error}</span>
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
            placeholder="••••••••••••"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-2 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Strength Progress Bar */}
        {newPassword && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Security Rating:</span>
              <span className="font-semibold text-slate-800">{strengthLabels[Math.max(0, strengthCount - 1)]}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    strengthCount >= step ? strengthColors[Math.max(0, strengthCount - 1)] : 'bg-slate-200'
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
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
        />
      </div>

      {/* Real-time Checklist */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
          Security Requirements:
        </span>
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
            {checks.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>8+ Characters</span>
          </div>
          <div className={`flex items-center gap-1.5 ${checks.mixedCase ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
            {checks.mixedCase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Uppercase & Lowercase</span>
          </div>
          <div className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
            {checks.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>At least 1 Number</span>
          </div>
          <div className={`flex items-center gap-1.5 ${checks.symbol ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
            {checks.symbol ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Special Symbol (!@#$)</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={isLoading || !isValid}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating Password...</span>
          </>
        ) : (
          <>
            <span>Save Password & Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 text-center block cursor-pointer"
      >
        Cancel & Return to Sign In
      </button>
    </form>
  );
};
