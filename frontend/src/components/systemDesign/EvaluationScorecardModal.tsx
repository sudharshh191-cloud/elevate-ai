import React from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  ShieldCheck,
  Server,
  Layers,
  Zap,
  Lock,
  DollarSign,
  Scale,
} from 'lucide-react';
import { ISystemDesignEvaluation } from '../../types';

interface EvaluationScorecardModalProps {
  evaluation: ISystemDesignEvaluation;
  problemTitle: string;
  onClose: () => void;
}

export const EvaluationScorecardModal: React.FC<EvaluationScorecardModalProps> = ({
  evaluation,
  problemTitle,
  onClose,
}) => {
  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'Staff Architect':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Principal Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Senior Pass':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  const dimensions = [
    { label: 'Scalability', score: evaluation.dimensions.scalability, icon: TrendingUp, color: 'text-indigo-600', barBg: 'bg-indigo-600' },
    { label: 'Reliability', score: evaluation.dimensions.reliability, icon: ShieldCheck, color: 'text-emerald-600', barBg: 'bg-emerald-600' },
    { label: 'Availability', score: evaluation.dimensions.availability, icon: Server, color: 'text-sky-600', barBg: 'bg-sky-600' },
    { label: 'Performance', score: evaluation.dimensions.performance, icon: Zap, color: 'text-amber-600', barBg: 'bg-amber-500' },
    { label: 'Data Design', score: evaluation.dimensions.dataDesign, icon: Layers, color: 'text-blue-600', barBg: 'bg-blue-600' },
    { label: 'Security', score: evaluation.dimensions.security, icon: Lock, color: 'text-rose-600', barBg: 'bg-rose-600' },
    { label: 'Cost Efficiency', score: evaluation.dimensions.costEfficiency, icon: DollarSign, color: 'text-teal-600', barBg: 'bg-teal-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Architecture Evaluation Scorecard</h2>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  ELEVATE AI ARCHITECT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Problem: {problemTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Score */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-indigo-50">
                  <span className="text-2xl font-bold font-mono text-indigo-700">{evaluation.overallScore}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Overall Score
                </span>
                <span
                  className={`mt-1 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getVerdictBadge(
                    evaluation.verdict
                  )}`}
                >
                  {evaluation.verdict}
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 md:col-span-2 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-indigo-700 font-mono tracking-wider mb-1 block">
                Executive Synthesis
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{evaluation.executiveSummary}</p>
            </div>
          </div>

          {/* 7 Architecture Dimensions Grid */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Multi-Dimensional Architectural Competencies
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dimensions.map((dim) => {
                const Icon = dim.icon;
                return (
                  <div key={dim.label} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${dim.color}`} />
                        <span className="text-xs font-medium text-slate-700">{dim.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900">{dim.score} / 100</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${dim.barBg}`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Critical Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Strengths */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Architectural Strengths</span>
              </span>

              <ul className="space-y-2">
                {evaluation.topStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-800 leading-relaxed">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Gaps */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Identified Bottlenecks & Gaps</span>
              </span>

              <ul className="space-y-2">
                {evaluation.criticalGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-800 leading-relaxed">
                    <span className="text-rose-600 mt-0.5">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {evaluation.recommendations && evaluation.recommendations.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Recommended Architectural Enhancements
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluation.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                          {rec.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            rec.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architectural Trade-offs */}
          {evaluation.tradeoffs && evaluation.tradeoffs.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-600" />
                <span>Architectural Trade-Off Analysis</span>
              </span>

              <div className="space-y-2">
                {evaluation.tradeoffs.map((to, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">{to.decision}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="text-emerald-800">
                        <strong className="text-emerald-900">Upside:</strong> {to.upside}
                      </div>
                      <div className="text-amber-800">
                        <strong className="text-amber-900">Downside:</strong> {to.downside}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Evaluation synthesized against enterprise FAANG standards</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
