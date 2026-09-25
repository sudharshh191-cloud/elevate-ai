import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, KeyRound } from 'lucide-react';

interface PasswordStepProps {
  email: string;
  userName?: string | null;
  onSignIn: (password: string, keepMeSignedIn: boolean) => void;
  onRequestOtp: () => void;
  onForgotPassword: () => void;
  onChangeEmail: () => void;
  isLoading: boolean;
  isSendingOtp?: boolean;
  error?: string | null;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  email,
  userName,
  onSignIn,
  onRequestOtp,
  onForgotPassword,
  onChangeEmail,
  isLoading,
  isSendingOtp = false,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSignIn(password, keepMeSignedIn);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header & Change Email banner */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Welcome back{userName ? `, ${userName}` : ''}
        </h2>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-600 font-mono truncate max-w-[220px]">{email}</span>
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all font-mono shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-2.5 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Keep me signed in Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="keep-signed-in"
          checked={keepMeSignedIn}
          onChange={(e) => setKeepMeSignedIn(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="keep-signed-in" className="text-xs text-slate-600 select-none cursor-pointer">
          Keep me signed in on this device
        </label>
      </div>

      {/* Sign In CTA */}
      <button
        type="submit"
        disabled={isLoading || !password}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-semibold text-[10px] tracking-wider">
            or passwordless
          </span>
        </div>
      </div>

      {/* Sign in with OTP instead Button */}
      <button
        type="button"
        onClick={onRequestOtp}
        disabled={isSendingOtp}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isSendingOtp ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Sending 6-Digit Code...</span>
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Sign in with One-Time Passcode (OTP)</span>
          </>
        )}
      </button>
    </form>
  );
};
