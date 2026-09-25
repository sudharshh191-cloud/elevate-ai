import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlayCircle,
  FileText,
  User,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Target,
  Clock,
  Trash2,
  Layers,
  ChevronRight,
  Loader2,
  TrendingUp,
  BookmarkPlus,
  Check,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  IUserProfile,
  IJobDescriptionAnalysis,
  IJobAnalysisEvidenceItem,
  IJobAnalysisGapItem,
  IJobAnalysisNextStep,
  IJobAnalysisRequirementCategory
} from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface JobIntelligencePageProps {
  user: IUserProfile | null;
  onNavigate: (page: string) => void;
  onOpenResumeModal: () => void;
  onStartTailoredMock?: (focusTopics: string) => void;
}

const SAMPLE_JOBS = [
  {
    title: 'Senior Full Stack Engineer',
    company: 'Stripe',
    description: `We are looking for a Senior Full Stack Engineer to join our Core Platform team.
Requirements:
- 5+ years of experience with React, TypeScript, and modern JavaScript
- Strong proficiency in Node.js, Go, or Java for high-throughput backend services
- Experience designing scalable distributed systems, REST APIs, and GraphQL
- Deep knowledge of PostgreSQL, Redis, and message queues (Kafka, RabbitMQ)
- Hands-on experience with AWS (EC2, ECS, S3, RDS) and Docker/Kubernetes
- Solid understanding of CI/CD pipelines, unit testing, and automated deployment
- Bachelor's degree in Computer Science or equivalent practical experience.`
  },
  {
    title: 'Lead Backend & Distributed Systems Engineer',
    company: 'Cloudflare',
    description: `Cloudflare is seeking a Lead Backend Engineer to build high-performance edge infrastructure.
Requirements:
- Proven experience with Go, Rust, or C++ in high-concurrency production systems
- Deep knowledge of distributed systems, Raft consensus, and event-driven architecture
- Experience with low-latency key-value stores, Redis, ClickHouse, and PostgreSQL
- Strong grasp of network protocols (HTTP/3, TCP/IP, gRPC, WebSockets)
- Hands-on expertise with Kubernetes, Docker, and Linux kernel fundamentals
- Proven track record of leading architectural reviews and mentoring engineers.`
  },
  {
    title: 'Frontend Architecture Engineer',
    company: 'Vercel',
    description: `Vercel is looking for a Frontend Engineer to scale our design systems and web experiences.
Requirements:
- 4+ years of professional experience with React, Next.js, and TypeScript
- Mastery of modern CSS, Tailwind CSS, responsive UI/UX, and Web Performance (Core Web Vitals)
- Deep understanding of state management, browser rendering lifecycle, and Web Workers
- Experience building component libraries and accessibility (WCAG a11y) standards
- Proficiency with automated testing using Jest, Playwright, or Cypress.`
  }
];

