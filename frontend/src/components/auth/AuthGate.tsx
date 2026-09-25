import React from 'react';
import { Lock, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthGateProps {
  children: React.ReactNode;
  feature?: string;
  title?: string;
  description?: string;
  fallback?: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  feature = 'this feature',
  title = 'Sign In Required',
  description,
  fallback,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="w-full my-6 p-8 rounded-2xl bg-white border border-slate-200 shadow-lg text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-5 animate-in fade-in zoom-in-95">
      {/* Icon Badge */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
        <Lock className="w-7 h-7" />
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ELEVATE.AI Member Feature</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          {description ||
            `Create your ELEVATE.AI account or sign in to access ${feature} and unlock personalized AI scoring.`}
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
        <button
          onClick={() => openAuthModal('signin', feature)}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </button>

        <button
          onClick={() => openAuthModal('register', feature)}
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <span>Create Account</span>
        </button>
      </div>
    </div>
  );
};
