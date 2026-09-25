import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, SidebarMode } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewArenaPage } from './pages/InterviewArenaPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ResumeHubPage } from './pages/ResumeHubPage';
import { SystemDesignStudioPage } from './pages/SystemDesignStudioPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PublicScorecardPage } from './pages/PublicScorecardPage';
import { ProfilePage } from './pages/ProfilePage';
import { JobIntelligencePage } from './pages/JobIntelligencePage';
import { JobTrackerPage } from './pages/JobTrackerPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ResumeUploadModal } from './components/dashboard/ResumeUploadModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { ApiService } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IInterviewSession, InterviewDomain, ExperienceLevel, InterviewFormat } from './types';

function AppContent() {
  const { user, isAuthenticated, logout, openAuthModal, requireAuth } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeSession, setActiveSession] = useState<IInterviewSession | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>();
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    try {
      const saved = localStorage.getItem('elevate_sidebar_state');
      if (saved === 'expanded' || saved === 'collapsed' || saved === 'hidden') {
        return saved;
      }
    } catch {}
    return 'expanded';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSidebarModeChange = (newMode: SidebarMode) => {
    setSidebarMode(newMode);
    try {
      localStorage.setItem('elevate_sidebar_state', newMode);
    } catch {}
  };

  const handleToggleSidebar = () => {
    setSidebarMode((prev) => {
      const nextMode = prev === 'expanded' ? 'collapsed' : 'expanded';
      try {
        localStorage.setItem('elevate_sidebar_state', nextMode);
      } catch {}
      return nextMode;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSidebarOpen((prev) => !prev);
        } else {
          handleToggleSidebar();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear any residual theme settings
  useEffect(() => {
    try {
      localStorage.removeItem('elevate_theme');
      document.documentElement.classList.remove('dark', 'theme-transition');
      document.documentElement.classList.add('light');
      document.documentElement.removeAttribute('data-theme');
    } catch {}
  }, []);

  // Restore in-progress session from localStorage on page refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const savedSessionId = localStorage.getItem('elevate_active_session_id');
    if (savedSessionId && !activeSession) {
      ApiService.getSession(savedSessionId)
        .then((res) => {
          if (res?.session && res.session.status === 'in-progress') {
            setActiveSession(res.session);
            setCurrentPage('arena');
          } else {
            localStorage.removeItem('elevate_active_session_id');
          }
        })
        .catch(() => {
          localStorage.removeItem('elevate_active_session_id');
        });
    }
  }, [isAuthenticated]);

  // Check if URL is reset password route: /reset-password or ?token=
  const isResetPasswordRoute =
    window.location.pathname.includes('/reset-password') ||
    window.location.search.includes('token=');

  if (isResetPasswordRoute) {
    return (
      <ResetPasswordPage
        onNavigateHome={() => {
          window.history.replaceState({}, document.title, '/');
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  // Check if URL contains public share query parameter: ?share=<shareId>
  const searchParams = new URLSearchParams(window.location.search);
  const shareToken = searchParams.get('share');
  if (shareToken) {
    return (
      <PublicScorecardPage
        shareId={shareToken}
        onExplorePlatform={() => {
          window.history.replaceState({}, document.title, '/');
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  // Render Personalized Onboarding Flow if authenticated user has not completed onboarding
  if (isAuthenticated && user && user.onboardingCompleted === false) {
    return (
      <OnboardingFlow
        onComplete={(_updatedUser) => {
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  const handleStartMock = async (params: {
    domain?: InterviewDomain;
    difficulty?: ExperienceLevel;
    format?: InterviewFormat;
    customTopicFocus?: string;
    questionIds?: string[];
    selectedQuestionId?: string;
    durationMinutes?: number;
    title?: string;
  }) => {
    const defaultTitle = params.title || `${params.difficulty || 'Senior'} ${params.domain || 'Frontend'} Mock Assessment`;
    // Require authentication before starting mock interview session
    const proceed = requireAuth(async () => {
      setIsLoadingSession(true);
      try {
        const res = await ApiService.startInterview({
          domain: params.domain || 'Frontend',
          difficulty: params.difficulty || 'Senior',
          format: params.format || 'Hybrid',
          targetRole: user?.targetRole,
          customTopicFocus: params.customTopicFocus,
          questionIds: params.questionIds,
          selectedQuestionId: params.selectedQuestionId,
          durationMinutes: params.durationMinutes,
          title: params.title,
        });

        localStorage.setItem('elevate_active_session_id', res.sessionId);
        setActiveSession(res.session);
        setCurrentPage('arena');
      } catch (err) {
        console.error('Failed to start interview:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }, defaultTitle);

    if (proceed) {
      setIsLoadingSession(true);
      try {
        const res = await ApiService.startInterview({
          domain: params.domain || 'Frontend',
          difficulty: params.difficulty || 'Senior',
          format: params.format || 'Hybrid',
          targetRole: user?.targetRole,
          customTopicFocus: params.customTopicFocus,
          questionIds: params.questionIds,
          selectedQuestionId: params.selectedQuestionId,
          durationMinutes: params.durationMinutes,
          title: params.title,
        });

        localStorage.setItem('elevate_active_session_id', res.sessionId);
        setActiveSession(res.session);
        setCurrentPage('arena');
      } catch (err) {
        console.error('Failed to start interview:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }
  };

  const handleFinishInterview = async () => {
    if (!activeSession) return;
    try {
      localStorage.removeItem('elevate_active_session_id');
      const res = await ApiService.finishInterview(activeSession._id);
      setActiveSession(null);
      setSelectedReportId(res.report.reportId || activeSession._id);
      setCurrentPage('analytics');
    } catch (err) {
      console.error('Failed to complete interview:', err);
      localStorage.removeItem('elevate_active_session_id');
      setActiveSession(null);
      setCurrentPage('dashboard');
    }
  };

  const handleExitArena = () => {
    localStorage.removeItem('elevate_active_session_id');
    setActiveSession(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    if (currentPage === 'arena' && activeSession) {
      if (!window.confirm('You have an active mock interview in progress. Are you sure you want to exit?')) {
        return;
      }
      localStorage.removeItem('elevate_active_session_id');
      setActiveSession(null);
    }
    setCurrentPage(page);
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentPage('analytics');
  };

  const handleOpenResumeModal = () => {
    setIsResumeModalOpen(true);
  };

  return (
    <div className="h-screen bg-[#F8F9FC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Global Executive Navbar */}
      <Navbar
        user={user}
        onOpenResumeModal={handleOpenResumeModal}
        onOpenAuthModal={() => openAuthModal('signin')}
        onOpenRegisterModal={() => openAuthModal('register')}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSignOut={logout}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        sidebarMode={sidebarMode}
        onToggleSidebar={handleToggleSidebar}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Layout (Sidebar + Content View) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative w-full">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onStartNewMock={() =>
            handleStartMock({
              domain: 'Frontend',
              difficulty: 'Senior',
              format: 'Hybrid',
            })
          }
          mode={sidebarMode}
          onModeChange={handleSidebarModeChange}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-[width,margin,padding] duration-200">
          {isLoadingSession ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <p className="text-xs font-mono font-medium text-slate-600">
                Generating your personalized assessment...
              </p>
            </div>
          ) : currentPage === 'arena' ? (
            <InterviewArenaPage
              user={user}
              session={activeSession}
              onStartMock={handleStartMock}
              onFinishInterview={handleFinishInterview}
              onExit={handleExitArena}
            />
          ) : currentPage === 'analytics' ? (
            <AnalyticsPage
              reportId={selectedReportId}
              onBackToDashboard={() => setCurrentPage('dashboard')}
              onStartNewMock={() =>
                handleStartMock({
                  domain: 'Frontend',
                  difficulty: 'Senior',
                  format: 'Hybrid',
                })
              }
            />
          ) : currentPage === 'resume' ? (
            <ResumeHubPage
              user={user}
              onOpenUploadModal={handleOpenResumeModal}
              onStartTailoredMock={(customFocusOverride?: string) => {
                const roleLower = user?.targetRole?.toLowerCase() || '';
                let domain: InterviewDomain = 'Fullstack';
                if (roleLower.includes('frontend')) domain = 'Frontend';
                else if (roleLower.includes('backend')) domain = 'Backend';
                else if (roleLower.includes('system') || roleLower.includes('architect')) domain = 'System Design';

                const difficulty: ExperienceLevel = (user?.experienceLevel as ExperienceLevel) || 'Senior';
                const customTopicFocus = customFocusOverride ||
                  user?.parsedResumeData?.recommendedFocusAreas?.join(', ') ||
                  user?.parsedResumeData?.extractedSkills?.slice(0, 5).join(', ') || undefined;

                handleStartMock({
                  domain,
                  difficulty,
                  format: 'Hybrid',
                  customTopicFocus,
                });
              }}
            />
          ) : currentPage === 'system-design' ? (
            <SystemDesignStudioPage onStartDesignMock={handleStartMock} />
          ) : currentPage === 'profile' ? (
            <ProfilePage
              onOpenResumeModal={handleOpenResumeModal}
              onNavigate={handleNavigate}
            />
          ) : currentPage === 'job-intelligence' ? (
            <JobIntelligencePage
              user={user}
              onNavigate={handleNavigate}
              onOpenResumeModal={handleOpenResumeModal}
              onStartTailoredMock={(focusTopics: string) => {
                const roleLower = user?.targetRole?.toLowerCase() || '';
                let domain: InterviewDomain = 'Fullstack';
                if (roleLower.includes('frontend')) domain = 'Frontend';
                else if (roleLower.includes('backend')) domain = 'Backend';
                else if (roleLower.includes('system') || roleLower.includes('architect')) domain = 'System Design';

                const difficulty: ExperienceLevel = (user?.experienceLevel as ExperienceLevel) || 'Senior';
                handleStartMock({
                  domain,
                  difficulty,
                  format: 'Hybrid',
                  customTopicFocus: focusTopics,
                });
              }}
            />
          ) : currentPage === 'job-tracker' || currentPage === 'jobs' ? (
            <JobTrackerPage
              user={user}
              onNavigate={handleNavigate}
              onStartTailoredMock={(focusTopic: string) => {
                const roleLower = user?.targetRole?.toLowerCase() || '';
                let domain: InterviewDomain = 'Fullstack';
                if (roleLower.includes('frontend')) domain = 'Frontend';
                else if (roleLower.includes('backend')) domain = 'Backend';
                else if (roleLower.includes('system') || roleLower.includes('architect')) domain = 'System Design';

                const difficulty: ExperienceLevel = (user?.experienceLevel as ExperienceLevel) || 'Senior';
                handleStartMock({
                  domain,
                  difficulty,
                  format: 'Hybrid',
                  customTopicFocus: focusTopic,
                });
              }}
            />
          ) : (
            <DashboardPage
              user={user}
              onStartMock={handleStartMock}
              onViewReport={handleViewReport}
              onOpenResumeModal={handleOpenResumeModal}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSuccess={() => {
          // Handled via MongoDB
        }}
      />

      {/* Account & Studio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Centralized Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
