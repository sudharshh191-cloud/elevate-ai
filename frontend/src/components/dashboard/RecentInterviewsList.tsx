import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, BarChart2, Sparkles } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface RecentInterviewsListProps {
  onViewReport: (id: string) => void;
  onStartNewMock: () => void;
}

export const RecentInterviewsList: React.FC<RecentInterviewsListProps> = ({ onViewReport, onStartNewMock }) => {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await ApiService.getInterviewHistory(5);
        if (data && data.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('Failed to load interview history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    return mins > 0 ? `${mins} mins` : `${secs || 0}s`;
  };

  const getVerdictStyle = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (score >= 70) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getVerdictText = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 85) return 'Strong Hire';
    if (score >= 75) return 'Hire';
    if (score >= 65) return 'Borderline';
    return 'Needs Practice';
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Recent Assessment History
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Verified Sessions
            </span>
          </h3>
          <p className="text-xs text-slate-500">Review AI multi-dimensional scorecards & rubric reports</p>
        </div>

        <button
          onClick={onStartNewMock}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Start New Mock</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span>Loading verified sessions...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center space-y-3 bg-slate-50/70 rounded-xl border border-slate-200/80 p-6">
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">No Mock Assessments Completed Yet</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Launch your first AI mock interview to generate 360° rubric scorecards and skill benchmarks.
            </p>
          </div>
          <button
            onClick={onStartNewMock}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Launch First Mock Assessment</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sessions.map((sess) => {
            const hasReport = Boolean(sess.feedbackReportRef?.overallScore);
            const hasResponses = Boolean(sess.responses?.length);
            const avgRespScore = hasResponses
              ? Math.round(
                  sess.responses.reduce(
                    (acc: number, r: any) => acc + (r.instantFeedback?.score || 75),
                    0
                  ) / sess.responses.length
                )
              : null;
            
            const isAbandoned = sess.status === 'abandoned';
            const scoreDisplay = hasReport
              ? `${sess.feedbackReportRef.overallScore}%`
              : avgRespScore !== null
              ? `${avgRespScore}%`
              : isAbandoned
              ? '—'
              : '—';

            let verdict = hasReport ? sess.feedbackReportRef.performanceTier : null;
            let verdictColor = 'text-slate-600 bg-slate-100 border-slate-200';

            if (hasReport) {
              verdictColor = getVerdictStyle(sess.feedbackReportRef.overallScore);
            } else if (isAbandoned) {
              if (sess.terminationReason === 'USER_EXITED') {
                verdict = 'Exited';
                verdictColor = 'text-slate-700 bg-slate-100 border-slate-200';
              } else if (sess.terminationReason === 'FULLSCREEN_TIMEOUT') {
                verdict = 'Timeout';
                verdictColor = 'text-amber-800 bg-amber-50 border-amber-200';
              } else {
                verdict = 'Incomplete';
                verdictColor = 'text-slate-600 bg-slate-100 border-slate-200';
              }
            } else if (avgRespScore !== null) {
              verdict = getVerdictText(avgRespScore);
              verdictColor = getVerdictStyle(avgRespScore);
            } else {
              verdict = 'Incomplete';
            }

            return (
              <div
                key={sess._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors group cursor-pointer"
                onClick={() => onViewReport(sess._id)}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-sm text-slate-900 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-all shadow-2xs">
                    {scoreDisplay}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition-colors flex items-center gap-2">
                      <span>{sess.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictColor}`}>
                        {verdict}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="text-indigo-600 font-medium">{sess.domain}</span>
                      <span>•</span>
                      <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDuration(sess.totalDurationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReport(sess._id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-xs font-medium text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
