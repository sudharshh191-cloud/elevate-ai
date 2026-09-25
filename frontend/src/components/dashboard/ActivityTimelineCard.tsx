import React from 'react';
import { Clock, Code2, Mic, FileText, Cpu, History, ArrowRight } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'coding' | 'interview' | 'resume' | 'system-design';
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
  badgeColor?: string;
}

interface ActivityTimelineCardProps {
  events: ActivityEvent[];
  onStartCoding: () => void;
  onOpenResume: () => void;
  onOpenMock: () => void;
}

export const ActivityTimelineCard: React.FC<ActivityTimelineCardProps> = ({
  events,
  onStartCoding,
  onOpenResume,
  onOpenMock,
}) => {
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'coding':
        return <Code2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'interview':
        return <Mic className="w-3.5 h-3.5 text-indigo-600" />;
      case 'resume':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'system-design':
        return <Cpu className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getBadgeStyle = (badgeColor?: string) => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'violet':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-700" />
              RECENT ACTIVITY
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Chronological Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real timestamped events across practice, resumes, and assessments
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">No Activity Recorded Yet</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
              Your coding submissions, resume analyses, and mock assessments will appear here chronologically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <button
              onClick={onStartCoding}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Start Coding
            </button>
            <button
              onClick={onOpenResume}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Analyze Resume
            </button>
            <button
              onClick={onOpenMock}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Take Mock Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-slate-50/30 hover:bg-white hover:border-slate-300 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                  {getEventIcon(event.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {event.title}
                    </span>
                    {event.badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getBadgeStyle(
                          event.badgeColor
                        )}`}
                      >
                        {event.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {event.description}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono shrink-0 ml-2">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatRelativeTime(event.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