export const JobIntelligencePage: React.FC<JobIntelligencePageProps> = ({
  user,
  onNavigate,
  onOpenResumeModal,
  onStartTailoredMock
}) => {
  const { requireAuth, isAuthenticated } = useAuth();

  // Form State
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Analysis Result State (active analysis view)
  const [analysis, setAnalysis] = useState<IJobDescriptionAnalysis | null>(null);
  const [addedGaps, setAddedGaps] = useState<Record<string, boolean>>({});
  const [addingGapSkill, setAddingGapSkill] = useState<string | null>(null);
  const [isTracked, setIsTracked] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Recent Analyses State
  const [recentAnalyses, setRecentAnalyses] = useState<IJobDescriptionAnalysis[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(false);

  // Active Filter for Gaps
  const [gapFilter, setGapFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const loadingMessages = [
    'Analyzing job requirements...',
    'Comparing the role with your profile & resume...',
    'Identifying evidence and skill gaps...',
    'Preparing your recommendations...'
  ];

  // Fetch recent job analyses on mount (never block initial render)
  useEffect(() => {
    loadRecentAnalyses();
  }, [user?._id, isAuthenticated]);

  const loadRecentAnalyses = async () => {
    try {
      setIsLoadingRecent(true);
      const res = await ApiService.getRecentJobAnalyses();
      if (res?.analyses && Array.isArray(res.analyses)) {
        setRecentAnalyses(res.analyses);
      }
    } catch (err) {
      console.warn('Could not load recent job analyses:', err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // Progressive Loading State Message Cycling
  useEffect(() => {
    let timer: any;
    if (isAnalyzing) {
      setLoadingStepIndex(0);
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Handle Analysis Submission
  const handleAnalyze = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError('Please paste a full job description (minimum 20 characters).');
      return;
    }

    requireAuth(async () => {
      setError(null);
      setIsAnalyzing(true);

      try {
        const result = await ApiService.analyzeJobDescription(
          jobDescription.trim(),
          jobTitle.trim() || undefined,
          company.trim() || undefined
        );

        if (result) {
          setAnalysis(result);
          // Refresh recent analyses list
          loadRecentAnalyses();
        } else {
          setError("Job analysis couldn't be completed. Please try again.");
        }
      } catch (err: any) {
        console.error('Job Intelligence Analysis Error:', err);
        setError(err.message || "Job analysis couldn't be completed. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    }, 'Analyze Target Job Description');
  };

  // Add Gap to Adaptive Roadmap
  const handleAddToPlan = async (gap: IJobAnalysisGapItem) => {
    if (!gap.skill) return;

    requireAuth(async () => {
      setAddingGapSkill(gap.skill);

      try {
        await ApiService.addJobGapToRoadmap({
          skill: gap.skill,
          category: gap.category,
          reason: gap.reason,
          jobTitle: analysis?.jobTitle,
          company: analysis?.company,
          actionTarget: {
            type: gap.actionType || 'arena',
            label: gap.actionLabel || 'Practice',
            focusTopic: gap.skill
          }
        });

        setAddedGaps((prev) => ({ ...prev, [gap.skill]: true }));
      } catch (err: any) {
        console.error('Error adding gap to roadmap:', err);
        alert(err.message || 'Failed to add item to roadmap.');
      } finally {
        setAddingGapSkill(null);
      }
    }, `Add ${gap.skill} to Adaptive Roadmap`);
  };

  // Track / Save Job to Job Tracker Pipeline
  const handleTrackOpportunity = async () => {
    if (!analysis) return;

    requireAuth(async () => {
      setIsTracking(true);
      try {
        await ApiService.createTrackedJob({
          jobTitle: analysis.jobTitle,
          company: analysis.company || 'Target Organization',
          jobDescription: analysis.jobDescription || jobDescription,
          source: 'Job Intelligence',
          jobAnalysisId: analysis._id || analysis.analysisId,
          targetRole: user?.targetRole,
          analysisSnapshot: {
            matchScore: analysis.matchScore,
            requiredSkills: analysis.requiredSkills,
            missingSkills: (analysis as any).missingSkills || analysis.skillsToDevelop,
            matchedSkills: strongMatchingSkills,
            evidenceBreakdown: analysis.evidenceBreakdown,
            gaps: analysis.gaps,
            likelyInterviewTopics: analysis.likelyInterviewTopics,
            preparationStrategy: Array.isArray(analysis.preparationStrategy)
              ? analysis.preparationStrategy
              : typeof analysis.preparationStrategy === 'string'
              ? [analysis.preparationStrategy]
              : [],
            overview: analysis.overview,
          },
          syncRoadmap: true,
        });
        setIsTracked(true);
      } catch (err: any) {
        console.error('Error tracking opportunity:', err);
        alert(err.message || 'Failed to track opportunity.');
      } finally {
        setIsTracking(false);
      }
    }, 'Track Target Job Opportunity');
  };

  // Delete a saved analysis
  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiService.deleteJobAnalysis(id);
      setRecentAnalyses((prev) => prev.filter((a) => (a._id || a.analysisId) !== id));
      if ((analysis?._id || analysis?.analysisId) === id) {
        setAnalysis(null);
      }
    } catch (err: any) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const handleSelectSampleJob = (sample: typeof SAMPLE_JOBS[0]) => {
    setJobTitle(sample.title);
    setCompany(sample.company);
    setJobDescription(sample.description);
    setError(null);
  };

  const hasResume = Boolean(
    user?.resumeUrl ||
    (user?.parsedResumeData?.extractedSkills && user.parsedResumeData.extractedSkills.length > 0)
  );

  const hasTargetRole = Boolean(user?.targetRole?.trim());

  // Defensive field extractions for analysis rendering
  const strongMatchingSkills: string[] = analysis?.strongMatchingSkills ||
    (analysis?.evidenceBreakdown ? analysis.evidenceBreakdown.filter(e => e.status === 'MATCHED').map(e => e.skill) : []);

  const skillsToDevelop: string[] = analysis?.skillsToDevelop ||
    (analysis?.evidenceBreakdown ? analysis.evidenceBreakdown.filter(e => e.status !== 'MATCHED').map(e => e.skill) : []);

  const categorizedRequirements: IJobAnalysisRequirementCategory[] = analysis?.categorizedRequirements || [];
  const evidenceBreakdown: IJobAnalysisEvidenceItem[] = analysis?.evidenceBreakdown || [];
  const gaps: IJobAnalysisGapItem[] = analysis?.gaps || [];
  const nextSteps: IJobAnalysisNextStep[] = analysis?.nextSteps || [];
  const likelyInterviewTopics: string[] = analysis?.likelyInterviewTopics || [];
  const preparationStrategy: string[] = Array.isArray(analysis?.preparationStrategy)
    ? analysis.preparationStrategy
    : typeof analysis?.preparationStrategy === 'string'
    ? [analysis.preparationStrategy]
    : [];

  const totalRequirementsCount = evidenceBreakdown.length > 0
    ? evidenceBreakdown.length
    : categorizedRequirements.reduce((acc, c) => acc + (c.skills?.length || 0), 0);

  // Filtered gaps list
  const filteredGaps = gaps.filter((gap) => {
    if (gapFilter === 'ALL') return true;
    return gap.priority === gapFilter;
  });

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* HEADER BANNER                                                             */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">JOB INTELLIGENCE</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Target Role Calibration
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Understand how your profile matches the jobs you want.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recentAnalyses.length > 0 && !analysis && (
            <button
              onClick={() => setShowRecentHistory(!showRecentHistory)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showRecentHistory
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Saved Analyses ({recentAnalyses.length})</span>
            </button>
          )}

          {analysis && (
            <button
              onClick={() => {
                setAnalysis(null);
                setJobDescription('');
                setJobTitle('');
                setCompany('');
                setError(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Analyze Another Job</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MISSING DATA ALERTS & PERSONALIZATION CARDS                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!hasResume && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-950">Your resume hasn't been analyzed yet</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Upload your resume in the Resume Hub to automatically cross-reference verified work history and keywords against target roles.
              </p>
              <button
                onClick={onOpenResumeModal}
                className="mt-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Upload & Analyze Resume</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {!hasTargetRole && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-950">Set your target role for deeper calibration</h4>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Set your desired target role in your Profile to receive tailored interview rubrics and seniority calibration.
              </p>
              <button
                onClick={() => onNavigate('profile')}
                className="mt-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Set Target Role in Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECENT ANALYSES DRAWER (WHEN TOGGLED)                                     */}
      {/* ========================================================================= */}
      {showRecentHistory && recentAnalyses.length > 0 && !analysis && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Saved Target Job Analyses
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{recentAnalyses.length} saved</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {recentAnalyses.map((item, idx) => (
              <div
                key={item._id || item.analysisId || idx}
                onClick={() => {
                  setAnalysis(item);
                  setShowRecentHistory(false);
                }}
                className="p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
              >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{item.jobTitle}</span>
                      <button
                        onClick={(e) => handleDeleteAnalysis(item._id || item.analysisId || '', e)}
                        title="Delete saved analysis"
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[11px] text-indigo-300 font-medium truncate">
                      {item.company || 'Target Organization'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                    <span>{item.gaps?.length || item.skillsToDevelop?.length || 0} skill gaps</span>
                    <span>
                      {item.createdAt || item.savedAt
                        ? new Date(item.createdAt || item.savedAt || '').toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INITIAL JOB INPUT VIEW (When no active analysis)                       */}
      {/* ========================================================================= */}
      {!analysis && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Analyze a Target Job
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Paste a target job description and ELEVATE will compare it with your profile, resume, skills and target role.
              </p>
            </div>

            {/* Optional Role & Company Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Job Title <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Company <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-sans"
                />
              </div>
            </div>

            {/* Large Job Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Job Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {jobDescription.trim() ? `${jobDescription.trim().split(/\s+/).length} words` : 'Paste the complete job description here'}
                </span>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here (responsibilities, required qualifications, technical stack, bonus skills)..."
                rows={8}
                className="w-full p-4 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all resize-y font-sans leading-relaxed"
              />
            </div>

            {/* Sample Quick Jobs Pill Bar */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or Try a Real Sample Tech Job Posting:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_JOBS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSampleJob(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{s.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({s.company})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message & Retry */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2.5 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{loadingMessages[loadingStepIndex]}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze Job</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RECENT JOB ANALYSES SECTION (Always shown in empty state)                  */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  RECENT JOB ANALYSES
                </h3>
              </div>
              {recentAnalyses.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  {recentAnalyses.length} saved
                </span>
              )}
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-slate-800">No job analyses yet.</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Analyze your first target job to see your personalized skill gaps.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {recentAnalyses.map((item, idx) => (
                  <div
                    key={item._id || item.analysisId || idx}
                    onClick={() => setAnalysis(item)}
                    className="p-4 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.jobTitle}
                        </span>
                        <button
                          onClick={(e) => handleDeleteAnalysis(item._id || item.analysisId || '', e)}
                          title="Delete saved analysis"
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {item.company || 'Target Organization'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                      <span className="font-semibold text-indigo-700">
                        {item.gaps?.length || item.skillsToDevelop?.length || 0} skill gaps
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ANALYSIS RESULTS VIEW (When an analysis is active)                      */}
      {/* ========================================================================= */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Job Role Card & Match Overview */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {analysis.jobTitle}
                  </h2>
                  {analysis.company && (
                    <span className="text-xs font-semibold text-slate-500">• {analysis.company}</span>
                  )}
                </div>
                {analysis.overview && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                    {analysis.overview}
                  </p>
                )}
              </div>

              {/* Real Data Evidence Summary Pill & Track Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 shrink-0 text-center sm:text-right w-full sm:w-auto">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-900">
                    Candidate Evidence Match
                  </div>
                  <div className="flex items-baseline justify-center sm:justify-end gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-indigo-700">
                      {strongMatchingSkills.length}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      / {totalRequirementsCount || strongMatchingSkills.length + skillsToDevelop.length} Required Skills
                    </span>
                  </div>
                </div>

                {isTracked ? (
                  <button
                    onClick={() => onNavigate('job-tracker')}
                    className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs w-full sm:w-auto justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tracked in Pipeline →</span>
                  </button>
                ) : (
                  <button
                    onClick={handleTrackOpportunity}
                    disabled={isTracking}
                    className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow w-full sm:w-auto justify-center"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>{isTracking ? 'Saving...' : 'Track Opportunity'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Verified Sources Pill Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Calibration Sources:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Candidate Profile: {user?.targetRole || 'Configured'}
              </span>
              {hasResume && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100">
                  Resume Skills ({user?.parsedResumeData?.extractedSkills?.length || 0})
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                {strongMatchingSkills.length} Matched
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-100">
                {skillsToDevelop.length || gaps.length} Gaps
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 2. JOB REQUIREMENTS BY CATEGORY                                       */}
          {/* ===================================================================== */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                JOB REQUIREMENTS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Extracted explicit technical and engineering requirements from the provided job description.
              </p>
            </div>

            {categorizedRequirements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {categorizedRequirements.map((cat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>{cat.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(cat.skills || []).map((skill, sIdx) => {
                        const isMatched = strongMatchingSkills.some(
                          (m) => m.toLowerCase().trim() === skill.toLowerCase().trim()
                        );
                        return (
                          <span
                            key={sIdx}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {isMatched ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            )}
                            <span>{skill}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {(analysis.requiredSkills || []).map((req, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* 3. YOUR CURRENT EVIDENCE                                              */}
          {/* ===================================================================== */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                YOUR CURRENT EVIDENCE
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of each requirement against verified candidate evidence across Resume, Profile, and Platform logs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {evidenceBreakdown.map((item, idx) => {
                const isMatched = item.status === 'MATCHED';
                const isPartial = item.status === 'PARTIAL';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isMatched
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : isPartial
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : 'bg-slate-50/50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {isMatched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isPartial ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-900">{item.skill}</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-200/70 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isMatched ? 'MATCHED' : isPartial ? 'PARTIAL / RELATED' : 'NO EVIDENCE FOUND'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                      {item.evidenceText || (isMatched ? 'Verified match found in your profile and skills.' : isPartial ? 'Related background or partial evidence identified.' : 'No evidence found in your current profile/resume.')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 4. YOUR GAPS (Prioritized Breakdown)                                  */}
          {/* ===================================================================== */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  YOUR GAPS
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-priority skills required by this role that lack evidence in your current profile or resume.
                </p>
              </div>

              {/* Priority Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setGapFilter(p)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                      gapFilter === p ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'ALL' ? 'All Gaps' : `${p} Priority`}
                  </button>
                ))}
              </div>
            </div>

            {filteredGaps.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-xs font-bold text-slate-800">No Gaps Found In This Category</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Your candidate evidence matches all requirements for this priority level.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {filteredGaps.map((gap, idx) => {
                  const isAdded = addedGaps[gap.skill];
                  const isAdding = addingGapSkill === gap.skill;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{gap.skill}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              gap.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : gap.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {gap.priority} PRIORITY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{gap.reason}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {/* Add to Adaptive Roadmap CTA */}
                        <button
                          onClick={() => handleAddToPlan(gap)}
                          disabled={isAdded || isAdding}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200'
                          }`}
                        >
                          {isAdding ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isAdded ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                          <span>{isAdded ? 'Added to Roadmap' : 'Add to My Plan'}</span>
                        </button>

                        {/* Direct Action Link */}
                        <button
                          onClick={() => {
                            if (gap.actionType === 'arena') {
                              onNavigate('arena');
                            } else if (gap.actionType === 'system-design') {
                              onNavigate('system-design');
                            } else if (gap.actionType === 'resume') {
                              onOpenResumeModal();
                            } else {
                              onNavigate('profile');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{gap.actionLabel || 'Practice'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* 5. WHAT SHOULD I DO NEXT? (Actionable Steps)                          */}
          {/* ===================================================================== */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                WHAT SHOULD I DO NEXT?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Actionable preparation steps connecting directly into ELEVATE.AI platform tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {nextSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{step.reason}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (step.actionType === 'arena') {
                        onNavigate('arena');
                      } else if (step.actionType === 'system-design') {
                        onNavigate('system-design');
                      } else if (step.actionType === 'resume') {
                        onOpenResumeModal();
                      } else {
                        onNavigate('profile');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span>{step.actionLabel || 'Get Started'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 6. LIKELY INTERVIEW TOPICS & PREPARATION STRATEGY                    */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Likely Interview Topics */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Likely Technical Interview Topics
              </h3>
              <p className="text-xs text-slate-500">
                Core concepts and architecture questions frequently asked for this level and stack:
              </p>

              <div className="space-y-2 pt-2">
                {likelyInterviewTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Strategy */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Preparation & Practice Strategy
              </h3>
              <p className="text-xs text-slate-500">
                Action plan recommended by ELEVATE.AI to maximize your candidate interview readiness:
              </p>

              <div className="space-y-2 pt-2">
                {preparationStrategy.map((strat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/80 flex items-start gap-2.5 text-xs text-indigo-950"
                  >
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{strat}</span>
                  </div>
                ))}
              </div>

              {onStartTailoredMock && (
                <div className="pt-3">
                  <button
                    onClick={() => {
                      const topGaps = gaps.slice(0, 3).map((g) => g.skill).join(', ');
                      onStartTailoredMock(topGaps || analysis.jobTitle);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Launch Tailored Assessment for {analysis.jobTitle}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

