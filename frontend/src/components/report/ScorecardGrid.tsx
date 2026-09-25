import React from 'react';
import { Award, CheckCircle2, Sparkles, Terminal, CheckCircle } from 'lucide-react';
import { IFeedbackReport } from '../../types';

interface ScorecardGridProps {
  report: IFeedbackReport;
}

export const ScorecardGrid: React.FC<ScorecardGridProps> = ({ report }) => {
  const metricList = [
    { label: 'Technical Accuracy', score: report.metrics?.technicalAccuracy ?? 0, color: 'text-indigo-700', bar: 'bg-indigo-600' },
    { label: 'Problem Solving Rigor', score: report.metrics?.problemSolving ?? 0, color: 'text-sky-700', bar: 'bg-sky-600' },
    { label: 'Code Cleanliness & Execution', score: report.metrics?.codeQualityAndEfficiency ?? 0, color: 'text-purple-700', bar: 'bg-purple-600' },
    { label: 'Communication Clarity', score: report.metrics?.communicationClarity ?? 0, color: 'text-emerald-700', bar: 'bg-emerald-600' },
    { label: 'Delivery & Precision', score: report.metrics?.confidenceAndDelivery ?? 0, color: 'text-amber-700', bar: 'bg-amber-500' }
  ];

  const overview = report.performanceOverview;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Master Score Banner */}
      <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between items-center text-center relative overflow-hidden">
        <div className="w-full flex items-center justify-between text-xs text-slate-500">
          <span>Assessment Score</span>
          <span className="font-mono text-indigo-700 font-semibold">ID: {(report.reportId || report.sessionId || '').slice(0, 10)}</span>
        </div>

        {/* Big Circular Score */}
        <div className="my-6 relative flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-4 border-indigo-100 flex items-center justify-center p-2 bg-indigo-50/50">
            <div className="w-full h-full rounded-full bg-white border border-indigo-200 flex flex-col items-center justify-center shadow-md">
              <span className="text-4xl font-extrabold text-slate-900 font-mono">{report.overallScore}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700">Out of 100</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Evaluation: {report.performanceTier || 'Evaluated'}</span>
          </div>
          {overview && (
            <div className="text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2 pt-1">
              <span>{overview.passedQuestions}/{overview.totalQuestions} Questions Solved</span>
              <span>•</span>
              <span>{overview.passedTestCases}/{overview.totalTestCases} Tests Passed</span>
            </div>
          )}
          <p className="text-xs text-slate-600 px-2 line-clamp-3 leading-relaxed pt-1">
            {report.executiveSummary}
          </p>
        </div>
      </div>

      {/* Multi-Dimensional Metric Bars */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rubric Evaluation Breakdown</h3>
            <p className="text-xs text-slate-500">Real performance measured against technical criteria</p>
          </div>
          {overview && overview.totalTestCases > 0 && (
            <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{Math.round((overview.passedTestCases / overview.totalTestCases) * 100)}% Test Accuracy</span>
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {metricList.map((m, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{m.label}</span>
                <span className={`font-mono font-bold ${m.color}`}>{m.score}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full ${m.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${m.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Critical Gaps Summary */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Demonstrated Strength</span>
            </span>
            <p className="text-xs text-slate-700 mt-1 line-clamp-2">
              {report.topStrengths?.[0] || 'Structured problem decomposition and test execution.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
            <span className="text-[11px] uppercase font-bold text-amber-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommended Focus Area</span>
            </span>
            <p className="text-xs text-slate-700 mt-1 line-clamp-2">
              {report.criticalGaps?.[0] || 'Cover edge-case boundary conditions more thoroughly.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
