import React from 'react';
import { X, BookOpen, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { ISystemDesignProblem } from '../../types';

interface ProblemRequirementsModalProps {
  problem: ISystemDesignProblem;
  onClose: () => void;
}

export const ProblemRequirementsModal: React.FC<ProblemRequirementsModalProps> = ({ problem, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{problem.title}</h2>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold">
                {problem.difficulty} Tier • {problem.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Problem Description</span>
            <p className="text-slate-700 leading-relaxed">{problem.description}</p>
          </div>

          {/* Expected Scale */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-indigo-900 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 font-mono tracking-wider block">
                Target Scale & Throughput
              </span>
              <p className="text-xs text-indigo-900 mt-0.5 font-medium">{problem.expectedScale}</p>
            </div>
          </div>

          {/* Functional Requirements */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Core Functional Requirements</span>
            </span>
            <ul className="space-y-1.5 pl-1">
              {problem.functionalRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-Functional Requirements */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Non-Functional SLA & Constraints</span>
            </span>
            <ul className="space-y-1.5 pl-1">
              {problem.nonFunctionalRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            Got It, Back to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
