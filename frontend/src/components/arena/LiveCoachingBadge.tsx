import React, { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface LiveCoachingBadgeProps {
  currentTip?: string;
  pacingStatus?: 'optimal' | 'too-fast' | 'too-slow';
}

export const LiveCoachingBadge: React.FC<LiveCoachingBadgeProps> = ({
  currentTip = "Lead with Big-O complexity estimations before detailing sub-components.",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 shadow-2xs cursor-pointer transition-all hover:scale-102 select-none"
      >
        {/* Lightning Badge */}
        <div className="p-1 rounded-full bg-amber-500 text-white shadow-2xs">
          <Zap className="w-3 h-3 fill-current" />
        </div>

        <span className="font-bold tracking-wide text-indigo-700">
          AI Live Tip
        </span>

        <span className="text-slate-500 hidden sm:inline-block max-w-[200px] truncate">
          : {currentTip}
        </span>

        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          135 WPM (Optimal)
        </span>
      </div>

      {/* Expanded Tooltip Card */}
      {isExpanded && (
        <div className="absolute right-0 top-10 w-80 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Real-Time Coaching Co-Pilot</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">ACTIVE</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {currentTip}
          </p>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Speech Rhythm:</span>
              <strong className="text-emerald-700 font-mono">135 WPM (Engaging)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>STAR Alignment:</span>
              <strong className="text-indigo-700 font-mono">High Precision</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
