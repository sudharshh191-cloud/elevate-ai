import React from 'react';
import { Terminal, CheckCircle2, XCircle, ArrowRight, Code2, Clock, Zap } from 'lucide-react';

interface CodeExecutionItem {
  id: string;
  language: string;
  status: string;
  testCasesPassed: number;
  totalTestCases: number;
  executionTimeMs?: number;
  createdAt: string;
}

interface PracticeSnapshotProps {
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  passRate: number;
  languagesUsed: Record<string, number>;
  recentExecutions: CodeExecutionItem[];
  onOpenArena: () => void;
}

export const PracticeSnapshotCard: React.FC<PracticeSnapshotProps> = ({
  totalExecutions,
  passedExecutions,
  passRate,
  languagesUsed,
  recentExecutions,
  onOpenArena,
}) => {
  const languageList = Object.entries(languagesUsed);

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
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-600" />
                YOUR PRACTICE
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                Coding Arena
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live code execution benchmarks, pass rates, and language stats
            </p>
          </div>

          <button
            onClick={onOpenArena}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Enter Arena</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real KPI Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 mb-4">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Submissions
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {totalExecutions}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Passed
            </span>
            <span className="text-lg font-bold text-emerald-600 font-mono">
              {passedExecutions}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pass Rate
            </span>
            <span className="text-lg font-bold text-indigo-600 font-mono">
              {totalExecutions > 0 ? `${passRate}%` : '—'}
            </span>
          </div>
        </div>

        {/* Languages Pill Bar */}
        {languageList.length > 0 && (
          <div className="mb-4 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Languages:</span>
            {languageList.map(([lang, count]) => (
              <span
                key={lang}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs"
              >
                {lang.toUpperCase()}: <span className="text-indigo-600">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Recent Executions or Empty State */}
        {recentExecutions.length === 0 ? (
          <div className="py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">No Coding Activity Yet</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                Write solutions with real test runner execution in TypeScript, Python, C++, and JavaScript.
              </p>
            </div>
            <button
              onClick={onOpenArena}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Solve First Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Recent Code Submissions
            </span>
            {recentExecutions.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {exec.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 uppercase text-[11px]">
                        {exec.language}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          exec.status === 'passed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {exec.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>
                        {exec.testCasesPassed}/{exec.totalTestCases} test cases passed
                      </span>
                      {exec.executionTimeMs !== undefined && exec.executionTimeMs > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-slate-400" />
                            {exec.executionTimeMs}ms
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatRelativeTime(exec.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Practice without fake timers</span>
        <button
          onClick={onOpenArena}
          className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          Practice Next Topic →
        </button>
      </div>
    </div>
  );
};
