import React, { useState } from 'react';
import { Mail, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface SignInStepOneProps {
  initialIdentifier?: string;
  onContinue: (identifier: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const SignInStepOne: React.FC<SignInStepOneProps> = ({
  initialIdentifier = '',
  onContinue,
  isLoading,
  error,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      onContinue(identifier.trim());
    }
  };

  const handleUseDemoAccount = () => {
    setIdentifier('demo@ai-interview.io');
    onContinue('demo@ai-interview.io');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Sign In with Email</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter your registered email address to continue.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Identifier Input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <input
            type="text"
            required
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all font-sans shadow-2xs"
          />
          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Continue Button */}
      <button
        type="submit"
        disabled={isLoading || !identifier.trim()}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking Account...</span>
          </>
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Quick Demo Fill Button */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleUseDemoAccount}
          className="w-full py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Use Verified Staff Demo Account (`demo@ai-interview.io`)</span>
        </button>
      </div>

      {/* Amazon-style Terms Notice */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        By continuing, you agree to ELEVATE.AI's <span className="text-indigo-600 hover:underline cursor-pointer">Conditions of Use</span> and <span className="text-indigo-600 hover:underline cursor-pointer">Privacy Notice</span>.
      </p>
    </form>
  );
};
