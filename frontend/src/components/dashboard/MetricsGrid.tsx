import React from 'react';
import { Target, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { IUserProfile } from '../../types';

interface MetricsGridProps {
  user: IUserProfile | null;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ user }) => {
  const hasScores = (user?.stats?.completedInterviews ?? 0) > 0;
  const readiness = Math.round(user?.stats?.averageScore || 0);
  const completed = user?.stats?.completedInterviews ?? 0;
  const total = user?.stats?.totalInterviews ?? 0;
  const avg = hasScores ? (user?.stats?.averageScore ?? 0).toFixed(1) : '--';

  const cards = [
    {
      label: 'Readiness Index',
      value: hasScores ? `${readiness}%` : '--',
      subtitle: user ? `${user.targetRole || 'Engineering'} Track` : 'Get Started',
      icon: Target,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      badge: hasScores ? 'Live Assessment Score' : 'No Assessments Yet',
      badgeColor: hasScores ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      label: 'Mock Sessions Completed',
      value: completed.toString(),
      subtitle: `${total} total attempted`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badge: total > 0 ? `${Math.round((completed / total) * 100)}% completion rate` : 'Start your first mock',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Average Score',
      value: hasScores ? `${avg}/100` : '--',
      subtitle: hasScores ? 'Overall Evaluated Performance' : 'Awaiting First Mock',
      icon: Zap,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-100',
      badge: hasScores ? 'Verified Evaluation' : 'Practice Ready',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Total Practice Time',
      value: total > 0 ? `${(total * 0.4).toFixed(1)} hrs` : '0 hrs',
      subtitle: 'Technical interview practice',
      icon: Clock,
      iconColor: 'text-sky-600 bg-sky-50 border-sky-100',
      badge: 'Continuous Practice',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 shadow-2xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  {card.label}
                </span>
                <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                  {card.value}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">{card.subtitle}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
