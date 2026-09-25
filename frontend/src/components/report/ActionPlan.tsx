import React from 'react';
import { Calendar, BookOpen, Sparkles } from 'lucide-react';
import { IFeedbackReport } from '../../types';

interface ActionPlanProps {
  report: IFeedbackReport;
  onLaunchPractice?: () => void;
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ report, onLaunchPractice }) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Personalized 4-Week AI Mastery Roadmap</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Staff Target
            </span>
          </h3>
          <p className="text-xs text-slate-500">Targeted study milestones based on your specific gap analysis</p>
        </div>

        <button
          onClick={onLaunchPractice}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Practice Weak Areas</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.actionableRoadmap?.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between hover:border-indigo-200 hover:bg-indigo-50/20 transition-all shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700">
                  WEEK {item.week}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Milestone {idx + 1} of 4
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{item.topic}</h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {item.recommendedAction}
              </p>
            </div>

            {/* Resources list */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Recommended Resources:
              </span>
              <div className="space-y-1">
                {item.practiceResources?.map((res, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium hover:text-indigo-900">
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    <span>{res}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
