import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  BarChart2,
  AlertCircle,
  Terminal,
  Clock,
  Code,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { IFeedbackReport } from '../types';
import { ScorecardGrid } from '../components/report/ScorecardGrid';
import { SkillRadarChart } from '../components/dashboard/SkillRadarChart';
import { AnswerComparison } from '../components/report/AnswerComparison';
import { ActionPlan } from '../components/report/ActionPlan';
import { ShareScorecardModal } from '../components/report/ShareScorecardModal';
import { ApiService } from '../services/api';
import { AuthGate } from '../components/auth/AuthGate';
import { useAuth } from '../context/AuthContext';

interface AnalyticsPageProps {
  reportId?: string;
  onBackToDashboard: () => void;
  onStartNewMock: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  reportId,
  onBackToDashboard,
  onStartNewMock,
}) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [report, setReport] = useState<IFeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoReports, setHasNoReports] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadReport = async () => {
      setIsLoading(true);
      setHasNoReports(false);
      try {
        let targetId = reportId;

        // If no reportId supplied, load the most recent session from history
        if (!targetId) {
          const history = await ApiService.getInterviewHistory(1);
          if (history?.sessions?.length) {
            targetId = history.sessions[0]._id;
          }
        }

        if (targetId) {
          const res = await ApiService.getFeedbackReport(targetId);
          if (res?.report) {
            setReport(res.report);
          } else {
            setHasNoReports(true);
          }
        } else {
          setHasNoReports(true);
        }
      } catch (err) {
        console.error('Error loading feedback report:', err);
        setHasNoReports(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId, isAuthenticated]);

  const handleDownloadPdf = async () => {
    if (!report?.sessionId) return;
    setIsDownloadingPdf(true);
    setDownloadError(null);
    try {
      await ApiService.downloadReportPdf(report.sessionId);
    } catch (err: any) {
      console.error('PDF download failed:', err);
      setDownloadError(err.message || 'Failed to download PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthGate
        feature="Assessment Scorecards & Feedback Reports"
        title="Scorecard Requires Sign In"
        description="Sign in or create an ELEVATE.AI account to view your verified assessment performance, real test-case evidence, and personalized study roadmaps."
      >
        <div />
      </AuthGate>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <p className="text-xs text-slate-500">Loading your verified assessment results...</p>
      </div>
    );
  }

  if (hasNoReports || !report) {
    return (
      <div className="space-y-6 pb-16">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Assessment Results & Skill Evidence</h1>
              <p className="text-xs text-slate-500">Real performance evaluation and career evidence.</p>
            </div>
          </div>
        </div>

        <div className="p-12 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No assessment results yet.</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Complete an assessment in the Mock Arena to build your verified skill evidence and performance history.
            </p>
          </div>
          <button
            onClick={onStartNewMock}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Assessment</span>
          </button>
        </div>
      </div>
    );
  }

  const overview = report.performanceOverview;
  const questionResults = report.questionResults || [];
  const skillEvidence = report.skillEvidence || [];
  const performanceAreas = report.performanceAreas || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assessment Results & Skill Evidence</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                {report.performanceTier || 'Evaluated'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Domain: <strong className="text-indigo-700">{report.domain}</strong> • Difficulty: <strong className="text-slate-700">{report.difficulty}</strong> • Evaluated: {new Date(report.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Download PDF report"
          >
            {isDownloadingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Report PDF'}</span>
          </button>

          {/* Share Scorecard Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="Generate a public read-only link"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Share Results</span>
          </button>

          {/* Retake Mock Button */}
          <button
            onClick={() => requireAuth(onStartNewMock, 'Retake Assessment')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take Another Assessment</span>
          </button>
        </div>
      </div>

      {/* Download Error Alert if any */}
      {downloadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Master Score & Multi-Dimensional Overview */}
      <ScorecardGrid report={report} />

      {/* Real Performance Overview Metrics Grid */}
      {overview && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Real Execution Telemetry</h3>
              <p className="text-xs text-slate-500">Directly measured from runtime compiler and test case execution</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                Status: {overview.completionStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Questions Solved</span>
              <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                {overview.passedQuestions} <span className="text-xs text-slate-400 font-normal">/ {overview.totalQuestions}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Tests Passed</span>
              <span className="text-lg font-extrabold font-mono text-emerald-800 mt-0.5 block">
                {overview.passedTestCases} <span className="text-xs text-emerald-600/70 font-normal">/ {overview.totalTestCases}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Compile Errors</span>
              <span className={`text-lg font-extrabold font-mono mt-0.5 block ${overview.compileErrorsCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {overview.compileErrorsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Runtime Errors</span>
              <span className={`text-lg font-extrabold font-mono mt-0.5 block ${overview.runtimeErrorsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {overview.runtimeErrorsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Time Used</span>
              <span className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 block">
                {Math.round(overview.durationUsedSeconds / 60)}m <span className="text-xs text-slate-400 font-normal">/ {Math.round(overview.allocatedDurationSeconds / 60)}m</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Languages Used</span>
              <span className="text-xs font-semibold text-indigo-700 mt-1 block truncate">
                {Object.keys(overview.languagesUsed || {}).join(', ') || 'JavaScript'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Question-Level Real Results Table */}
      {questionResults.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Question-Level Breakdown</h3>
            <p className="text-xs text-slate-500">Real verified execution result for each question in this assessment</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Topic / Category</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Test Cases</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Language</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questionResults.map((q, idx) => {
                  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  let Icon = CheckCircle;

                  if (q.status === 'PASSED') {
                    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    Icon = CheckCircle2;
                  } else if (q.status === 'COMPILE_ERROR') {
                    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                    Icon = XCircle;
                  } else if (q.status === 'RUNTIME_ERROR' || q.status === 'TIMEOUT') {
                    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                    Icon = AlertTriangle;
                  } else if (q.status === 'PARTIAL') {
                    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200';
                    Icon = CheckCircle;
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 font-bold">
                        {q.problemNumber ? `#${q.problemNumber}` : `Q${idx + 1}`}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 max-w-[220px] truncate">
                        {q.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {q.topic}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeStyle}`}>
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{q.statusDisplay}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                        {q.passedTestCases}/{q.totalTestCases}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {q.score}/100
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {q.timeSpentSeconds > 0 ? `${Math.round(q.timeSpentSeconds)}s` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 uppercase text-[10px]">
                        {q.language || 'JS'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demonstrated Skill Evidence Section */}
      {skillEvidence.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Demonstrated Skill Evidence</h3>
              <p className="text-xs text-slate-500">Concrete career evidence translated from verified assessment performance</p>
            </div>
            <span className="text-xs font-mono text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
              {skillEvidence.length} Topic{skillEvidence.length > 1 ? 's' : ''} Assessed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillEvidence.map((ev, idx) => {
              const isDemonstrated = ev.status === 'DEMONSTRATED';
              const isDeveloping = ev.status === 'DEVELOPING';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    isDemonstrated
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isDeveloping
                      ? 'bg-sky-50/40 border-sky-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{ev.topic}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isDemonstrated
                          ? 'bg-emerald-100/70 text-emerald-800 border-emerald-300'
                          : isDeveloping
                          ? 'bg-sky-100/70 text-sky-800 border-sky-300'
                          : 'bg-amber-100/70 text-amber-800 border-amber-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {ev.evidenceText}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] font-mono text-slate-500">
                    <span>Pass Rate: <strong>{ev.testCasePassRate}%</strong></span>
                    <span>Tests: <strong>{ev.passedTestCases}/{ev.totalTestCases}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 12 Canonical Performance Areas */}
      {performanceAreas.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Core Engineering Performance Areas</h3>
            <p className="text-xs text-slate-500">
              Real assessment evidence across core computer science and engineering competencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {performanceAreas.map((area, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                  area.hasEvidence
                    ? 'bg-white border-indigo-200 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{area.area}</span>
                  {area.hasEvidence ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">No data</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {area.hasEvidence ? area.evidenceSummary : 'No assessment evidence yet.'}
                </p>

                {area.hasEvidence && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Solved: {area.problemsPassed}/{area.problemsAttempted}</span>
                    <span>Success: {area.successRate}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Answer Breakdown & Review */}
      {report.questionDetails && report.questionDetails.length > 0 && (
        <AnswerComparison report={report} />
      )}

      {/* Action Roadmap */}
      {report.actionableRoadmap && report.actionableRoadmap.length > 0 && (
        <ActionPlan report={report} onLaunchPractice={onStartNewMock} />
      )}

      {/* Share Scorecard Modal */}
      {isShareModalOpen && report.sessionId && (
        <ShareScorecardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sessionId={report.sessionId}
          initialShareId={report.shareId}
          initialShareEnabled={report.shareEnabled}
        />
      )}
    </div>
  );
};
