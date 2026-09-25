import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  UploadCloud, 
  Layers, 
  Cpu, 
  Database, 
  Cloud, 
  Terminal, 
  Briefcase, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Loader2,
  Target
} from 'lucide-react';
import { IUserProfile, IJobDescriptionAnalysis } from '../types';
import { AuthGate } from '../components/auth/AuthGate';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';

interface ResumeHubPageProps {
  user: IUserProfile | null;
  onOpenUploadModal: () => void;
  onStartTailoredMock: (customFocus?: string) => void;
}

export const ResumeHubPage: React.FC<ResumeHubPageProps> = ({
  user,
  onOpenUploadModal,
  onStartTailoredMock,
}) => {
  const { requireAuth } = useAuth();
  const resume = user?.parsedResumeData;
  const extractedSkills = resume?.extractedSkills || [];

  // Job Description Intelligence State
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState<IJobDescriptionAnalysis | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);

  // Categorize extracted skills dynamically based on actual skills present
  const languageSet = new Set(['TypeScript', 'JavaScript', 'Python', 'Go', 'Golang', 'Rust', 'Java', 'C++', 'C#', 'C', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'SQL', 'HTML5', 'CSS3']);
  const frontendSet = new Set(['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Redux', 'Zustand', 'Tailwind CSS', 'Sass', 'Webpack', 'Vite', 'WebSockets', 'WebRTC', 'Web Audio API', 'GraphQL']);
  const backendSet = new Set(['Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'NestJS', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'SQLite', 'Elasticsearch', 'Neo4j', 'Prisma', 'Mongoose', 'REST APIs', 'gRPC', 'Microservices']);
  const devopsSet = new Set(['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Nginx', 'Kafka', 'RabbitMQ', 'System Design', 'Distributed Systems', 'Jest', 'Pytest', 'Cypress']);

  const languages = extractedSkills.filter((s) => languageSet.has(s));
  const frontend = extractedSkills.filter((s) => frontendSet.has(s));
  const backend = extractedSkills.filter((s) => backendSet.has(s));
  const devops = extractedSkills.filter((s) => devopsSet.has(s));
  const otherSkills = extractedSkills.filter((s) => !languageSet.has(s) && !frontendSet.has(s) && !backendSet.has(s) && !devopsSet.has(s));

  const skillGroups = [
    { title: 'Core Languages', icon: Terminal, skills: languages, color: 'text-indigo-600' },
    { title: 'Frontend Architecture', icon: Cpu, skills: frontend, color: 'text-sky-600' },
    { title: 'Backend & Databases', icon: Database, skills: backend, color: 'text-emerald-600' },
    { title: 'Cloud & Distributed Systems', icon: Cloud, skills: devops, color: 'text-purple-600' },
    ...(otherSkills.length > 0 ? [{ title: 'Specialized Skills & Tools', icon: Layers, skills: otherSkills, color: 'text-amber-600' }] : []),
  ].filter((g) => g.skills.length > 0);

  // Strict Data-Driven: No fake numbers
  const atsScore = typeof resume?.atsScore === 'number' ? resume.atsScore : null;
  const targetRoleMatch = typeof resume?.targetRoleMatch === 'number' ? resume.targetRoleMatch : null;
  const hasResume = Boolean(user?.resumeUrl || (resume && extractedSkills.length > 0));

  const handleAnalyzeJobDescription = async () => {
    if (!jobDescriptionInput.trim()) return;

    setIsAnalyzingJd(true);
    setJdError(null);
    try {
      const result = await ApiService.analyzeJobDescription(jobDescriptionInput.trim());
      setJdAnalysis(result);
    } catch (err: any) {
      console.error('Job analysis error:', err);
      setJdError(err.message || 'Failed to analyze job description.');
    } finally {
      setIsAnalyzingJd(false);
    }
  };

  const handleStartJdMock = () => {
    if (!jdAnalysis) return;
    const focusTopics = [
      ...jdAnalysis.skillsToDevelop.slice(0, 3),
      ...jdAnalysis.likelyInterviewTopics.slice(0, 2),
    ].join(', ');

    requireAuth(() => onStartTailoredMock(focusTopics), `Tailored Mock for ${jdAnalysis.jobTitle}`);
  };

  return (
    <AuthGate
      feature="Resume Intelligence & Gap Analysis"
      title="Resume Analysis Requires Sign In"
      description="Sign in or create an ELEVATE.AI account to analyze your resume, calculate ATS alignment scores, and generate customized interview questions."
    >
      <div className="space-y-6 pb-16">
        {/* Header Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resume & Job Description Intelligence</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Role: <strong className="text-slate-900">{user?.targetRole || 'Target role not set'}</strong>
                {atsScore !== null && (
                  <>
                    {' '}• ATS Score: <strong className="text-indigo-700 font-mono">{atsScore}/100</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => requireAuth(onOpenUploadModal, 'Resume Upload & Indexing')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>{hasResume ? 'Upload New Resume' : 'Upload Resume'}</span>
            </button>
            {hasResume && (
              <button
                onClick={() => requireAuth(() => onStartTailoredMock(), 'Tailored Resume Mock')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Tailored Mock</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. RESUME PROFILE & SYNTHESIS */}
        {hasResume ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ATS Score Card (Only rendered when real atsScore exists) */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between items-center text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Score</span>
              
              {atsScore !== null ? (
                <div className="my-4 w-28 h-28 rounded-full border-4 border-emerald-100 flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-full bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-emerald-700 font-mono">{atsScore}%</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-800">
                      {atsScore >= 80 ? 'OPTIMIZED' : 'PARSED'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  ATS Score calculating...
                </div>
              )}

              {targetRoleMatch !== null ? (
                <p className="text-xs text-slate-600">
                  Role Alignment: <strong className="text-indigo-700 font-mono">{targetRoleMatch}%</strong>
                </p>
              ) : (
                <p className="text-xs text-slate-500">Skills parsed from resume</p>
              )}
            </div>

            {/* Role Alignment & Synthesis */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Candidate Profile Synthesis</h3>
                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 font-semibold px-2.5 py-1 rounded-lg">
                  {typeof resume?.experienceYears === 'number' && resume.experienceYears > 0
                    ? `${resume.experienceYears}+ Years Experience`
                    : user?.experienceLevel
                    ? `${user.experienceLevel} Track`
                    : 'Experience information unavailable'}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                "{resume?.summary || (extractedSkills.length > 0 ? `Candidate profile indexed with ${extractedSkills.length} verified competencies in ${extractedSkills.slice(0, 5).join(', ')}.` : 'Candidate profile synthesis will appear here once your resume is analyzed.')}"
              </p>

              {resume?.recommendedFocusAreas && resume.recommendedFocusAreas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Recommended High-Priority Interview Focus Areas</span>
                  </span>
                  <div className="space-y-1.5">
                    {resume.recommendedFocusAreas.map((area, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-slate-800 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span>{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Clean Empty State */
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 shadow-2xs text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Resume Analyzed Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your PDF or DOCX resume to extract verified skills, calculate ATS benchmark scores, and tailor AI mock interview questions to your background.
              </p>
            </div>
            <button
              onClick={() => requireAuth(onOpenUploadModal, 'Resume Upload & Indexing')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your Resume</span>
            </button>
          </div>
        )}

        {/* 2. CATEGORIZED SKILLS GRID */}
        {skillGroups.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Extracted Skills & Domain Competencies</h3>
              <p className="text-xs text-slate-500">Indexed from your resume and mapped into AI interview question generation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skillGroups.map((group, idx) => {
                const IconComponent = group.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${group.color}`} />
                        <span className="text-xs font-bold text-slate-800">{group.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">{group.skills.length}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {group.skills.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono shadow-2xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. JOB DESCRIPTION INTELLIGENCE & SKILL GAP ENGINE */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  JOB DESCRIPTION INTELLIGENCE & SKILL GAP
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Job Match Analysis
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste a target job posting to extract requirements, calculate real skill overlap, and identify interview topics
              </p>
            </div>
          </div>

          {/* Job Description Input Form */}
          <div className="space-y-3">
            <textarea
              value={jobDescriptionInput}
              onChange={(e) => setJobDescriptionInput(e.target.value)}
              placeholder="Paste job description (e.g. Senior Software Engineer at Google, Frontend Architect at Stripe, Fullstack Developer at Meta)..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans resize-y"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {jobDescriptionInput.trim() ? `${jobDescriptionInput.trim().split(/\s+/).length} words` : 'Paste full JD requirements'}
              </span>

              <button
                onClick={handleAnalyzeJobDescription}
                disabled={isAnalyzingJd || !jobDescriptionInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isAnalyzingJd ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Job Requirements...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Analyze Skill Gap & Job Match</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {jdError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {jdError}
            </p>
          )}

          {/* Real Analysis Output or Empty State */}
          {!jdAnalysis ? (
            <div className="py-6 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
              <Target className="w-6 h-6 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No Job Description Analyzed Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Paste a target job posting above to generate an exact breakdown of strong matching skills, missing technologies, and likely interview questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
              {/* Score & Job Overview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{jdAnalysis.jobTitle}</span>
                    <span className="text-xs text-slate-500">• {jdAnalysis.company}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{jdAnalysis.overview}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Job Match</span>
                    <span className="text-xl font-bold font-mono text-indigo-600">{jdAnalysis.matchScore}%</span>
                  </div>

                  <button
                    onClick={handleStartJdMock}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Practice for this Job</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2-Column Skills Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strong Matches */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Strong Matching Skills ({jdAnalysis.strongMatchingSkills.length})
                  </span>
                  {jdAnalysis.strongMatchingSkills.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No direct keyword overlap found yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {jdAnalysis.strongMatchingSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white text-emerald-800 font-semibold border border-emerald-200 shadow-2xs"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills to Develop */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Skills to Develop / Gaps ({jdAnalysis.skillsToDevelop.length})
                  </span>
                  {jdAnalysis.skillsToDevelop.length === 0 ? (
                    <p className="text-[11px] text-emerald-700 font-medium">All core requirements matched!</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {jdAnalysis.skillsToDevelop.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white text-amber-900 font-medium border border-amber-200 shadow-2xs"
                        >
                          ⚠ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Likely Interview Topics & Strategy */}
              {jdAnalysis.likelyInterviewTopics.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800">
                    Expected Technical Interview Questions & Topics:
                  </span>
                  <div className="space-y-1">
                    {jdAnalysis.likelyInterviewTopics.map((topic, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
};
