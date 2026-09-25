import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  Code2,
  Target,
  FolderGit2,
  AlertCircle,
  Share2,
  ArrowRight,
  Activity,
  Compass,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import {
  IEducationItem,
  IExperienceItem,
  IProjectItem,
  ICertificationItem,
  ExperienceLevel,
} from '../types';

interface ProfilePageProps {
  onOpenResumeModal?: () => void;
  onNavigate?: (page: string) => void;
}

interface SkillDisplayItem {
  name: string;
  category?: string;
  level?: string;
  source: 'profile' | 'resume' | 'assessment';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onOpenResumeModal,
  onNavigate,
}) => {
  const { user, refreshSession, updateUser } = useAuth();

  // Loading and State
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active Modals
  const [editModal, setEditModal] = useState<
    'basic' | 'careerGoal' | 'about' | 'education' | 'experience' | 'project' | 'certification' | 'skill' | null
  >(null);

  // Active Editing Item index state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Forms State
  const [basicForm, setBasicForm] = useState({
    name: '',
    phone: '',
    location: '',
    website: '',
    githubUrl: '',
    linkedinUrl: '',
    bio: '',
  });

  const [careerGoalForm, setCareerGoalForm] = useState({
    targetRole: '',
    trackLevel: '',
    experienceLevel: 'Mid' as ExperienceLevel,
    careerGoalObjective: '',
  });

  const [educationForm, setEducationForm] = useState<IEducationItem>({
    degree: '',
    department: '',
    institution: '',
    graduationYear: new Date().getFullYear(),
    gpa: '',
  });

  const [experienceForm, setExperienceForm] = useState<IExperienceItem>({
    role: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const [projectForm, setProjectForm] = useState<{
    name: string;
    description: string;
    technologies: string;
    githubLink: string;
    projectLink: string;
  }>({
    name: '',
    description: '',
    technologies: '',
    githubLink: '',
    projectLink: '',
  });

  const [certForm, setCertForm] = useState<ICertificationItem>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialUrl: '',
  });

  const [skillForm, setSkillForm] = useState<{ name: string; level: number; category: string }>({
    name: '',
    level: 3,
    category: 'Engineering',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync user state to form initial values
  useEffect(() => {
    if (user) {
      setBasicForm({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        bio: user.bio || '',
      });

      setCareerGoalForm({
        targetRole: user.targetRole || '',
        trackLevel: user.trackLevel || '',
        experienceLevel: (user.experienceLevel as ExperienceLevel) || 'Mid',
        careerGoalObjective: user.careerGoalObjective || '',
      });
    }
  }, [user]);

  // Load live activity/analytics & roadmap for Sections 10 & 11
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, roadmapRes] = await Promise.allSettled([
          ApiService.getDashboardAnalytics(),
          ApiService.getRoadmap(),
        ]);

        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value);
        }
        if (roadmapRes.status === 'fulfilled') {
          setRoadmap(roadmapRes.value);
        }
      } catch (err) {
        console.warn('Could not fetch auxiliary profile analytics:', err);
      }
    };
    fetchData();
  }, []);

  // Save changes handler via ApiService
  const handleSaveProfile = async (updateData: any, successMessage = 'Profile updated successfully') => {
    setLoading(true);
    try {
      const res = await ApiService.updateProfile(updateData);
      if (res?.user) {
        updateUser(res.user);
      } else {
        await refreshSession();
      }
      showToast(successMessage, 'success');
      setEditModal(null);
      setEditingIndex(null);
    } catch (err: any) {
      console.error('Update error:', err);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resume Upload handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const res = await ApiService.uploadResumeFile(file, user?.targetRole);
      if (res?.user) {
        updateUser(res.user);
      } else {
        await refreshSession();
      }
      showToast('Resume uploaded and analyzed successfully!', 'success');
    } catch (err: any) {
      console.error('Resume upload error:', err);
      showToast(err.message || 'Failed to upload resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Profile completeness percentage
  const completenessScore = useMemo(() => {
    if (!user) return 0;
    if (typeof user.profileCompleteness === 'object' && user.profileCompleteness !== null) {
      return (user.profileCompleteness as any).score ?? (user.profileCompleteness as any).percentage ?? 0;
    }
    if (typeof user.profileCompleteness === 'number') {
      return user.profileCompleteness;
    }
    return 0;
  }, [user]);

  const isStudent = user?.userType?.toUpperCase() === 'STUDENT' || (user as any)?.userType === 'student';

  // Section 5: Technical Skills aggregation
  // 1. Profile Stated Skills
  const profileSkills: SkillDisplayItem[] = useMemo(() => {
    const raw = (user as any)?.technicalSkills || user?.skills || [];
    return raw.map((s: any) =>
      typeof s === 'string'
        ? { name: s, level: 'Intermediate', source: 'profile' }
        : {
            name: s.name || s.skill || '',
            level: typeof s.level === 'number' ? `${s.level}/5` : s.level || 'Intermediate',
            category: s.category,
            source: 'profile',
          }
    );
  }, [user]);

  // 2. Resume Extracted Skills
  const resumeSkills: string[] = useMemo(() => {
    return user?.resumeSkills || user?.parsedResumeData?.extractedSkills || [];
  }, [user]);

  // 3. Verified Platform Evidence Skills
  const verifiedEvidence: any[] = useMemo(() => {
    return user?.assessmentEvidence || [];
  }, [user]);

  // Current Roadmap Focus
  const currentFocusItem = roadmap?.roadmapItems?.find((item: any) => item.status === 'IN_PROGRESS') ||
    roadmap?.roadmapItems?.[0] ||
    analytics?.roadmap?.items?.find((i: any) => i.status === 'IN_PROGRESS') ||
    analytics?.roadmap?.items?.[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Your candidate career twin, verified competencies, and active learning focus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('Profile link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Top Banner: Profile Completeness Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full text-[11px] font-semibold tracking-wide uppercase text-indigo-200 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              {isStudent ? 'Student Career Twin' : 'Professional Career Twin'}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {completenessScore === 100
                ? 'Your Career Profile is Complete & Synced'
                : `Profile Completeness: ${completenessScore}%`}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isStudent
                ? 'Your profile is tuned for students and early-career engineers. Adding projects, coursework, and verifying skills in the Arena builds strong recruiter evidence.'
                : 'Your profile synchronizes stated experience with real platform-evaluated skill benchmarks.'}
            </p>
          </div>

          <div className="w-full md:w-64 flex flex-col items-end gap-2">
            <div className="w-full flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Completeness</span>
              <span className="text-indigo-300 text-sm font-bold">{completenessScore}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completenessScore))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              {completenessScore < 100 ? 'Complete missing sections below' : 'All key sections filled'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 12 Distinct Grounded Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (1 col): Basic Info, Career Goal, Current Focus, Profile Sources */}
        <div className="space-y-6">

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Basic Information
                </h2>
              </div>
              <button
                onClick={() => setEditModal('basic')}
                className="p-1 text-slate-400 hover:text-indigo-600 transition"
                title="Edit basic info"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar & Core identity */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-white flex-shrink-0">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-base truncate">
                  {user?.name || 'Anonymous Candidate'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user?.email || 'No email provided'}</span>
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {isStudent ? '🎓 Student / Early Career' : '💼 Professional'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details & Links */}
            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{user?.location || <span className="text-slate-400 italic">No location set</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{user?.phone || <span className="text-slate-400 italic">No phone number</span>}</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {user?.website ? (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate"
                  >
                    {user.website}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No portfolio website</span>
                )}
              </div>
              <div className="flex items-center gap-2 truncate">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {user?.githubUrl ? (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate"
                  >
                    GitHub Profile
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No GitHub link</span>
                )}
              </div>
              <div className="flex items-center gap-2 truncate">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {user?.linkedinUrl ? (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate"
                  >
                    LinkedIn Profile
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No LinkedIn link</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CAREER GOAL */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Career Goal
                </h2>
              </div>
              <button
                onClick={() => setEditModal('careerGoal')}
                className="p-1 text-slate-400 hover:text-violet-600 transition"
                title="Edit career goal"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {user?.targetRole ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Target Role
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {user.targetRole}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Track Level</span>
                    <span className="font-semibold text-slate-700">{user.trackLevel || 'Fullstack Track'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seniority</span>
                    <span className="font-semibold text-slate-700 capitalize">{user.experienceLevel || 'Mid'}</span>
                  </div>
                </div>

                {user.careerGoalObjective && (
                  <div className="text-xs text-slate-600 bg-violet-50/50 p-2.5 rounded-lg border border-violet-100/50">
                    <span className="font-semibold text-violet-900 block mb-0.5 text-[11px]">Objective:</span>
                    {user.careerGoalObjective}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-5 space-y-2">
                <Target className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">Set your target role</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Define your intended software engineering role to tailor assessments and your adaptive roadmap.
                </p>
                <button
                  onClick={() => setEditModal('careerGoal')}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition"
                >
                  Set Target Role
                </button>
              </div>
            )}
          </div>

          {/* SECTION 11: CURRENT FOCUS (Connected to Adaptive Roadmap) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <Compass className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  11. Current Focus
                </h2>
              </div>
              <button
                onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                Roadmap <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {currentFocusItem ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {currentFocusItem.status === 'IN_PROGRESS' ? 'Active Focus' : 'Upcoming Goal'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {currentFocusItem.estimatedDays ? `${currentFocusItem.estimatedDays} days` : 'Adaptive Priority'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {currentFocusItem.title || currentFocusItem.topic || 'Core Engineering Competencies'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentFocusItem.description || 'Targeting verified proficiency through continuous coding exercises and system challenges.'}
                </p>
                <button
                  onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
                  className="w-full mt-2 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  <span>Continue Roadmap Topic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-5 text-slate-400 space-y-1">
                <Compass className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">No active roadmap item</div>
                <p className="text-[11px] text-slate-400">
                  Your career focus will appear as you build your profile and engage with practice arena challenges.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 12: PROFILE SOURCES & INTEGRITY */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                12. Profile Sources & Integrity
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              ELEVATE.AI cleanly separates user-claimed declarations from genuine platform-observed evaluation evidence.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-bold text-slate-900">{profileSkills.length}</div>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Stated Skills</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-base font-bold text-slate-900">{resumeSkills.length}</div>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Resume Skills</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200 bg-emerald-50/40">
                <div className="text-base font-bold text-emerald-700">{verifiedEvidence.length}</div>
                <div className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider">Verified Badges</div>
              </div>
            </div>
          </div>

        </div>

        {/* Middle & Right Column (2 cols): About, Skills, Experience, Projects, Education, Certifications, Resume, Career Evidence */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 3: ABOUT / BIO */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  3. About
                </h2>
              </div>
              <button
                onClick={() => setEditModal('about')}
                className="p-1 text-slate-400 hover:text-blue-600 transition"
                title="Edit bio"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {user?.bio ? (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            ) : (
              <div className="text-center py-4 space-y-1">
                <p className="text-xs text-slate-400 italic">
                  Add a short introduction about yourself.
                </p>
                <button
                  onClick={() => setEditModal('about')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  + Add Bio
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: TECHNICAL SKILLS (TRIPLE SOURCE BADGES) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    5. Technical Skills & Verified Evidence
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Distinguishing stated skills, resume evidence, and verified test outcomes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModal('skill')}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill
              </button>
            </div>

            {/* Sub-tab 1: Verified Platform Assessment Evidence */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Platform Assessment Evidence</span>
                <span className="text-[10px] font-normal text-slate-400">(Earned via Code Arena & Tests)</span>
              </div>
              {verifiedEvidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {verifiedEvidence.map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{ev.skill || ev.topic || 'Engineering Competency'}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-200 text-emerald-900 uppercase">
                            Verified
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Score: <span className="font-bold text-emerald-700">{ev.score ?? ev.scoreAchieved}%</span>
                          {ev.assessmentTitle && ` • ${ev.assessmentTitle}`}
                        </div>
                        {ev.verifiedAt && (
                          <div className="text-[10px] text-slate-400">
                            Verified on {new Date(ev.verifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
                  <span>No verified platform evidence yet. Complete assessments in the Code Arena to earn verified skill badges.</span>
                  <button
                    onClick={() => (onNavigate ? onNavigate('arena') : null)}
                    className="ml-2 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-800 flex-shrink-0"
                  >
                    Open Arena
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tab 2: Profile Stated Skills */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Profile Stated Skills</span>
                <span className="text-[10px] text-slate-400">{profileSkills.length} declared</span>
              </div>
              {profileSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profileSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200 group"
                    >
                      <span>{sk.name}</span>
                      {sk.level && (
                        <span className="text-[10px] text-slate-500 font-normal">({sk.level})</span>
                      )}
                      <button
                        onClick={() => {
                          const updated = profileSkills.filter((_, i) => i !== idx);
                          handleSaveProfile({ skills: updated }, 'Skill removed');
                        }}
                        className="text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No stated technical skills added yet.</p>
              )}
            </div>

            {/* Sub-tab 3: Resume Extracted Skills */}
            {resumeSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Resume Extracted Skills</span>
                  <span className="text-[10px] text-slate-400">{resumeSkills.length} extracted</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {resumeSkills.map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[11px] font-medium border border-blue-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: WORK EXPERIENCE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  6. Work Experience
                </h2>
              </div>
              <button
                onClick={() => {
                  setExperienceForm({
                    role: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: '',
                  });
                  setEditingIndex(null);
                  setEditModal('experience');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Experience
              </button>
            </div>

            {(user?.experience && user.experience.length > 0) ? (
              <div className="space-y-4">
                {user.experience.map((exp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{exp.role}</div>
                        <div className="text-xs font-medium text-indigo-600">{exp.company}</div>
                        <div className="text-[11px] text-slate-400">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Present'}
                          {exp.location ? ` • ${exp.location}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setExperienceForm(exp);
                            setEditingIndex(idx);
                            setEditModal('experience');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const updated = user.experience?.filter((_, i) => i !== idx) || [];
                            handleSaveProfile({ experience: updated }, 'Experience removed');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 space-y-1">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">
                  {isStudent
                    ? 'No work experience added yet. (As a student, adding projects and education is sufficient!)'
                    : 'No work experience added yet.'}
                </p>
              </div>
            )}
          </div>

          {/* SECTION 7: PROJECTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  7. Projects
                </h2>
              </div>
              <button
                onClick={() => {
                  setProjectForm({
                    name: '',
                    description: '',
                    technologies: '',
                    githubLink: '',
                    projectLink: '',
                  });
                  setEditingIndex(null);
                  setEditModal('project');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </button>
            </div>

            {(user?.projects && user.projects.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.projects.map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 relative group hover:border-slate-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-xs text-slate-900">{proj.name}</div>
                      <div className="flex items-center gap-1">
                        {proj.githubLink && (
                          <a
                            href={proj.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-slate-800"
                            title="GitHub"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {proj.projectLink && (
                          <a
                            href={proj.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Live Demo"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setProjectForm({
                              name: proj.name,
                              description: proj.description,
                              technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || ''),
                              githubLink: proj.githubLink || '',
                              projectLink: proj.projectLink || '',
                            });
                            setEditingIndex(idx);
                            setEditModal('project');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const updated = user.projects?.filter((_, i) => i !== idx) || [];
                            handleSaveProfile({ projects: updated }, 'Project removed');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {proj.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>
                    )}
                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(Array.isArray(proj.technologies)
                          ? proj.technologies
                          : (proj.technologies as string).split(',')
                        ).map((t: string, tidx: number) => (
                          <span
                            key={tidx}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 space-y-1">
                <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">No projects added yet.</p>
              </div>
            )}
          </div>

          {/* SECTION 4: EDUCATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-50 rounded-lg text-cyan-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Education
                </h2>
              </div>
              <button
                onClick={() => {
                  setEducationForm({
                    degree: '',
                    department: '',
                    institution: '',
                    graduationYear: new Date().getFullYear(),
                    gpa: '',
                  });
                  setEditingIndex(null);
                  setEditModal('education');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Education
              </button>
            </div>

            {(user?.education && user.education.length > 0) ? (
              <div className="space-y-3">
                {user.education.map((edu, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between relative group">
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {edu.degree} {edu.department ? `in ${edu.department}` : ''}
                      </div>
                      <div className="text-xs text-cyan-800 font-medium">{edu.institution}</div>
                      <div className="text-[11px] text-slate-400">
                        Graduation: {edu.graduationYear || 'N/A'} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEducationForm(edu);
                          setEditingIndex(idx);
                          setEditModal('education');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = user.education?.filter((_, i) => i !== idx) || [];
                          handleSaveProfile({ education: updated }, 'Education removed');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 space-y-1">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">No education information added yet.</p>
              </div>
            )}
          </div>

          {/* SECTION 8: CERTIFICATIONS & ACHIEVEMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                  <Award className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  8. Certifications & Achievements
                </h2>
              </div>
              <button
                onClick={() => {
                  setCertForm({
                    name: '',
                    issuer: '',
                    issueDate: '',
                    expiryDate: '',
                    credentialUrl: '',
                  });
                  setEditingIndex(null);
                  setEditModal('certification');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Certification
              </button>
            </div>

            {(user?.certifications && user.certifications.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 relative group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{cert.name}</div>
                        <div className="text-xs text-rose-700 font-medium">{cert.issuer}</div>
                        <div className="text-[10px] text-slate-400">Issued: {cert.issueDate || 'N/A'}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            const updated = user.certifications?.filter((_, i) => i !== idx) || [];
                            handleSaveProfile({ certifications: updated }, 'Certification removed');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 space-y-1">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400">No certifications or achievements added yet.</p>
              </div>
            )}
          </div>

          {/* SECTION 9: RESUME CONNECTION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  9. Resume Connection
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onOpenResumeModal && (
                  <button
                    onClick={onOpenResumeModal}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Manage Resumes
                  </button>
                )}
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  Upload PDF Resume
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleResumeUpload}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            {(user?.resumeUrl || user?.parsedResumeData) ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {user.parsedResumeData?.summary ? 'Parsed Candidate Resume' : 'Connected Resume Document'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Parsed & Synced to Candidate Twin
                      </div>
                    </div>
                  </div>
                  {user.parsedResumeData?.atsScore !== undefined && (
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {user.parsedResumeData.atsScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">ATS Score</div>
                    </div>
                  )}
                </div>

                {user.parsedResumeData?.extractedSkills && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Extracted Resume Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {user.parsedResumeData.extractedSkills.slice(0, 10).map((sk: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-medium">
                          {sk}
                        </span>
                      ))}
                      {user.parsedResumeData.extractedSkills.length > 10 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">
                          +{user.parsedResumeData.extractedSkills.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-5 space-y-2 border border-dashed border-slate-200 rounded-xl p-4">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">No resume connected</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload your resume to extract skills, populate work experience, and calculate your ATS alignment score.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 10: CAREER EVIDENCE (REAL METRICS ONLY) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    10. Career Evidence & Activity Counters
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Real, verified activity counters queried directly from platform database logs.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.assessment?.total ?? user?.assessmentEvidence?.length ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Assessments Completed
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Avg Score: {analytics?.assessment?.avgScore ? `${analytics.assessment.avgScore}%` : 'N/A'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.practice?.totalSolved ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Coding Problems
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Practice Arena Solved
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.interview?.total ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Mock Interviews
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  AI Technical Interviews
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.systemDesign?.total ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  System Design
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Architecture Sessions
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.roadmap?.completedItems ?? roadmap?.completedItems ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Roadmap Milestones
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Verified Completed
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-2xl font-black text-slate-900">
                  {user?.assessmentEvidence?.length ?? 0}
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Verified Skills
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Evaluation Verified
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ===================== EDIT MODALS ===================== */}

      {/* 1. Basic Info Modal */}
      {editModal === 'basic' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Basic Information</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={basicForm.name}
                  onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={basicForm.phone}
                    onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={basicForm.location}
                    onChange={(e) => setBasicForm({ ...basicForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Portfolio / Personal Website</label>
                <input
                  type="url"
                  value={basicForm.website}
                  onChange={(e) => setBasicForm({ ...basicForm, website: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://yourportfolio.dev"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={basicForm.githubUrl}
                    onChange={(e) => setBasicForm({ ...basicForm, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={basicForm.linkedinUrl}
                    onChange={(e) => setBasicForm({ ...basicForm, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  handleSaveProfile({
                    name: basicForm.name,
                    phone: basicForm.phone,
                    location: basicForm.location,
                    website: basicForm.website,
                    githubUrl: basicForm.githubUrl,
                    linkedinUrl: basicForm.linkedinUrl,
                  });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Career Goal Modal */}
      {editModal === 'careerGoal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Career Goals</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Engineering Role</label>
                <input
                  type="text"
                  value={careerGoalForm.targetRole}
                  onChange={(e) => setCareerGoalForm({ ...careerGoalForm, targetRole: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Senior Fullstack Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Track Focus</label>
                  <select
                    value={careerGoalForm.trackLevel}
                    onChange={(e) => setCareerGoalForm({ ...careerGoalForm, trackLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Frontend">Frontend Track</option>
                    <option value="Backend">Backend Track</option>
                    <option value="Fullstack">Fullstack Track</option>
                    <option value="AI / ML">AI / ML Track</option>
                    <option value="DevOps / Cloud">DevOps / Cloud Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Seniority Level</label>
                  <select
                    value={careerGoalForm.experienceLevel}
                    onChange={(e) => setCareerGoalForm({ ...careerGoalForm, experienceLevel: e.target.value as ExperienceLevel })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Junior">Junior / Entry</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Lead">Lead / Principal</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Career Objective</label>
                <textarea
                  rows={3}
                  value={careerGoalForm.careerGoalObjective}
                  onChange={(e) => setCareerGoalForm({ ...careerGoalForm, careerGoalObjective: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Briefly state your current career target and focus..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  handleSaveProfile({
                    targetRole: careerGoalForm.targetRole,
                    trackLevel: careerGoalForm.trackLevel,
                    experienceLevel: careerGoalForm.experienceLevel,
                    careerGoalObjective: careerGoalForm.careerGoalObjective,
                  });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. About / Bio Modal */}
      {editModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Bio / About</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block text-slate-600 font-semibold">Professional Summary</label>
              <textarea
                rows={5}
                value={basicForm.bio}
                onChange={(e) => setBasicForm({ ...basicForm, bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Write a concise overview of your technical background, passions, and achievements..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  handleSaveProfile({ bio: basicForm.bio });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Education Modal */}
      {editModal === 'education' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIndex !== null ? 'Edit Education' : 'Add Education'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Institution / University</label>
                <input
                  type="text"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Degree</label>
                  <input
                    type="text"
                    value={educationForm.degree}
                    onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. B.S."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department / Field</label>
                  <input
                    type="text"
                    value={educationForm.department || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={educationForm.graduationYear || 2025}
                    onChange={(e) => setEducationForm({ ...educationForm, graduationYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GPA (Optional)</label>
                  <input
                    type="text"
                    value={educationForm.gpa?.toString() || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, gpa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 3.8 / 4.0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  const existing = Array.isArray(user?.education) ? [...user.education] : [];
                  if (editingIndex !== null) {
                    existing[editingIndex] = educationForm;
                  } else {
                    existing.push(educationForm);
                  }
                  handleSaveProfile({ education: existing });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Education'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Experience Modal */}
      {editModal === 'experience' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIndex !== null ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Job Role</label>
                  <input
                    type="text"
                    value={experienceForm.role}
                    onChange={(e) => setExperienceForm({ ...experienceForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Company</label>
                  <input
                    type="text"
                    value={experienceForm.company}
                    onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                  <input
                    type="text"
                    value={experienceForm.startDate || ''}
                    onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Jan 2023"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">End Date</label>
                  <input
                    type="text"
                    disabled={experienceForm.current}
                    value={experienceForm.endDate || ''}
                    onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                    placeholder="Present"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentJob"
                  checked={experienceForm.current || false}
                  onChange={(e) => setExperienceForm({ ...experienceForm, current: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="currentJob" className="text-slate-600 font-medium">I currently work here</label>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description & Impact</label>
                <textarea
                  rows={4}
                  value={experienceForm.description || ''}
                  onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Key responsibilities, achievements, and technologies used..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  const existing = Array.isArray(user?.experience) ? [...user.experience] : [];
                  if (editingIndex !== null) {
                    existing[editingIndex] = experienceForm;
                  } else {
                    existing.push(experienceForm);
                  }
                  handleSaveProfile({ experience: existing });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Experience'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Project Modal */}
      {editModal === 'project' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIndex !== null ? 'Edit Project' : 'Add Project'}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Distributed Task Queue"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="What does this project do and what was your role in building it?"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Technologies (comma separated)</label>
                <input
                  type="text"
                  value={projectForm.technologies}
                  onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="React, TypeScript, Node.js, Redis"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GitHub Repository</label>
                  <input
                    type="url"
                    value={projectForm.githubLink}
                    onChange={(e) => setProjectForm({ ...projectForm, githubLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectForm.projectLink}
                    onChange={(e) => setProjectForm({ ...projectForm, projectLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://myproject.dev"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  const techArray = projectForm.technologies
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const payload: IProjectItem = {
                    name: projectForm.name,
                    description: projectForm.description,
                    technologies: techArray,
                    githubLink: projectForm.githubLink,
                    projectLink: projectForm.projectLink,
                  };
                  const existing = Array.isArray(user?.projects) ? [...user.projects] : [];
                  if (editingIndex !== null) {
                    existing[editingIndex] = payload;
                  } else {
                    existing.push(payload);
                  }
                  handleSaveProfile({ projects: existing });
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Skill Modal */}
      {editModal === 'skill' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Technical Skill</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Skill Name</label>
                <input
                  type="text"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. React, Python, Docker"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Proficiency Level (1-5)</label>
                <select
                  value={skillForm.level}
                  onChange={(e: any) => setSkillForm({ ...skillForm, level: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2 - Elementary</option>
                  <option value={3}>3 - Intermediate</option>
                  <option value={4}>4 - Advanced</option>
                  <option value={5}>5 - Expert</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading || !skillForm.name.trim()}
                onClick={() => {
                  const existing = Array.isArray(user?.skills) ? [...user.skills] : [];
                  existing.push({
                    name: skillForm.name.trim(),
                    level: skillForm.level,
                    category: skillForm.category,
                  });
                  handleSaveProfile({ skills: existing }, 'Skill added');
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Skill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Certification Modal */}
      {editModal === 'certification' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Certification</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Certification Name</label>
                <input
                  type="text"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Issuing Organization</label>
                <input
                  type="text"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Amazon Web Services"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={certForm.issueDate || ''}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Credential Link (optional)</label>
                  <input
                    type="url"
                    value={certForm.credentialUrl || ''}
                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setEditModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={loading || !certForm.name.trim()}
                onClick={() => {
                  const existing = Array.isArray(user?.certifications) ? [...user.certifications] : [];
                  existing.push(certForm);
                  handleSaveProfile({ certifications: existing }, 'Certification added');
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Certification'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
