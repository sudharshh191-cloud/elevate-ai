import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Sparkles, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { ApiService } from '../services/api';
import { ScorecardGrid } from '../components/report/ScorecardGrid';
import { AnswerComparison } from '../components/report/AnswerComparison';
import { ActionPlan } from '../components/report/ActionPlan';

interface PublicScorecardPageProps {
  shareId: string;
  onExplorePlatform?: () => void;
}

export const PublicScorecardPage: React.FC<PublicScorecardPageProps> = ({ shareId, onExplorePlatform }) => {
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicReport = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await ApiService.getPublicScorecard(shareId);
        if (res?.report) {
          setReport(res.report);
        } else {
          setErrorMsg('Scorecard data is unavailable.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'This scorecard is unavailable or has been revoked by the owner.');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareId) {
      fetchPublicReport();
    } else {
      setErrorMsg('No share token provided.');
      setIsLoading(false);
    }
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 space-y-4 text-slate-800">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-mono">Loading verified assessment scorecard...</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scorecard Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {errorMsg || 'This scorecard link is either invalid, expired, or has been revoked by the candidate.'}
          </p>
        </div>
        {onExplorePlatform && (
          <button
            onClick={onExplorePlatform}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>Explore ELEVATE.AI Platform</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Brand Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-sm">
              E
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">ELEVATE<span className="text-indigo-600">.AI</span></span>
              <span className="text-[10px] text-slate-500 block">Verified Technical Assessment</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Verified Record</span>
            </div>
            {onExplorePlatform && (
              <button
                onClick={onExplorePlatform}
                className="hidden sm:flex px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Try ELEVATE.AI</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Hero Header Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {report.candidateName}'s Technical Assessment
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {report.performanceTier}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Domain: <strong className="text-indigo-700">{report.domain}</strong> • Track: <strong className="text-slate-700">{report.difficulty}</strong> • Completed on: {new Date(report.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">{report.overallScore}/100</span>
            </div>
          </div>
        </div>

        {/* 5-Dimensional Grid */}
        <ScorecardGrid report={report} />

        {/* Executive Summary & Key Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Executive Evaluation Summary</h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              "{report.executiveSummary}"
            </p>
            {report.topStrengths && report.topStrengths.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 block">Demonstrated Strengths</span>
                <div className="space-y-1.5">
                  {report.topStrengths.map((str: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Verification Authenticity</h3>
              <p className="text-xs text-slate-500 mt-1">
                This assessment was verified and generated live via ELEVATE.AI's interview evaluation system.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
              <span className="text-xs font-bold text-indigo-900 block">Hire Readiness</span>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Candidate demonstrated proficiency matching the criteria for <strong className="text-slate-900">{report.difficulty} {report.domain}</strong> roles.
              </p>
            </div>
          </div>
        </div>

        {/* Question Details */}
        {report.questionDetails && report.questionDetails.length > 0 && (
          <AnswerComparison report={report} />
        )}

        {/* Action Roadmap */}
        {report.actionableRoadmap && report.actionableRoadmap.length > 0 && (
          <ActionPlan report={report} onLaunchPractice={() => onExplorePlatform && onExplorePlatform()} />
        )}

        {/* Footer Banner */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900">Elevate Your Engineering Interview Preparation</h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Practice realistic AI mock interviews, code execution sandboxes, and interactive system design evaluations tailored to your resume.
          </p>
          {onExplorePlatform && (
            <button
              onClick={onExplorePlatform}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Free Mock Assessment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
