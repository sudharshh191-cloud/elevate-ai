import React from 'react';
import { Terminal, Shield, Lock } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  subtitle = "AI Coding & Interview Intelligence Platform"
}) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 p-[1.5px] shadow-sm mb-3">
          <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
            <Terminal className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">ELEVATE<span className="text-indigo-600">.AI</span></span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            Auth v2
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-xs">{subtitle}</p>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
        {children}
      </div>

      {/* Security Footer */}
      <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-indigo-600" />
          <span>JWT & Email OTP Protected</span>
        </div>
      </div>
    </div>
  );
};
