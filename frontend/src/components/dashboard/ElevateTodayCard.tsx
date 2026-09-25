import React from 'react';
import { Sparkles, ArrowRight, Code2, FileText, Cpu, Mic, CheckCircle2 } from 'lucide-react';

interface TodayAction {
  id: string;
  title: string;
  subtitle: string;
  category: 'practice' | 'resume' | 'interview' | 'system-design' | 'onboarding';
  actionLabel: string;
  targetTab: 'arena' | 'resume' | 'system-design' | 'analytics';
  priority: 'high' | 'medium' | 'normal';
}

interface ElevateTodayCardProps {
  actions: TodayAction[];
  targetRole?: string;
  trackLevel?: string;
  onNavigate: (tab: 'arena' | 'resume' | 'system-design' | 'analytics') => void;
}

export const ElevateTodayCard: React.FC<ElevateTodayCardProps> = ({
  actions,
  targetRole,
  trackLevel,
  onNavigate,
}) => {
  const getCategoryIcon = (category: TodayAction['category']) => {
    switch (category) {
      case 'practice':
        return <Code2 className="w-4 h-4 text-emerald-600" />;
      case 'resume':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'system-design':
        return <Cpu className="w-4 h-4 text-violet-600" />;
      case 'interview':
        return <Mic className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getPriorityBadge = (priority: TodayAction['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Recommended
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
            Next Step
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              ELEVATE TODAY
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              {targetRole || 'Software Engineering'} • {trackLevel || 'Track'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your dynamic preparation plan based on your verified platform activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                  {getCategoryIcon(action.category)}
                </div>
                {getPriorityBadge(action.priority)}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {action.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate(action.targetTab)}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-white group-hover:bg-indigo-600 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span>{action.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
