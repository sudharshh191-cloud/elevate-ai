import React, { useState, useEffect } from 'react';
import { PlayCircle, Sparkles, UserCheck, Flame } from 'lucide-react';
import { IUserProfile, InterviewDomain, ExperienceLevel, InterviewFormat, IDashboardAnalytics } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPersonaConfig } from '../config/onboardingConfig';

// Data-Driven Dashboard Components
import { ElevateTodayCard } from '../components/dashboard/ElevateTodayCard';
import { ElevatePlanCard } from '../components/dashboard/ElevatePlanCard';
import { PracticeSnapshotCard } from '../components/dashboard/PracticeSnapshotCard';
import { CareerProfileCard } from '../components/dashboard/CareerProfileCard';
import { AskElevateCard } from '../components/dashboard/AskElevateCard';
import { ProgressOverviewCard } from '../components/dashboard/ProgressOverviewCard';
import { ActivityTimelineCard } from '../components/dashboard/ActivityTimelineCard';
import { RecentInterviewsList } from '../components/dashboard/RecentInterviewsList';
import { MyJobSearchCard } from '../components/dashboard/MyJobSearchCard';

interface DashboardPageProps {
  user: IUserProfile | null;
  onStartMock: (params: {
    domain?: InterviewDomain;
    difficulty?: ExperienceLevel;
    format?: InterviewFormat;
    customTopicFocus?: string;
    questionIds?: string[];
    selectedQuestionId?: string;
    durationMinutes?: number;
    title?: string;
  }) => void;
  onViewReport: (id: string) => void;
  onOpenResumeModal: () => void;
  onNavigate?: (page: 'dashboard' | 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence' | 'job-tracker' | 'jobs') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onStartMock,
  onViewReport,
  onOpenResumeModal,
  onNavigate,
}) => {
  const { requireAuth, isAuthenticated } = useAuth();
  const personaConfig = getPersonaConfig(user?.userType);
  const userPersona = user?.userType || 'JOB_SEEKER';

  const [dashboardData, setDashboardData] = useState<IDashboardAnalytics | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedDomain, setSelectedDomain] = useState<InterviewDomain>(
    userPersona === 'PROFESSIONAL' ? 'System Design' : userPersona === 'STUDENT' ? 'Fullstack' : 'Frontend'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExperienceLevel>(
    (user?.experienceLevel as ExperienceLevel) || (userPersona === 'PROFESSIONAL' ? 'Senior' : 'Mid')
  );
  const [selectedFormat, setSelectedFormat] = useState<InterviewFormat>('Hybrid');

  // Load real verified MongoDB data
  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      setIsLoadingData(true);
      try {
        const data = await ApiService.getDashboardAnalytics();
        if (isMounted && data) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [user?._id, isAuthenticated]);

  const handleTabNavigate = (tab: 'dashboard' | 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence' | 'job-tracker' | 'jobs') => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleTriggerJobAction = (actionType: string, _focusTopic?: string) => {
    if (actionType === 'practice') {
      const domain: InterviewDomain = selectedDomain || 'Fullstack';
      handleDomainLaunch(domain);
    } else if (actionType === 'interview') {
      handleLaunch();
    } else if (actionType === 'resume') {
      handleTabNavigate('resume');
    } else if (actionType === 'system-design') {
      handleTabNavigate('system-design');
    } else if (actionType === 'job-intelligence') {
      handleTabNavigate('job-intelligence');
    } else {
      handleTabNavigate('arena');
    }
  };

  const handleLaunch = () => {
    requireAuth(() => {
      onStartMock({
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        format: selectedFormat,
      });
    }, `${selectedDifficulty} ${selectedDomain} Mock Assessment`);
  };

  const handleDomainLaunch = (domain: InterviewDomain) => {
    requireAuth(() => {
      onStartMock({
        domain,
        difficulty: selectedDifficulty,
        format: 'Hybrid',
      });
    }, `${domain} Assessment Track`);
  };

  const handleReportView = (reportId: string) => {
    requireAuth(() => {
      onViewReport(reportId);
    }, 'Assessment Scorecards & Feedback');
  };

  const candidateName = dashboardData?.user?.name || user?.name || 'Engineer';
  const targetRole = dashboardData?.user?.targetRole || user?.targetRole || personaConfig.defaultRole;
  const trackLevel = dashboardData?.user?.trackLevel || user?.trackLevel || personaConfig.defaultLevel;
  const streakDays = dashboardData?.progressCounters?.streakDays ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HERO / PROFILE CONTEXT */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 relative overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{personaConfig.badge}</span>
              </div>

              {streakDays > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{streakDays} Day Streak</span>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {candidateName} 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Targeting <span className="font-semibold text-slate-900">{targetRole}</span> on the{' '}
              <span className="font-semibold text-indigo-600">{trackLevel} Track</span>. Practice coding problems, analyze resume keywords, and run mock technical assessments.
            </p>
          </div>

          {/* Quick Launch Control Bar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {/* Domain */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as InterviewDomain)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium shadow-2xs cursor-pointer"
            >
              <option value="Frontend">Frontend Architecture</option>
              <option value="Backend">Backend & APIs</option>
              <option value="System Design">System Design & Scale</option>
              <option value="Fullstack">Fullstack Core & Algorithms</option>
              <option value="Behavioral">Behavioral & Leadership</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as ExperienceLevel)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium shadow-2xs cursor-pointer"
            >
              <option value="Junior">Junior / Entry Level</option>
              <option value="Mid">Mid Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead Engineer</option>
              <option value="Staff">Staff / Principal</option>
            </select>

            {/* Format */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as InterviewFormat)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium shadow-2xs cursor-pointer"
            >
              <option value="Hybrid">Hybrid (Voice + Code)</option>
              <option value="Voice">Voice Only</option>
              <option value="Code">Live Coding Only</option>
            </select>

            <button
              onClick={handleLaunch}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. YOUR ELEVATE PLAN (Adaptive Career Roadmap) */}
      <ElevatePlanCard
        targetRole={targetRole}
        trackLevel={trackLevel}
        onNavigate={handleTabNavigate}
        onOpenResumeModal={onOpenResumeModal}
      />

      {/* 3. MY JOB SEARCH (Phase 9 Job Tracker Opportunity Intelligence) */}
      <MyJobSearchCard
        onNavigateJobTracker={() => handleTabNavigate('job-tracker')}
        onNavigateJobIntelligence={() => handleTabNavigate('job-intelligence')}
        onTriggerAction={handleTriggerJobAction}
      />

      {/* 4. ELEVATE TODAY (Dynamic Actionable Next Steps) */}
      <ElevateTodayCard
        actions={
          dashboardData?.todayActions || [
            {
              id: 'act_default_1',
              title: `Solve ${targetRole} Practice Problems`,
              subtitle: 'Sharpen your implementation and test case execution in the Coding Arena.',
              category: 'practice',
              actionLabel: 'Enter Coding Arena',
              targetTab: 'arena',
              priority: 'high',
            },
            {
              id: 'act_default_2',
              title: 'Analyze Resume Alignment',
              subtitle: 'Extract verified skills and benchmark against target job descriptions.',
              category: 'resume',
              actionLabel: 'Open Resume Hub',
              targetTab: 'resume',
              priority: 'medium',
            },
            {
              id: 'act_default_3',
              title: 'Simulate a Technical Interview',
              subtitle: 'Practice time-boxed questions with real-time AI scoring and evaluation rubrics.',
              category: 'interview',
              actionLabel: 'Take Assessment',
              targetTab: 'arena',
              priority: 'normal',
            },
          ]
        }
        targetRole={targetRole}
        trackLevel={trackLevel}
        onNavigate={handleTabNavigate}
      />

      {/* 4. TWO-COLUMN SPLIT: YOUR PRACTICE & CAREER PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PracticeSnapshotCard
          totalExecutions={dashboardData?.practice?.totalExecutions ?? 0}
          passedExecutions={dashboardData?.practice?.passedExecutions ?? 0}
          failedExecutions={dashboardData?.practice?.failedExecutions ?? 0}
          passRate={dashboardData?.practice?.passRate ?? 0}
          languagesUsed={dashboardData?.practice?.languagesUsed ?? {}}
          recentExecutions={dashboardData?.practice?.recentCodeExecutions ?? []}
          onOpenArena={() => handleTabNavigate('arena')}
        />

        <CareerProfileCard
          hasResume={dashboardData?.careerProfile?.hasResume ?? false}
          summary={dashboardData?.careerProfile?.summary}
          extractedSkills={dashboardData?.careerProfile?.extractedSkills ?? []}
          skillsCount={dashboardData?.careerProfile?.skillsCount ?? 0}
          atsScore={dashboardData?.careerProfile?.atsScore ?? null}
          targetRoleMatch={dashboardData?.careerProfile?.targetRoleMatch ?? null}
          experienceYears={dashboardData?.careerProfile?.experienceYears ?? null}
          recommendedFocusAreas={dashboardData?.careerProfile?.recommendedFocusAreas ?? []}
          targetRole={targetRole}
          profileCompleteness={user?.profileCompleteness?.percentage}
          completenessTier={user?.profileCompleteness?.tier}
          recentTargetJob={
            user?.recentJobAnalyses && user.recentJobAnalyses.length > 0
              ? {
                  jobTitle: user.recentJobAnalyses[0].jobTitle,
                  company: user.recentJobAnalyses[0].company,
                  gapsCount: user.recentJobAnalyses[0].gaps?.length || 0,
                }
              : undefined
          }
          onOpenResumeHub={() => handleTabNavigate('resume')}
          onOpenUploadModal={onOpenResumeModal}
          onNavigateProfile={() => handleTabNavigate('profile')}
          onNavigateJobIntelligence={() => handleTabNavigate('job-intelligence')}
        />
      </div>

      {/* 4. ASK ELEVATE (Interactive AI Career Assistant) */}
      <AskElevateCard
        targetRole={targetRole}
        trackLevel={trackLevel}
        userType={userPersona}
        onNavigate={handleTabNavigate}
        onNavigateArena={() => handleTabNavigate('arena')}
        onNavigateResume={() => handleTabNavigate('resume')}
        onNavigateJobIntelligence={() => handleTabNavigate('job-intelligence')}
        onNavigateSystemDesign={() => handleTabNavigate('system-design')}
        onNavigateProfile={() => handleTabNavigate('profile')}
      />

      {/* 5. YOUR PROGRESS (Honest Verified Activity Counters) */}
      <ProgressOverviewCard
        counters={
          dashboardData?.progressCounters || {
            codingProblemsSolved: 0,
            codingSubmissionsTotal: 0,
            codingPassRate: 0,
            resumesAnalyzed: 0,
            mockInterviewsCompleted: 0,
            mockInterviewsTotal: 0,
            systemDesignDiagrams: 0,
            streakDays: 0,
          }
        }
      />

      {/* 6. RECENT ACTIVITY TIMELINE */}
      <ActivityTimelineCard
        events={dashboardData?.recentActivity || []}
        onStartCoding={() => handleTabNavigate('arena')}
        onOpenResume={() => handleTabNavigate('resume')}
        onOpenMock={() => handleDomainLaunch('Frontend')}
      />

      {/* 7. VERIFIED ASSESSMENT HISTORY */}
      <RecentInterviewsList
        onViewReport={handleReportView}
        onStartNewMock={handleLaunch}
      />
    </div>
  );
};
