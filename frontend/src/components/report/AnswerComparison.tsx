import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, BrainCircuit, Sparkles } from 'lucide-react';
import { IFeedbackReport } from '../../types';

interface AnswerComparisonProps {
  report: IFeedbackReport;
}

export const AnswerComparison: React.FC<AnswerComparisonProps> = ({ report }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Question-by-Question Deep Dive & Ideal Model Solutions</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Staff Rubric
          </span>
        </h3>
        <p className="text-xs text-slate-500">Compare your responses directly with Staff Architect benchmarks</p>
      </div>

      <div className="space-y-3">
        {report.questionDetails?.map((detail, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className="rounded-xl bg-slate-50/70 border border-slate-200 overflow-hidden transition-all"
            >
              {/* Question Header Accordion Toggle */}
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono font-bold text-xs text-indigo-700">
                    Q{detail.questionIndex}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {detail.questionText}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Category: <span className="text-indigo-700 font-semibold">{detail.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-700">{detail.score}%</span>
                    <span className="text-[10px] text-slate-400 block">Score</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Comparison Body */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-200 bg-white space-y-4 text-xs">
                  {/* Grid: Candidate vs Ideal */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Candidate Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[11px] uppercase font-bold text-indigo-700 flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>Your Submitted Response</span>
                      </span>
                      <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {detail.userResponseText || 'Virtualized window calculation slice [startIndex, endIndex] with itemHeight top offsets and passive throttled scroll listeners.'}
                      </p>
                      {detail.userSubmittedCode && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-32 overflow-y-auto">
                          <pre>{detail.userSubmittedCode}</pre>
                        </div>
                      )}
                    </div>

                    {/* Ideal Model Answer */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                      <span className="text-[11px] uppercase font-bold text-emerald-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Staff Architect Ideal Model Answer</span>
                      </span>
                      <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {detail.idealAnswerSummary}
                      </p>
                    </div>
                  </div>

                  {/* Key Points Covered vs Missed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                      <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Rubric Key Points Covered</span>
                      </span>
                      <ul className="space-y-1 text-slate-700 text-[11px]">
                        {detail.keyPointsCovered?.map((pt, pIdx) => (
                          <li key={pIdx}>• {pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                      <span className="text-[11px] uppercase font-bold text-amber-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Key Points Missed / Edge Cases</span>
                      </span>
                      <ul className="space-y-1 text-slate-700 text-[11px]">
                        {detail.keyPointsMissed?.map((pt, pIdx) => (
                          <li key={pIdx}>• {pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Constructive Critique */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                    <strong className="text-slate-900">AI Evaluator Critique: </strong>
                    {detail.constructiveCritique}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
