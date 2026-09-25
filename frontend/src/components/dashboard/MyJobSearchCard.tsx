import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ChevronRight,
  ExternalLink,
  Target,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';
import { ITrackedJob, ITrackedJobStats } from '../../types';
import { ApiService } from '../../services/api';

interface MyJobSearchCardProps {
  onNavigateJobTracker: () => void;
  onNavigateJobIntelligence: () => void;
  onTriggerAction: (actionType: string, focusTopic?: string) => void;
}

export const MyJobSearchCard: React.FC<MyJobSearchCardProps> = ({
  onNavigateJobTracker,
  onNavigateJobIntelligence,
  onTriggerAction,
}) => {
  const [jobs, setJobs] = useState<ITrackedJob[]>([]);
  const [stats, setStats] = useState<ITrackedJobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadTrackedJobs = async () => {
      try {
        const res = await ApiService.getTrackedJobs();
        if (isMounted && res) {
          setJobs(res.jobs || []);
          setStats(res.stats || null);
        }
      } catch (err) {
        console.warn('Could not load job search preview on dashboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTrackedJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="h-16 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  const hasJobs = jobs.length > 0;
  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              MY JOB SEARCH & TARGET PIPELINE
            </h3>
            {hasJobs && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {jobs.length} Tracked
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active opportunities and target role preparation status.
          </p>
        </div>

        <button
          onClick={onNavigateJobTracker}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>View Job Tracker</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!hasJobs ? (
        /* Truthful Empty State (0 fake jobs) */
        <div className="py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            No tracked opportunities yet. Analyze target job descriptions in Job Intelligence to calibrate requirements and track your pipeline.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onNavigateJobIntelligence}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Job Description</span>
            </button>
            <button
              onClick={onNavigateJobTracker}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Job Tracker
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Status Quick Counters */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active</span>
                <span className="text-base font-black text-slate-900">{stats.activeApplications}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Interview</span>
                <span className="text-base font-black text-indigo-700">{stats.interview}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Saved</span>
                <span className="text-base font-black text-slate-800">{stats.saved}</span>
              </div>
            </div>
          )}

          {/* Recent Opportunities List */}
          <div className="space-y-2.5">
            {recentJobs.map((job) => (
              <div
                key={job._id}
                onClick={onNavigateJobTracker}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider truncate">
                      {job.company}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        job.status === 'OFFER'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : job.status === 'INTERVIEW'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : job.status === 'ASSESSMENT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : job.status === 'APPLIED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.analysisSnapshot?.matchScore !== undefined && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        • {job.analysisSnapshot.matchScore}% Match
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate mt-0.5">
                    {job.jobTitle}
                  </h4>
                </div>

                {job.nextAction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerAction(job.nextAction!.actionType, job.nextAction!.focusTopic);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center justify-between sm:justify-start gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>{job.nextAction.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
