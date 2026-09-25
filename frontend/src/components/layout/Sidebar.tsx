import React from 'react';
import { 
  LayoutDashboard, 
  Mic2, 
  BarChart3, 
  FileText, 
  Cpu, 
  PlayCircle,
  BrainCircuit,
  Award,
  Settings,
  User,
  Briefcase,
  FolderKanban,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Terminal
} from 'lucide-react';

export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onStartNewMock: () => void;
  mode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onStartNewMock,
  mode = 'expanded',
  onModeChange,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'job-intelligence', label: 'Job Intelligence', icon: Briefcase },
    { id: 'job-tracker', label: 'Job Tracker', icon: FolderKanban },
    { id: 'arena', label: 'Live Mock Arena', icon: Mic2, badge: 'AI Live' },
    { id: 'analytics', label: 'Analytics & Scorecards', icon: BarChart3 },
    { id: 'resume', label: 'Resume & Gap Analysis', icon: FileText },
    { id: 'system-design', label: 'System Design Studio', icon: Cpu },
  ];

  const isCollapsed = mode === 'collapsed';
  const isHidden = mode === 'hidden';

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DESKTOP / TABLET ADAPTIVE SIDEBAR                                 */}
      {/* ===================================================================== */}
      {!isHidden && (
        <aside
          aria-label="Main Navigation Sidebar"
          className={`hidden md:flex flex-col justify-between shrink-0 bg-white border-r border-slate-200 h-full transition-[width,padding] duration-200 ease-in-out z-20 select-none ${
            isCollapsed ? 'w-[72px] min-w-[72px]' : 'w-64 min-w-[256px]'
          }`}
        >
          <div className={`space-y-5 ${isCollapsed ? 'p-2.5' : 'p-4'}`}>
            {/* Header / Mode Controls Bar */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} text-slate-400 px-1`}>
              <div className="flex items-center gap-1">
                {isCollapsed ? (
                  <>
                    <button
                      onClick={() => onModeChange?.('expanded')}
                      title="Expand sidebar"
                      aria-label="Expand sidebar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
                    >
                      <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => onModeChange?.('hidden')}
                      title="Hide sidebar"
                      aria-label="Hide sidebar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onModeChange?.('collapsed')}
                      title="Collapse sidebar"
                      aria-label="Collapse sidebar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none flex items-center gap-1 text-[11px] font-medium"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onModeChange?.('hidden')}
                      title="Hide sidebar completely"
                      aria-label="Hide sidebar completely"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Launch CTA Button */}
            {isCollapsed ? (
              <div className="flex justify-center">
                <button
                  onClick={onStartNewMock}
                  aria-label="Launch AI Mock Assessment"
                  title="Launch AI Mock"
                  className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow flex items-center justify-center cursor-pointer relative group transition-all focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
                >
                  <PlayCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  {/* Floating Tooltip */}
                  <div
                    role="tooltip"
                    className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 z-50"
                  >
                    <span>Launch AI Mock</span>
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={onStartNewMock}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
              >
                <PlayCircle className="w-4 h-4 text-white group-hover:scale-105 transition-transform shrink-0" />
                <span>Launch AI Mock</span>
              </button>
            )}

            {/* Navigation Items List */}
            <nav className="space-y-1" aria-label="Platform navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                if (isCollapsed) {
                  return (
                    <div key={item.id} className="flex justify-center relative">
                      <button
                        onClick={() => onNavigate(item.id)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {/* Active Left Indicator Bar */}
                        {isActive && (
                          <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-600 rounded-r-full"></span>
                        )}
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`} />

                        {/* Floating Tooltip */}
                        <div
                          role="tooltip"
                          className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-2"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                              {item.badge}
                            </span>
                          )}
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                        </div>
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* AI Coaching Status Module */}
            {!isCollapsed ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span>Interview Intelligence</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Evaluates technical knowledge, communication and problem-solving.
                </p>
              </div>
            ) : (
              <div className="flex justify-center pt-2">
                <div
                  title="Interview Intelligence: Evaluates technical knowledge, communication and problem-solving."
                  className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-600 relative group cursor-default"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <div
                    role="tooltip"
                    className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50"
                  >
                    <span>Interview Intelligence</span>
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className={`border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between bg-slate-50/50 ${
            isCollapsed ? 'p-2.5 justify-center' : 'p-4'
          }`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-500">v2.4 Enterprise</span>
                </div>
                <button
                  onClick={() => onNavigate('profile')}
                  title="Settings"
                  aria-label="Settings"
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('profile')}
                title="Settings"
                aria-label="Settings"
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors relative group"
              >
                <Settings className="w-4 h-4" />
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50"
                >
                  <span>Settings</span>
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ===================================================================== */}
      {/* 2. MOBILE NAVIGATION DRAWER & BACKDROP                                */}
      {/* ===================================================================== */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            onClick={onMobileClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          ></div>

          {/* Slide-over Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200"
          >
            <div className="p-4 space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 text-base tracking-tight">
                    ELEVATE<span className="text-indigo-600">.AI</span>
                  </span>
                </div>
                <button
                  onClick={onMobileClose}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Launch CTA Button */}
              <button
                onClick={() => {
                  onStartNewMock();
                  onMobileClose?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-white shrink-0" />
                <span>Launch AI Mock</span>
              </button>

              {/* Mobile Nav Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onMobileClose?.();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile AI Coaching Module */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span>Interview Intelligence</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Evaluates technical knowledge, communication and problem-solving.
                </p>
              </div>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500">v2.4 Enterprise</span>
              </div>
              <button
                onClick={() => {
                  onNavigate('profile');
                  onMobileClose?.();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

