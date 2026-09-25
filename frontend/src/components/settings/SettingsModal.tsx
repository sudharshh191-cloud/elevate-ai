import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Volume2, Bell, Sliders, AlertCircle, Save } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [userPersona, setUserPersona] = useState<string>(user?.userType || 'JOB_SEEKER');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Senior Fullstack Engineer');
  const [preferredDomain, setPreferredDomain] = useState('Fullstack');
  const [preferredDifficulty, setPreferredDifficulty] = useState('Senior');
  const [preferredFormat, setPreferredFormat] = useState('Hybrid');
  const [audioSensitivity, setAudioSensitivity] = useState(80);
  const [enableLiveCoaching, setEnableLiveCoaching] = useState(true);
  const [enableVoiceAvatar, setEnableVoiceAvatar] = useState(true);
  const [enableSoundEffects, setEnableSoundEffects] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyProgressSummary, setWeeklyProgressSummary] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!isOpen) return;

    const fetchSettings = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        const data = await ApiService.getUserSettings();
        if (data && data.settings) {
          const s = data.settings;
          if (s.targetRole) setTargetRole(s.targetRole);
          if (s.preferredDomain) setPreferredDomain(s.preferredDomain);
          if (s.preferredDifficulty) setPreferredDifficulty(s.preferredDifficulty);
          if (s.preferredFormat) setPreferredFormat(s.preferredFormat);
          if (s.audioSensitivity !== undefined) setAudioSensitivity(s.audioSensitivity);
          if (s.enableLiveCoaching !== undefined) setEnableLiveCoaching(s.enableLiveCoaching);
          if (s.enableVoiceAvatar !== undefined) setEnableVoiceAvatar(s.enableVoiceAvatar);
          if (s.enableSoundEffects !== undefined) setEnableSoundEffects(s.enableSoundEffects);
          if (s.theme) setTheme(s.theme);
          if (s.notifications) {
            if (s.notifications.emailAlerts !== undefined) setEmailAlerts(s.notifications.emailAlerts);
            if (s.notifications.weeklyProgressSummary !== undefined) setWeeklyProgressSummary(s.notifications.weeklyProgressSummary);
            if (s.notifications.interviewReminders !== undefined) setInterviewReminders(s.notifications.interviewReminders);
          }
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ApiService.updateProfile({
        userType: userPersona as any,
        targetRole,
        experienceLevel: preferredDifficulty as any,
      });

      await ApiService.updateUserSettings({
        targetRole,
        preferredDomain,
        preferredDifficulty,
        preferredFormat,
        audioSensitivity,
        enableLiveCoaching,
        enableVoiceAvatar,
        enableSoundEffects,
        theme,
        notifications: {
          emailAlerts,
          weeklyProgressSummary,
          interviewReminders,
        },
      });

      setSuccessMsg('Settings and profile saved successfully!');
      if (refreshSession) {
        await refreshSession();
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Account & Assessment Studio Settings</h3>
              <p className="text-xs text-slate-500">Configure persona track, target role, AI coaching, audio sensitivity, and notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Feedback Alerts */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span>Loading saved settings...</span>
            </div>
          ) : (
            <>
              {/* Section 1: Target Role & Career Track */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Persona Track & Assessment Preferences</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Active Persona Track</label>
                    <select
                      value={userPersona}
                      onChange={(e) => setUserPersona(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="STUDENT">🎓 College Student (Campus Placement & DSA Track)</option>
                      <option value="JOB_SEEKER">💼 Job Seeker / Graduate (Full-Stack & Interview Ready)</option>
                      <option value="PROFESSIONAL">👨‍💻 Working Professional (Senior, Staff & Leadership)</option>
                      <option value="CAREER_SWITCHER">🔄 Career Switcher (Tech Fundamentals & Transition)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Role Title</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Staff Frontend Architect"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Preferred Domain Track</label>
                    <select
                      value={preferredDomain}
                      onChange={(e) => setPreferredDomain(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="Fullstack">Fullstack</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="System Design">System Design</option>
                      <option value="DevOps">DevOps & Cloud</option>
                      <option value="Machine Learning">Machine Learning / AI</option>
                      <option value="Behavioral">Behavioral / Leadership</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Difficulty Tier</label>
                    <select
                      value={preferredDifficulty}
                      onChange={(e) => setPreferredDifficulty(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead Engineer</option>
                      <option value="Staff">Staff / Principal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Default Interview Format</label>
                    <select
                      value={preferredFormat}
                      onChange={(e) => setPreferredFormat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="Hybrid">Hybrid (Voice + Code + System Design)</option>
                      <option value="Voice">Voice Architectural Discussion</option>
                      <option value="Code">Live Coding Assessment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Audio & Studio Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice & Studio Sensitivity</span>
                </h4>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Microphone Threshold & Sensitivity</span>
                      <span className="text-[11px] text-slate-500">Controls speech detection sensitivity and filler-word detection</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-700">{audioSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioSensitivity}
                    onChange={(e) => setAudioSensitivity(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <span className="text-xs font-medium text-slate-800">Live AI Coaching</span>
                    <input
                      type="checkbox"
                      checked={enableLiveCoaching}
                      onChange={(e) => setEnableLiveCoaching(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <span className="text-xs font-medium text-slate-800">Voice Avatar</span>
                    <input
                      type="checkbox"
                      checked={enableVoiceAvatar}
                      onChange={(e) => setEnableVoiceAvatar(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <span className="text-xs font-medium text-slate-800">Sound Effects</span>
                    <input
                      type="checkbox"
                      checked={enableSoundEffects}
                      onChange={(e) => setEnableSoundEffects(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Section 3: Notification Preferences */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notification Preferences</span>
                </h4>
                <div className="space-y-2.5">
                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Email Assessment Summaries</span>
                      <span className="text-[11px] text-slate-500">Receive PDF scorecards and synthesis after mock interviews</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Weekly Growth & Progress Digest</span>
                      <span className="text-[11px] text-slate-500">Weekly aggregate skill radar comparisons and gap analysis</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyProgressSummary}
                      onChange={(e) => setWeeklyProgressSummary(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Practice & Review Reminders</span>
                      <span className="text-[11px] text-slate-500">Gentle reminders to stay on track with your study roadmap</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={interviewReminders}
                      onChange={(e) => setInterviewReminders(e.target.checked)}
                      className="accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
