import { FileText, ArrowRight, Tag, Target, User, Briefcase } from 'lucide-react';

interface CareerProfileProps {
  hasResume: boolean;
  summary?: string;
  extractedSkills: string[];
  skillsCount: number;
  atsScore: number | null;
  targetRoleMatch: number | null;
  experienceYears: number | null;
  recommendedFocusAreas: string[];
  targetRole?: string;
  profileCompleteness?: number;
  completenessTier?: string;
  recentTargetJob?: { jobTitle: string; company?: string; gapsCount: number };
  onOpenResumeHub: () => void;
  onOpenUploadModal: () => void;
  onNavigateProfile?: () => void;
  onNavigateJobIntelligence?: () => void;
}

export const CareerProfileCard: React.FC<CareerProfileProps> = ({
  hasResume,
  extractedSkills,
  skillsCount,
  atsScore,
  targetRoleMatch,
  recommendedFocusAreas,
  targetRole,
  profileCompleteness,
  completenessTier,
  recentTargetJob,
  onOpenResumeHub,
  onOpenUploadModal,
  onNavigateProfile,
  onNavigateJobIntelligence,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                CAREER PROFILE & RESUME
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                Resume Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Extracted technical skills, ATS benchmark score, and target alignment
            </p>
          </div>

          <button
            onClick={onOpenResumeHub}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Resume Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!hasResume ? (
          /* Clean Empty State */
          <div className="py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">No Resume Analyzed Yet</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                Upload your PDF/DOCX resume to extract technical keywords, calculate role alignment, and generate tailored assessment questions.
              </p>
            </div>
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Upload & Analyze Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Real Profile & Resume Data */
          <div className="space-y-4">
            {/* Real Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {atsScore !== null && (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    ATS Score
                  </span>
                  <span className="text-lg font-bold text-indigo-600 font-mono">
                    {atsScore}
                    <span className="text-xs font-sans text-slate-400 font-normal">/100</span>
                  </span>
                </div>
              )}

              {targetRoleMatch !== null && (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Role Match
                  </span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    {targetRoleMatch}%
                  </span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Verified Skills
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {skillsCount}
                </span>
              </div>
            </div>

            {/* Extracted Skills Cloud */}
            {extractedSkills.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Extracted Technical Skills ({extractedSkills.length})
                  </span>
                  <button
                    onClick={onOpenResumeHub}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {extractedSkills.slice(0, 14).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {extractedSkills.length > 14 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono">
                      +{extractedSkills.length - 14} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Recommended Focus Areas */}
            {recommendedFocusAreas && recommendedFocusAreas.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  Recommended Focus for {targetRole || 'Your Track'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {recommendedFocusAreas.slice(0, 4).map((area, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-white text-amber-800 font-medium border border-amber-200"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Completeness Pill */}
            {typeof profileCompleteness === 'number' && (
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold text-indigo-950">
                    Profile Completeness ({profileCompleteness}%)
                  </span>
                  {completenessTier && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200/60 text-indigo-800 font-semibold">
                      {completenessTier}
                    </span>
                  )}
                </div>
                {onNavigateProfile && (
                  <button
                    onClick={onNavigateProfile}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-800 cursor-pointer"
                  >
                    Edit Profile →
                  </button>
                )}
              </div>
            )}

            {/* Target Job Intelligence Pill */}
            {recentTargetJob ? (
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-900 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    Recent Target Job
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {recentTargetJob.jobTitle} {recentTargetJob.company ? `— ${recentTargetJob.company}` : ''}
                  </div>
                  <div className="text-[10px] text-indigo-700">
                    {recentTargetJob.gapsCount} skill gap{recentTargetJob.gapsCount !== 1 ? 's' : ''} identified
                  </div>
                </div>
                {onNavigateJobIntelligence && (
                  <button
                    onClick={onNavigateJobIntelligence}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    View Analysis →
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    YOUR TARGET JOB
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Analyze a job description to discover your skill gaps.
                  </div>
                </div>
                {onNavigateJobIntelligence && (
                  <button
                    onClick={onNavigateJobIntelligence}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Analyze a Job →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {onNavigateProfile ? (
          <button
            onClick={onNavigateProfile}
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            <span>Manage Complete Profile</span>
          </button>
        ) : (
          <span className="text-slate-500">
            {hasResume ? 'Parsed from uploaded resume' : 'No fake resume metrics'}
          </span>
        )}
        <button
          onClick={onNavigateJobIntelligence || (hasResume ? onOpenResumeHub : onOpenUploadModal)}
          className="font-semibold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
        >
          Job Intelligence →
        </button>
      </div>
    </div>
  );
};
