import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  Cpu,
  BarChart3,
  Layers,
  AlertCircle,
  BookOpen,
  Target,
} from 'lucide-react';
import { IRoadmapItem, RoadmapStatus, RoadmapPriority } from '../../types';
import { ApiService } from '../../services/api';

interface ElevatePlanCardProps {
  targetRole?: string;
  trackLevel?: string;
  onNavigate: (tab: 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence', focusTopic?: string) => void;
  onOpenResumeModal: () => void;
}

export const ElevatePlanCard: React.FC<ElevatePlanCardProps> = ({
  targetRole = 'Software Engineer',
  trackLevel = 'Intermediate',
  onNavigate,
  onOpenResumeModal,
}) => {
  const [items, setItems] = useState<IRoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'HIGH' | 'COMPLETED'>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    try {
      setError(null);
      const res = await ApiService.getRoadmap();
      if (res && Array.isArray(res.roadmapItems)) {
        setItems(res.roadmapItems);
      }
    } catch (err: any) {
      console.warn('Could not load roadmap:', err.message);
      setError('Unable to load your adaptive plan at this moment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await ApiService.generateOrRefreshRoadmap();
      if (res && Array.isArray(res.roadmapItems)) {
        setItems(res.roadmapItems);
      }
    } catch (err: any) {
      console.error('Failed to refresh roadmap:', err);
      setError('Failed to refresh plan with latest data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: RoadmapStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item._id === itemId ? { ...item, status: newStatus } : item))
    );

    try {
      await ApiService.updateRoadmapItem(itemId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update roadmap item status:', err);
      // Revert on error
      fetchRoadmap();
    }
  };

  const handleNav = (targetType?: string, focusTopic?: string) => {
    const validTabs: Array<'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence'> = [
      'arena',
      'resume',
      'system-design',
      'analytics',
      'profile',
      'job-intelligence',
    ];
    const tab = validTabs.includes(targetType as any) ? (targetType as any) : 'arena';
    onNavigate(tab, focusTopic);
  };

  const getPriorityBadge = (priority: RoadmapPriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            ENHANCEMENT
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DSA':
      case 'Programming':
        return <Code2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'System Design':
      case 'Cloud':
      case 'DevOps':
        return <Cpu className="w-3.5 h-3.5 text-violet-600" />;
      case 'SQL':
      case 'Backend':
      case 'Full Stack':
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Interview':
      case 'Behavioral':
        return <BarChart3 className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ASSESSMENT':
        return 'Skill Assessment';
      case 'JOB_DESCRIPTION':
        return 'Target Job Gap';
      case 'CODING':
        return 'Coding Arena';
      case 'INTERVIEW':
        return 'Mock Assessment';
      case 'RESUME':
        return 'Resume Analysis';
      case 'SYSTEM_DESIGN':
        return 'Design Studio';
      default:
        return 'Profile Telemetry';
    }
  };

  // Find top priority active focus item
  const todayFocusItem =
    items.find((i) => i.status === 'IN_PROGRESS') ||
    items.find((i) => i.status === 'NOT_STARTED' && i.priority === 'HIGH') ||
    items.find((i) => i.status === 'NOT_STARTED');

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter === 'IN_PROGRESS') return item.status === 'IN_PROGRESS';
    if (filter === 'HIGH') return item.priority === 'HIGH';
    if (filter === 'COMPLETED') return item.status === 'COMPLETED';
    return true;
  });

  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const highPriorityCount = items.filter((i) => i.priority === 'HIGH' && i.status !== 'COMPLETED').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <Compass className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              YOUR ELEVATE PLAN
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              For: {targetRole}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Evidence-based preparation milestones dynamically updated from your verified practice, resume, and assessment performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <div className="text-xs text-slate-600 font-medium hidden md:flex items-center gap-2 mr-2">
              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">
                <Clock className="w-3 h-3" /> {inProgressCount} in progress
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {completedCount} completed
              </span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Recalculate plan from latest coding submissions, interview reports, and resume analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Plan'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your adaptive career roadmap...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State: Clean and honest without fake data */
        <div className="py-10 px-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100/70 border border-indigo-200 flex items-center justify-center">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">
              Your personalized roadmap will appear as you build your career profile.
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ELEVATE.AI creates custom, evidence-based recommendations as soon as you upload your resume, solve coding problems, or run a technical assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2 text-left">
            <button
              onClick={onOpenResumeModal}
              className="p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900">1. Add Resume</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Extract verified skills and identify core role gaps.
              </p>
            </button>

            <button
              onClick={() => onNavigate('arena')}
              className="p-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900">2. Solve a Problem</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Run test cases in the live multi-language Coding Arena.
              </p>
            </button>

            <button
              onClick={() => onNavigate('resume')}
              className="p-3 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:shadow-xs transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900">3. Target a Job</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Paste a target job description to pinpoint missing skills.
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Focus Card */}
          {todayFocusItem && (
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                    Today's Primary Focus
                  </span>
                  {getPriorityBadge(todayFocusItem.priority)}
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    {getCategoryIcon(todayFocusItem.category)}
                    {todayFocusItem.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={todayFocusItem.status}
                    onChange={(e) => handleStatusChange(todayFocusItem._id, e.target.value as RoadmapStatus)}
                    className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NOT_STARTED">Status: Not Started</option>
                    <option value="IN_PROGRESS">Status: In Progress</option>
                    <option value="COMPLETED">Status: Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{todayFocusItem.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{todayFocusItem.reason}</p>
              </div>

              {/* Real Evidence Pills */}
              {todayFocusItem.evidence && todayFocusItem.evidence.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evidence:</span>
                  {todayFocusItem.evidence.map((ev, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              )}

              {/* Adaptation Note */}
              {todayFocusItem.lastUpdatedReason && (
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50/90 border border-indigo-100 px-2.5 py-1 rounded-md">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold">Adaptation Note:</span>
                  <span className="truncate">{todayFocusItem.lastUpdatedReason}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Source: <span className="font-semibold text-slate-700">{getSourceLabel(todayFocusItem.source)}</span>
                </span>

                <button
                  onClick={() =>
                    handleNav(
                      todayFocusItem.actionTarget?.type,
                      todayFocusItem.actionTarget?.focusTopic || todayFocusItem.title
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>{todayFocusItem.actionTarget?.label || 'Start Practice'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('ALL')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilter('IN_PROGRESS')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filter === 'IN_PROGRESS'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setFilter('HIGH')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filter === 'HIGH'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                High Priority ({highPriorityCount})
              </button>
              <button
                onClick={() => setFilter('COMPLETED')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filter === 'COMPLETED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Showing {filteredItems.length} milestone{filteredItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Roadmap Item List */}
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isExpanded = expandedItemId === item._id;
              const isDone = item.status === 'COMPLETED';
              const isInProg = item.status === 'IN_PROGRESS';

              return (
                <div
                  key={item._id}
                  className={`rounded-xl border transition-all ${
                    isDone
                      ? 'bg-slate-50/60 border-slate-200 opacity-80'
                      : isInProg
                      ? 'bg-white border-indigo-200 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => setExpandedItemId(isExpanded ? null : item._id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    {/* Status Checkbox & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          const nextStatus: RoadmapStatus =
                            item.status === 'NOT_STARTED'
                              ? 'IN_PROGRESS'
                              : item.status === 'IN_PROGRESS'
                              ? 'COMPLETED'
                              : 'NOT_STARTED';
                          handleStatusChange(item._id, nextStatus, e);
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                        title="Toggle status (Not Started -> In Progress -> Completed)"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                        ) : isInProg ? (
                          <div className="w-5 h-5 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {getPriorityBadge(item.priority)}
                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                            {getCategoryIcon(item.category)}
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-xl">
                          {item.reason}
                        </p>
                      </div>
                    </div>

                    {/* Right Action & Expand Trigger */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNav(
                            item.actionTarget?.type,
                            item.actionTarget?.focusTopic || item.title
                          );
                        }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>{item.actionTarget?.label || 'Action'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="text-slate-400 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40 rounded-b-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Why ELEVATE Recommends This:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{item.reason}</p>
                      </div>

                      {/* Evidence */}
                      {item.evidence && item.evidence.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Telemetry Evidence:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.evidence.map((ev, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Adaptation Context */}
                      {item.lastUpdatedReason && (
                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-white border border-indigo-100 px-2.5 py-1.5 rounded-lg shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold">Adaptation Note:</span>
                          <span className="truncate">{item.lastUpdatedReason}</span>
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {item.recommendedActions && item.recommendedActions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Recommended Action Steps:
                          </span>
                          <ul className="space-y-1">
                            {item.recommendedActions.map((action, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Footer Controls */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Status:</span>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item._id, e.target.value as RoadmapStatus)}
                            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500"
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>

                        <button
                          onClick={() =>
                            handleNav(
                              item.actionTarget?.type,
                              item.actionTarget?.focusTopic || item.title
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>{item.actionTarget?.label || 'Launch Preparation'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
