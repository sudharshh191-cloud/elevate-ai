import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  Code2,
  Repeat,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Target,
  BarChart3,
  Check,
  Edit3
} from 'lucide-react';
import { UserPersonaType, IUserProfile } from '../../types';
import { PERSONA_CONFIGS, getPersonaConfig } from '../../config/onboardingConfig';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface OnboardingFlowProps {
  onComplete: (user: IUserProfile) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPersona, setSelectedPersona] = useState<UserPersonaType>(
    (user?.userType as UserPersonaType) || 'STUDENT'
  );
  const [targetRole, setTargetRole] = useState<string>('');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [trackLevel, setTrackLevel] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePersonaConfig = getPersonaConfig(selectedPersona);

  // When persona changes, update default role and track level
  useEffect(() => {
    const config = PERSONA_CONFIGS[selectedPersona];
    if (config) {
      setTargetRole(config.defaultRole);
      setTrackLevel(config.defaultLevel);
      setIsCustomRole(false);
      setCustomRoleInput('');
    }
  }, [selectedPersona]);

  const handleSelectPersona = (persona: UserPersonaType) => {
    setSelectedPersona(persona);
  };

  const handleContinueToRole = () => {
    if (!selectedPersona) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRole = (roleTitle: string) => {
    setTargetRole(roleTitle);
    setIsCustomRole(false);
  };

  const handleContinueToLevel = () => {
    const finalRole = isCustomRole ? customRoleInput.trim() : targetRole;
    if (!finalRole) {
      setErrorMsg('Please select or specify your target role.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const finalRole = isCustomRole ? customRoleInput.trim() : targetRole;
    const finalTrackLevel = trackLevel || activePersonaConfig.defaultLevel;

    try {
      const payload = {
        userType: selectedPersona,
        targetRole: finalRole || activePersonaConfig.defaultRole,
        trackLevel: finalTrackLevel,
      };

      const res = await ApiService.saveOnboarding(payload);
      if (res && res.user) {
        updateUser(res.user);
        onComplete(res.user);
      }
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      setErrorMsg(err.message || 'Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to ELEVATE.AI 👋
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Let's personalize your experience. Complete 3 quick steps to configure your target career path and AI assessment track.
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6 max-w-md mx-auto flex items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 1
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : step > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </span>
              <span className={`text-xs font-semibold ${step === 1 ? 'text-indigo-700' : 'text-slate-600'}`}>
                User Type
              </span>
            </div>

            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 2
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : step > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </span>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-indigo-700' : 'text-slate-600'}`}>
                Target Role
              </span>
            </div>

            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span className={`text-xs font-semibold ${step === 3 ? 'text-indigo-700' : 'text-slate-600'}`}>
                Track Level
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: USER TYPE (What best describes you?) */}
        {/* ==================================================== */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                Step 1 of 3
              </span>
              <h2 className="text-xl font-bold text-slate-900">What best describes you?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your persona to receive tailored target roles, difficulty tiers, and assessment rubrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Card 1: College Student */}
              <button
                type="button"
                onClick={() => handleSelectPersona('STUDENT')}
                className={`text-left p-5 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPersona === 'STUDENT'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                      🎓
                    </div>
                    {selectedPersona === 'STUDENT' && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    College Student
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Preparing for campus placements, internships, coding rounds, and entry-level software roles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-indigo-700 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-100/70">DSA Foundations</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100/70">Campus Placements</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100/70">Fresher ATS Resume</span>
                </div>
              </button>

              {/* Card 2: Job Seeker / Graduate */}
              <button
                type="button"
                onClick={() => handleSelectPersona('JOB_SEEKER')}
                className={`text-left p-5 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPersona === 'JOB_SEEKER'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                      💼
                    </div>
                    {selectedPersona === 'JOB_SEEKER' && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Job Seeker / Graduate
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Actively applying for tech roles and targeting technical, system design, and behavioral interviews.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-100/70">Full-Stack Arena</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100/70">ATS Optimization</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100/70">Real-Time Rubrics</span>
                </div>
              </button>

              {/* Card 3: Working Professional */}
              <button
                type="button"
                onClick={() => handleSelectPersona('PROFESSIONAL')}
                className={`text-left p-5 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPersona === 'PROFESSIONAL'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                      👨‍💻
                    </div>
                    {selectedPersona === 'PROFESSIONAL' && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Working Professional
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Upskilling, preparing for Mid/Senior/Staff promotions, FAANG interviews, and leadership roles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-purple-700 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-purple-100/70">System Design Studio</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100/70">Staff Architecture</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100/70">Leadership</span>
                </div>
              </button>

              {/* Card 4: Career Switcher */}
              <button
                type="button"
                onClick={() => handleSelectPersona('CAREER_SWITCHER')}
                className={`text-left p-5 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  selectedPersona === 'CAREER_SWITCHER'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                      🔄
                    </div>
                    {selectedPersona === 'CAREER_SWITCHER' && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Career Switcher
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    Transitioning into software engineering, data, or cloud from another domain or industry.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-amber-700 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-100/70">CS Fundamentals</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100/70">Step-by-Step Transition</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100/70">Bridge Prep</span>
                </div>
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleContinueToRole}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Target Role</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: TARGET ROLE (What role are you preparing for?) */}
        {/* ==================================================== */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Persona Selection</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Step 2 of 3
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                  <span>{activePersonaConfig.icon}</span>
                  <span>{activePersonaConfig.title}</span>
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900">What role are you preparing for?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your target career role from the options tailored for {activePersonaConfig.title}s.
              </p>
            </div>

            {/* Dynamic Target Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {activePersonaConfig.targetRoles.map((role) => {
                const isSelected = !isCustomRole && targetRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Target className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{role.title}</span>
                      </h4>
                      {role.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {role.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Role Input */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Targeting a specialized or custom role?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => {
                    setCustomRoleInput(e.target.value);
                    if (e.target.value.trim().length > 0) {
                      setIsCustomRole(true);
                    }
                  }}
                  onFocus={() => {
                    if (customRoleInput.trim().length > 0) {
                      setIsCustomRole(true);
                    }
                  }}
                  placeholder="e.g. SRE / Observability Engineer, Blockchain Developer, Rust Systems Engineer..."
                  className={`flex-1 bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white transition-all ${
                    isCustomRole
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 focus:border-indigo-600'
                  }`}
                />
                {customRoleInput.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomRole(true);
                      setTargetRole(customRoleInput.trim());
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCustomRole
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isCustomRole ? 'Selected' : 'Use Custom'}
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleContinueToLevel}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Track Level</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: TRACK LEVEL (What is your current level?) */}
        {/* ==================================================== */}
        {step === 3 && (
          <form onSubmit={handleSubmitOnboarding} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Target Role</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                  Step 3 of 3
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                  <span>{activePersonaConfig.icon}</span>
                  <span>{isCustomRole ? customRoleInput : targetRole}</span>
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900">What is your current level?</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your current technical readiness tier to calibrate mock questions, rubric criteria, and coaching feedback.
              </p>
            </div>

            {/* Dynamic Track Level Options */}
            <div className="space-y-3">
              {activePersonaConfig.trackLevels.map((lvl) => {
                const isSelected = trackLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setTrackLevel(lvl.id)}
                    className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{lvl.label}</h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                              Selected Level
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{lvl.description}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Summary Preview Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Configuration Summary
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">
                    {activePersonaConfig.icon} {activePersonaConfig.title}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-indigo-700">
                    Target Role: {isCustomRole ? customRoleInput : targetRole}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-emerald-700">
                    Level: {trackLevel || activePersonaConfig.defaultLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    <span>Configuring Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
