import React, { useState, useEffect } from 'react';
import { User, Mail, Eye, EyeOff, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';

interface RegisterStepProps {
  email: string;
  onRegister: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => void;
  onChangeEmail: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const RegisterStep: React.FC<RegisterStepProps> = ({
  email,
  onRegister,
  isLoading,
  error,
}) => {
  const [name, setName] = useState('');
  const [inputEmail, setInputEmail] = useState(email && email !== 'demo@ai-interview.io' ? email : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (email && email !== 'demo@ai-interview.io') {
      setInputEmail(email);
    }
  }, [email]);

  // Real-time password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Exceptional'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-indigo-600'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedEmail = inputEmail.trim().toLowerCase();

    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    onRegister({
      name: name.trim(),
      email: trimmedEmail,
      password,
      confirmPassword,
    });
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Create Candidate Account</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter your details to receive a 6-digit email verification code.
        </p>
      </div>

      {(error || localError) && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error || localError}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Your Full Name
        </label>
        <div className="relative">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Connor"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
          <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="e.g. candidate@domain.com"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
          />
          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Create Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
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

        {/* Real-time Password Strength Meter */}
        {password && (
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
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Confirm Password
          </label>
          {passwordsMatch && (
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Passwords match
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono shadow-2xs ${
              confirmPassword && !passwordsMatch
                ? 'border-rose-400 focus:border-rose-600'
                : 'border-slate-300 focus:border-indigo-600'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-2 cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !name || !inputEmail || password.length < 8 || password !== confirmPassword}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Verification Code...</span>
          </>
        ) : (
          <>
            <span>Send Verification Code</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
