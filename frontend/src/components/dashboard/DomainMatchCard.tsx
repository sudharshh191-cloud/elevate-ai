import React from 'react';
import { Target, Layers, Server, Cpu, Binary, Users, Play } from 'lucide-react';
import { InterviewDomain, IUserProfile } from '../../types';

interface DomainMatchCardProps {
  user?: IUserProfile | null;
  onStartDomainMock: (domain: InterviewDomain) => void;
}

export const DomainMatchCard: React.FC<DomainMatchCardProps> = ({ user, onStartDomainMock }) => {
  const targetRole = user?.targetRole || 'Full Stack Engineer';
  const hasScores = (user?.stats?.completedInterviews ?? 0) > 0;
  const overallAlignment = hasScores ? Math.round(user?.stats?.averageScore || 0) : null;
  const domains = [
    {
      name: 'Frontend Architecture',
      domain: 'Frontend' as InterviewDomain,
      score: hasScores ? Math.round(user?.stats?.averageScore || 85) : 85,
      target: 85,
      icon: Layers,
      barColor: 'bg-indigo-600',
      focus: 'Virtualization & Web Vitals'
    },
    {
      name: 'Backend & Distributed APIs',
      domain: 'Backend' as InterviewDomain,
      score: hasScores ? Math.round((user?.stats?.averageScore || 80) * 0.95) : 80,
      target: 80,
      icon: Server,
      barColor: 'bg-emerald-600',
      focus: 'Redis Caching & Concurrency'
    },
    {
      name: 'High-Scale System Design',
      domain: 'System Design' as InterviewDomain,
      score: hasScores ? Math.round((user?.stats?.averageScore || 80) * 0.9) : 80,
      target: 85,
      icon: Cpu,
      barColor: 'bg-purple-600',
      focus: 'Distributed State & Global Sharding'
    },
    {
      name: 'Data Structures & Algorithms',
      domain: 'Fullstack' as InterviewDomain,
      score: hasScores ? Math.round(user?.stats?.averageScore || 80) : 80,
      target: 80,
      icon: Binary,
      barColor: 'bg-sky-600',
      focus: 'Dynamic Programming & Graphs'
    },
    {
      name: 'Behavioral & Leadership (STAR)',
      domain: 'Behavioral' as InterviewDomain,
      score: hasScores ? Math.round(user?.stats?.averageScore || 80) : 80,
      target: 80,
      icon: Users,
      barColor: 'bg-amber-500',
      focus: 'Conflict & Cross-team Influence'
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Domain Readiness & Match
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Alignment
              </span>
            </h3>
            <p className="text-xs text-slate-500">Target Role: {targetRole}</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs font-mono font-bold text-emerald-700">
            {overallAlignment ? `${overallAlignment}% Overall Alignment` : 'Ready for Calibration'}
          </div>
          <div className="text-[10px] text-slate-400">
            {overallAlignment ? 'Based on verified evaluations' : 'Complete a mock to calculate'}
          </div>
        </div>
      </div>

      {/* Domain List */}
      <div className="space-y-2.5">
        {domains.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-150 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-indigo-600 transition-colors shadow-2xs">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Key Focus: {item.focus}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900">{item.score}%</span>
                    <span className="text-[10px] text-slate-400 ml-1">/ {item.target}% req</span>
                  </div>
                  <button
                    onClick={() => onStartDomainMock(item.domain)}
                    className="p-1.5 rounded-lg bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                    title={`Start ${item.name} mock`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
