import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, BrainCircuit } from 'lucide-react';
import { IInstantFeedback } from '../../types';

interface InstantFeedbackModalProps {
  feedback: IInstantFeedback;
  questionNumber: number;
  totalQuestions: number;
  onProceed: () => void;
}

export const InstantFeedbackModal: React.FC<InstantFeedbackModalProps> = ({
  feedback,
  questionNumber,
  totalQuestions,
  onProceed,
}) => {
  const isLastQuestion = questionNumber >= totalQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono font-extrabold text-xl text-indigo-700">
              {feedback.score}%
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Instant Rubric Evaluation • Question {questionNumber}/{totalQuestions}
              </span>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <span>Response Evaluated</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {feedback.score >= 85 ? 'Staff Ready' : 'Solid Performance'}
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Sub-Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Technical Accuracy</span>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                {feedback.technicalAccuracy}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Communication & Structure</span>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {feedback.communication}%
              </div>
            </div>
          </div>

          {/* Key Strengths */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key Strengths Identified</span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              {feedback.strengths?.map((str, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                  • {str}
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Areas */}
          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Critical Edge Cases to Strengthen</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {feedback.improvements.map((imp, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200">
                    • {imp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Coach Note */}
          {feedback.coachNote && (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 flex items-start gap-2.5 text-xs text-slate-800">
              <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-900">Coach Note: </strong>
                {feedback.coachNote}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onProceed}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>{isLastQuestion ? 'View 360° Assessment Report' : 'Proceed to Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
