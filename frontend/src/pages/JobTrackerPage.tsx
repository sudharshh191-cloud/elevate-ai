import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Cpu,
  FileText,
  BarChart3,
  Trash2,
  Edit3,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Bookmark,
  Layers,
  Check,
  Building,
  Target,
  FileSearch,
  MessageSquare,
  HelpCircle,
  X,
  TrendingUp
} from 'lucide-react';
import {
  ITrackedJob,
  ApplicationStatus,
  ITrackedJobStats,
  IUserProfile,
  IJobAnalysisGapItem
} from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface JobTrackerPageProps {
  user: IUserProfile | null;
  onNavigate: (page: string) => void;
  onStartTailoredMock?: (focusTopic: string) => void;
}

const STATUS_COLUMNS: Array<{
  id: ApplicationStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}> = [
  {
    id: 'SAVED',
    label: 'Saved',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-400',
    description: 'Target opportunities identified',
  },
  {
    id: 'APPLIED',
    label: 'Applied',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Resume / application submitted',
  },
  {
    id: 'ASSESSMENT',
    label: 'Assessment',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Online coding test / OA scheduled',
  },
  {
    id: 'INTERVIEW',
    label: 'Interview',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-600',
    description: 'Technical or team rounds in progress',
  },
  {
    id: 'OFFER',
    label: 'Offer',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-600',
    description: 'Offer received',
  },
  {
    id: 'REJECTED',
    label: 'Archived / Outcome',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Rejected or withdrawn',
  },
];

