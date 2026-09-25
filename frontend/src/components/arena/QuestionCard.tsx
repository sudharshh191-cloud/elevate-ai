import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Lightbulb, Code, BookOpen, Layers } from 'lucide-react';
import { IQuestion } from '../../types';

interface QuestionCardProps {
  question: IQuestion;
  questionNumber: number;
  totalQuestions: number;
  onNavigateQuestion?: (index: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onNavigateQuestion,
}) => {
  const [showHints, setShowHints] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

  // Malformed Question Fallback
  if (!question || (!question.questionText && !question.title)) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3 text-center">
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Question Data Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This question could not be loaded cleanly. You can jump to another question using the navigation tabs above.
        </p>
      </div>
    );
  }

  const visibleTestCases = (question.codeTemplate?.testCases || []).filter(tc => !tc.isHidden);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 flex flex-col">
      {/* Top Bar Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            {question.domain || 'Technical'}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            {question.difficulty || 'Standard'} Tier
          </span>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>{question.category || 'Core Concepts'}</span>
        </span>
      </div>

      {/* Multi-Question Navigation Bar */}
      {totalQuestions > 1 && onNavigateQuestion && (
        <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-100 pb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Jump to:</span>
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={i}
              onClick={() => onNavigateQuestion(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                questionNumber === i + 1
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={`Switch to Question ${i + 1}`}
            >
              Q{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Main Question Statement */}
      <div className="space-y-2">
        {question.title && (
          <div className="flex items-center gap-2">
            {question.problemNumber && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                #{question.problemNumber}
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {question.title}
            </h3>
          </div>
        )}

        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed tracking-tight">
          {question.questionText}
        </h2>

        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {question.tags.map((t) => (
              <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Examples & Test Cases (Visible test cases only) */}
      {visibleTestCases.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>Example Test Cases</span>
          </div>

          <div className="space-y-2">
            {visibleTestCases.slice(0, 3).map((tc, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-semibold w-16 shrink-0">Input:</span>
                  <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 truncate">
                    {typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-semibold w-16 shrink-0">Expected:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate">
                    {typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accordions for Hints and Evaluation Rubric */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        {/* Hints Accordion */}
        {question.hints && question.hints.length > 0 && (
          <div className="rounded-xl bg-slate-50/70 border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowHints(!showHints)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Progressive Hints ({question.hints.length})</span>
              </div>
              {showHints ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showHints && (
              <div className="px-4 pb-3 space-y-2 text-xs text-slate-700 bg-white pt-1 border-t border-slate-100">
                {question.hints.map((hint, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70">
                    <span className="text-amber-800 font-mono font-bold shrink-0">Hint {idx + 1}:</span>
                    <span className="leading-relaxed text-slate-800">{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evaluation Rubric Criteria Accordion */}
        {question.rubricCriteria && question.rubricCriteria.length > 0 && (
          <div className="rounded-xl bg-slate-50/70 border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowRubric(!showRubric)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Evaluation Criteria ({question.rubricCriteria.length})</span>
              </div>
              {showRubric ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showRubric && (
              <div className="px-4 pb-3 grid grid-cols-1 gap-2 text-xs text-slate-700 bg-white pt-1 border-t border-slate-100">
                {question.rubricCriteria.map((crit, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{crit.title}</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{crit.weight}% weight</span>
                    </div>
                    {crit.keyPointsToLookFor && (
                      <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1.5 space-y-0.5">
                        {crit.keyPointsToLookFor.map((kp, kIdx) => (
                          <li key={kIdx} className="leading-relaxed">{kp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
