import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Shield, 
  Terminal, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  UserPlus, 
  Settings, 
  User, 
  Target, 
  Briefcase, 
  PanelLeft, 
  PanelLeftOpen, 
  Menu,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { IUserProfile } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  user: IUserProfile | null;
  onOpenResumeModal: () => void;
  onOpenAuthModal: () => void;
  onOpenRegisterModal?: () => void;
  onOpenSettings?: () => void;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  sidebarMode?: 'expanded' | 'collapsed' | 'hidden';
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenResumeModal,
  onOpenAuthModal,
  onOpenRegisterModal,
  onOpenSettings,
  onSignOut,
  onNavigate,
  currentPage,
  sidebarMode = 'expanded',
  onToggleSidebar,
  onToggleMobileSidebar,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });

  // Synchronize with native browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreenArena = async () => {
    // If not currently on arena page, navigate to arena
    if (currentPage !== 'arena') {
      onNavigate('arena');
    }

    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle request notice:', err);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand / Sidebar Toggle & Mode Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              if (onToggleMobileSidebar) onToggleMobileSidebar();
            } else {
              if (onToggleSidebar) onToggleSidebar();
            }
          }}
          aria-label={
            sidebarMode === 'hidden'
              ? 'Show navigation sidebar'
              : sidebarMode === 'collapsed'
              ? 'Expand navigation sidebar'
              : 'Collapse navigation sidebar'
          }
          title={
            sidebarMode === 'hidden'
              ? 'Show sidebar (Ctrl+B)'
              : sidebarMode === 'collapsed'
              ? 'Expand sidebar (Ctrl+B)'
              : 'Collapse sidebar (Ctrl+B)'
          }
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
        >
          {sidebarMode === 'hidden' ? (
            <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
          ) : sidebarMode === 'collapsed' ? (
            <PanelLeft className="w-4 h-4 text-slate-700" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">
            ELEVATE<span className="text-indigo-600">.AI</span>
          </span>
        </button>
      </div>

      {/* Center Highlights (if authenticated) */}
      {user ? (
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenResumeModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {typeof user.parsedResumeData?.atsScore === 'number'
                ? `Resume (ATS: ${user.parsedResumeData.atsScore}%)`
                : 'Resume (Not analyzed)'}
            </span>
          </button>

          {(user.stats?.streakDays ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{user.stats?.streakDays} Day Streak</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium shadow-2xs">
              <Flame className="w-4 h-4 text-slate-400" />
              <span>Start your streak</span>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span>Guest Preview Mode — Sign in to run live AI assessments</span>
        </div>
      )}

      {/* User Info & Auth Actions */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* Persistent Full Screen Arena Button */}
        <button
          onClick={handleToggleFullscreenArena}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border focus-visible:ring-2 focus-visible:outline-none ${
            isBrowserFullscreen
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400 focus-visible:ring-slate-400'
              : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90 hover:border-indigo-300 focus-visible:ring-indigo-600'
          }`}
          title={
            isBrowserFullscreen
              ? 'Exit Full Screen'
              : 'Full Screen Arena — Enter focused coding workspace'
          }
          aria-label={
            isBrowserFullscreen
              ? 'Exit Full Screen'
              : 'Full Screen Arena'
          }
        >
          {isBrowserFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Exit Full Screen</span>
              <span className="sm:hidden">Exit</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Full Screen Arena</span>
              <span className="sm:hidden">Arena</span>
            </>
          )}
        </button>

        {user ? (
          <>
            {/* Live Notification Dropdown */}
            <NotificationDropdown
              onNavigateToSession={() => onNavigate('analytics')}
              onNavigateToResume={onOpenResumeModal}
            />

            <div className="h-5 w-[1px] bg-slate-200"></div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>{user.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-12 w-64 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Candidate Account
                      </span>
                      <span className="text-[10px] text-indigo-700 font-semibold">
                        {user.experienceLevel} Tier
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-medium">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors text-left cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Career Goals & Role</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onNavigate('job-intelligence');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors text-left cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>Job Intelligence</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onOpenResumeModal();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors text-left cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sync Resume / Skills</span>
                    </button>

                    {onOpenSettings && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 transition-colors text-left cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Account & Studio Settings</span>
                      </button>
                    )}

                    <div className="h-[1px] bg-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In</span>
            </button>
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm items-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
