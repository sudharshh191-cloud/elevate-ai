import React from 'react';
import { Code2, FileText, Mic, Cpu, Flame, CheckCircle2 } from 'lucide-react';

interface ProgressCounters {
  codingProblemsSolved: number;
  codingSubmissionsTotal: number;
  codingPassRate: number;
  resumesAnalyzed: number;
  mockInterviewsCompleted: number;
  mockInterviewsTotal: number;
  systemDesignDiagrams: number;
  streakDays: number;
}

interface ProgressOverviewCardProps {
  counters: ProgressCounters;
}

export const ProgressOverviewCard: React.FC<ProgressOverviewCardProps> = ({ counters }) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              YOUR PROGRESS
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Verified Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real activity counters across all 4 preparation pillars (zero manufactured percentages)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Coding Practice */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600">Coding Practice</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {counters.codingProblemsSolved}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {counters.codingSubmissionsTotal} submitted
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {counters.codingProblemsSolved > 0
              ? `${counters.codingPassRate}% pass rate`
              : 'No submissions yet'}
          </span>
        </div>

        {/* 2. Resumes Analyzed */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600">Resume Hub</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {counters.resumesAnalyzed}
            </span>
            <span className="text-xs text-slate-400 font-mono">analyzed</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {counters.resumesAnalyzed > 0 ? 'Skills & ATS extracted' : 'Pending upload'}
          </span>
        </div>

        {/* 3. Mock Interviews */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600">Mock Assessments</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {counters.mockInterviewsCompleted}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {counters.mockInterviewsTotal} started
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {counters.mockInterviewsCompleted > 0 ? 'Rubric scorecards generated' : '0 completed'}
          </span>
        </div>

        {/* 4. System Design */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600">System Design</span>
            <div className="w-6 h-6 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {counters.systemDesignDiagrams}
            </span>
            <span className="text-xs text-slate-400 font-mono">architectures</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {counters.systemDesignDiagrams > 0 ? 'Studio diagrams saved' : '0 created'}
          </span>
        </div>

        {/* 5. Streak */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600">Practice Streak</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {counters.streakDays}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              day{counters.streakDays === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            {counters.streakDays > 0 ? 'Consistent practice' : 'Start today'}
          </span>
        </div>
      </div>
    </div>
  );
};