export const JobTrackerPage: React.FC<JobTrackerPageProps> = ({
  user,
  onNavigate,
  onStartTailoredMock,
}) => {
  const { requireAuth, isAuthenticated } = useAuth();

  // Data State
  const [jobs, setJobs] = useState<ITrackedJob[]>([]);
  const [stats, setStats] = useState<ITrackedJobStats>({
    total: 0,
    saved: 0,
    applied: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    activeApplications: 0,
    upcomingInterviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | ApplicationStatus | 'ACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modals & Drawers
  const [selectedJob, setSelectedJob] = useState<ITrackedJob | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncingRoadmap, setIsSyncingRoadmap] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Add Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newEmploymentType, setNewEmploymentType] = useState('Full-time');
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('SAVED');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Notes Edit inside Detail Modal
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Load Tracked Jobs
  const loadJobs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await ApiService.getTrackedJobs();
      if (res && Array.isArray(res.jobs)) {
        setJobs(res.jobs);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load tracked jobs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [isAuthenticated]);

  // Handle Note sync when selecting job
  useEffect(() => {
    if (selectedJob) {
      setEditingNotes(selectedJob.notes || '');
      setSyncSuccessMessage(null);
    }
  }, [selectedJob]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        job.jobTitle?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q) ||
        job.targetRole?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (activeTab === 'ALL') return true;
      if (activeTab === 'ACTIVE') {
        return ['APPLIED', 'ASSESSMENT', 'INTERVIEW'].includes(job.status);
      }
      if (activeTab === 'REJECTED') {
        return job.status === 'REJECTED' || job.status === 'WITHDRAWN';
      }
      return job.status === activeTab;
    });
  }, [jobs, searchQuery, activeTab]);

  // Update Status of a Tracked Job
  const handleUpdateStatus = async (jobId: string, status: ApplicationStatus) => {
    // Optimistic Update
    setJobs((prev) =>
      prev.map((j) => (j._id === jobId ? { ...j, status, lastUpdated: new Date().toISOString() } : j))
    );
    if (selectedJob && selectedJob._id === jobId) {
      setSelectedJob((prev) => (prev ? { ...prev, status, lastUpdated: new Date().toISOString() } : null));
    }

    try {
      await ApiService.updateTrackedJob(jobId, { status });
      // Update stats silently
      const statsRes = await ApiService.getTrackedJobStats();
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err: any) {
      console.error('Error updating status:', err);
      loadJobs(true);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!selectedJob) return;
    setIsSavingNotes(true);
    try {
      const res = await ApiService.updateTrackedJob(selectedJob._id, { notes: editingNotes });
      if (res?.job) {
        setSelectedJob(res.job);
        setJobs((prev) => prev.map((j) => (j._id === selectedJob._id ? res.job : j)));
      }
    } catch (err: any) {
      console.error('Failed to save notes:', err);
      alert('Could not save notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Sync Missing Skills to Adaptive Roadmap
  const handleSyncToRoadmap = async (job: ITrackedJob) => {
    setIsSyncingRoadmap(true);
    setSyncSuccessMessage(null);
    try {
      const res = await ApiService.syncJobToRoadmap(job._id);
      setSyncSuccessMessage(res.message || 'Synced skill gaps to your Adaptive Roadmap.');
    } catch (err: any) {
      console.error('Error syncing job to roadmap:', err);
      alert(err.message || 'Failed to sync gaps to roadmap.');
    } finally {
      setIsSyncingRoadmap(false);
    }
  };

  // Delete Tracked Job
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this tracked opportunity?')) return;
    try {
      await ApiService.deleteTrackedJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      if (selectedJob?._id === jobId) setSelectedJob(null);
      const statsRes = await ApiService.getTrackedJobStats();
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      alert('Could not remove tracked job.');
    }
  };

  // Submit New Tracked Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) {
      setFormError('Please enter both a Job Title and Company.');
      return;
    }

    requireAuth(async () => {
      setIsSubmittingNew(true);
      setFormError(null);
      try {
        const res = await ApiService.createTrackedJob({
          jobTitle: newTitle.trim(),
          company: newCompany.trim(),
          location: newLocation.trim() || 'Remote',
          employmentType: newEmploymentType,
          jobUrl: newJobUrl.trim() || undefined,
          salaryRange: newSalary.trim() || undefined,
          status: newStatus,
          notes: newNotes.trim() || undefined,
          source: 'Manual Tracker',
        });

        if (res?.job) {
          setJobs((prev) => [res.job, ...prev]);
          setIsAddModalOpen(false);
          // Reset form
          setNewTitle('');
          setNewCompany('');
          setNewLocation('Remote');
          setNewJobUrl('');
          setNewSalary('');
          setNewNotes('');
          setNewStatus('SAVED');

          const statsRes = await ApiService.getTrackedJobStats();
          if (statsRes?.stats) setStats(statsRes.stats);
        }
      } catch (err: any) {
        console.error('Failed to add job:', err);
        setFormError(err.message || 'Could not save job opportunity.');
      } finally {
        setIsSubmittingNew(false);
      }
    }, 'Track New Job Opportunity');
  };

  // Trigger real platform action
  const handleTriggerAction = (actionType: string, focusTopic?: string) => {
    if (actionType === 'arena') {
      if (onStartTailoredMock && focusTopic) {
        onStartTailoredMock(focusTopic);
      } else {
        onNavigate('arena');
      }
    } else if (actionType === 'system-design') {
      onNavigate('system-design');
    } else if (actionType === 'resume') {
      onNavigate('resume');
    } else if (actionType === 'analytics' || actionType === 'roadmap') {
      onNavigate('analytics');
    } else if (actionType === 'profile') {
      onNavigate('profile');
    } else {
      onNavigate('arena');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =================================================================== */}
      {/* 1. HEADER SECTION                                                  */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Job Tracker
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Opportunity Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track target roles, bridge identified skill gaps, and prepare with verified platform intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadJobs(true);
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh opportunities"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Track Opportunity</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. STATS OVERVIEW BAR                                              */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.activeApplications}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Applied, Assessment, Interview</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">In Interview</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{stats.interview}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active interview stages</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved Gaps</span>
            <Bookmark className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.saved}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Targeting & preparation</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Offers Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.offer}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Successful outcomes</p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. SEARCH & STATUS FILTER TABS                                     */}
      {/* =================================================================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, job title, role, or location..."
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
          {[
            { id: 'ALL', label: `All (${jobs.length})` },
            { id: 'ACTIVE', label: `Active (${stats.activeApplications})` },
            { id: 'SAVED', label: `Saved (${stats.saved})` },
            { id: 'APPLIED', label: `Applied (${stats.applied})` },
            { id: 'ASSESSMENT', label: `Assessment (${stats.assessment})` },
            { id: 'INTERVIEW', label: `Interview (${stats.interview})` },
            { id: 'OFFER', label: `Offer (${stats.offer})` },
            { id: 'REJECTED', label: `Archived (${stats.rejected + stats.withdrawn})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. MAIN CONTENT (KANBAN OR LIST)                                   */}
      {/* =================================================================== */}
      {isLoading ? (
        <div className="min-h-[40vh] bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-mono font-medium text-slate-600">
            Loading your targeted opportunities...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        /* Truthful Empty State: 0 Tracked Opportunities */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            No Tracked Opportunities Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Elevate your search by analyzing target job descriptions in Job Intelligence. Your match evidence, skill gaps, and preparation actions will appear here automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('job-intelligence')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze a Job Description</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Manually Track a Job</span>
            </button>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600 font-medium">
            No opportunities match your active search or filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('ALL');
            }}
            className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {STATUS_COLUMNS.filter((col) => {
            if (activeTab === 'ALL') return true;
            if (activeTab === 'ACTIVE') return ['APPLIED', 'ASSESSMENT', 'INTERVIEW'].includes(col.id);
            if (activeTab === 'REJECTED') return col.id === 'REJECTED';
            return col.id === activeTab;
          }).map((column) => {
            const columnJobs = filteredJobs.filter((j) => {
              if (column.id === 'REJECTED') {
                return j.status === 'REJECTED' || j.status === 'WITHDRAWN';
              }
              return j.status === column.id;
            });

            return (
              <div
                key={column.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {column.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {columnJobs.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnJobs.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4 text-center">
                      <span className="text-xs text-slate-400 font-medium">
                        No jobs in {column.label.toLowerCase()}
                      </span>
                    </div>
                  ) : (
                    columnJobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() => setSelectedJob(job)}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
                      >
                        {/* Company & Status Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block truncate">
                              {job.company}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                              {job.jobTitle}
                            </h4>
                          </div>

                          {job.analysisSnapshot?.matchScore !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                                job.analysisSnapshot.matchScore >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : job.analysisSnapshot.matchScore >= 40
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {job.analysisSnapshot.matchScore}% match
                            </span>
                          )}
                        </div>

                        {/* Location & Meta */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          {job.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {job.location}
                            </span>
                          )}
                          <span className="text-slate-400">•</span>
                          <span className="truncate">{job.employmentType || 'Full-time'}</span>
                        </div>

                        {/* Missing Skill Chips */}
                        {job.analysisSnapshot?.missingSkills && job.analysisSnapshot.missingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.analysisSnapshot.missingSkills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100 truncate max-w-[130px]"
                              >
                                Gap: {skill}
                              </span>
                            ))}
                            {job.analysisSnapshot.missingSkills.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{job.analysisSnapshot.missingSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Real Next Action Button */}
                        {job.nextAction && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerAction(job.nextAction!.actionType, job.nextAction!.focusTopic);
                              }}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="truncate">{job.nextAction.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                            </button>
                          </div>
                        )}

                        {/* Status Quick Changer */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                          <span>Updated {new Date(job.lastUpdated).toLocaleDateString()}</span>
                          <select
                            value={job.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateStatus(job._id, e.target.value as ApplicationStatus)}
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="SAVED">Saved</option>
                            <option value="APPLIED">Applied</option>
                            <option value="ASSESSMENT">Assessment</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="WITHDRAWN">Withdrawn</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                onClick={() => setSelectedJob(job)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {job.company}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.status === 'OFFER'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : job.status === 'INTERVIEW'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : job.status === 'ASSESSMENT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : job.status === 'APPLIED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {job.status}
                    </span>
                    {job.analysisSnapshot?.matchScore !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {job.analysisSnapshot.matchScore}% Match
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                    {job.jobTitle}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job.location}
                      </span>
                    )}
                    <span>•</span>
                    <span>{job.employmentType || 'Full-time'}</span>
                    <span>•</span>
                    <span>Updated {new Date(job.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {job.nextAction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerAction(job.nextAction!.actionType, job.nextAction!.focusTopic);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{job.nextAction.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <select
                    value={job.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateStatus(job._id, e.target.value as ApplicationStatus)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="SAVED">Saved</option>
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. JOB DETAILS MODAL / DRAWER                                      */}
      {/* =================================================================== */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {selectedJob.company}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedJob.status}
                  </span>
                  {selectedJob.analysisSnapshot?.matchScore !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedJob.analysisSnapshot.matchScore}% Match Score
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedJob.jobTitle}
                </h2>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Sync notification banner if available */}
              {syncSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncSuccessMessage}</span>
                </div>
              )}

              {/* 1. Job Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Location</span>
                  <span className="font-semibold text-slate-800">{selectedJob.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Type</span>
                  <span className="font-semibold text-slate-800">{selectedJob.employmentType || 'Full-time'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Date Added</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedJob.dateAdded).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Source</span>
                  <span className="font-semibold text-slate-800">{selectedJob.source || 'Job Intelligence'}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Application Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'] as ApplicationStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedJob._id, st)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                          selectedJob.status === st
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 2. Direct Preparation Actions */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 to-violet-50/70 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Role Preparation Actions
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">Grounded in requirements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      onNavigate('arena');
                    }}
                    className="p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-sm text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>Code Arena</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Practice required algorithmic patterns
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      onNavigate('system-design');
                    }}
                    className="p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-sm text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-violet-600 font-bold text-xs mb-1">
                      <Cpu className="w-4 h-4" />
                      <span>System Design</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Design distributed architecture components
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      onNavigate('resume');
                    }}
                    className="p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:shadow-sm text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-1">
                      <FileText className="w-4 h-4" />
                      <span>Resume Hub</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Align resume keywords with job criteria
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Skill Gaps & Roadmap Synchronization */}
              {selectedJob.analysisSnapshot?.missingSkills && selectedJob.analysisSnapshot.missingSkills.length > 0 && (
                <div className="space-y-3 p-4 rounded-xl border border-rose-200/80 bg-rose-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Identified Skill Gaps ({selectedJob.analysisSnapshot.missingSkills.length})
                    </span>

                    <button
                      onClick={() => handleSyncToRoadmap(selectedJob)}
                      disabled={isSyncingRoadmap}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSyncingRoadmap ? 'animate-spin' : ''}`} />
                      <span>Sync to Roadmap</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.analysisSnapshot.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-rose-700 shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Candidate Personal Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Candidate Notes
                  </label>
                  <span className="text-[11px] text-slate-400">Personal & user-scoped</span>
                </div>

                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add interview dates, recruiter contacts, technical questions asked, or preparation reminders..."
                  rows={4}
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800 placeholder-slate-400"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteJob(selectedJob._id)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Opportunity</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedJob.jobUrl && (
                  <a
                    href={selectedJob.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Posting</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. ADD OPPORTUNITY MODAL                                           */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full my-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Track New Job Opportunity</h3>
                  <p className="text-xs text-slate-500">Add a target position to your preparation pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. San Francisco / Remote"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Type</label>
                  <select
                    value={newEmploymentType}
                    onChange={(e) => setNewEmploymentType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 font-semibold"
                  >
                    <option value="SAVED">Saved</option>
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER">Offer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Job Posting URL (Optional)</label>
                <input
                  type="url"
                  value={newJobUrl}
                  onChange={(e) => setNewJobUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Initial Notes (Optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Any recruiter details, target deadlines, or notes..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
                >
                  {isSubmittingNew ? 'Tracking...' : 'Save Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
