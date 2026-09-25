import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Search,
  Check,
  PlusCircle,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (parsedData: any) => void;
}

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Python Developer',
  'AI/ML Engineer',
  'Data Scientist',
  'Cloud Engineer',
  'DevOps Engineer',
  'Mobile Developer',
  'Cybersecurity Engineer',
  'Data Engineer',
  'QA Engineer',
  'Product Engineer',
  'Software Architect',
  'Generative AI Engineer',
  'Machine Learning Platform Engineer',
  'Cloud Solutions Architect',
  'React Native Developer',
  'AI Product Engineer',
  'Blockchain Developer',
  'Engineering Manager',
  'Tech Lead',
];

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useAuth();
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize and reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetRole(user?.targetRole || '');
      setSelectedFile(null);
      setFileName(null);
      setTextInput('');
      setResult(null);
      setError(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, user?.targetRole]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit. Please upload a smaller file.');
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setResult(null);
    }
  };

  const handleSelectRole = (role: string) => {
    setTargetRole(role);
    setIsDropdownOpen(false);
  };

  const filteredSuggestions = SUGGESTED_ROLES.filter((role) =>
    role.toLowerCase().includes(targetRole.toLowerCase().trim())
  );

  const isCustomInput =
    targetRole.trim().length > 0 &&
    !SUGGESTED_ROLES.some((r) => r.toLowerCase() === targetRole.toLowerCase().trim());

  const handleParse = async () => {
    if (!selectedFile && !textInput.trim()) {
      setError('Please select a PDF/DOCX resume file or paste your resume highlights.');
      return;
    }

    const effectiveRole = targetRole.trim() || user?.targetRole || 'Software Engineer';

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: { parsedData: any; user: any };
      if (selectedFile) {
        res = await ApiService.uploadResumeFile(selectedFile, effectiveRole);
      } else {
        res = await ApiService.parseResume(textInput.trim(), effectiveRole);
      }

      setResult(res.parsedData);
      if (res.user) {
        updateUser(res.user);
      }
      onSuccess(res.parsedData);
    } catch (err: any) {
      console.error('Resume parse error:', err);
      setError(
        err.message || 'Resume analysis couldn\'t be completed. Please verify your file and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Resume & Skills Parser</h2>
              <p className="text-xs text-slate-500">
                Analyze your resume, extract verified skills, and personalize your preparation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Searchable Target Role Combobox */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Role
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search or enter target role (e.g. Full Stack Developer, Generative AI Engineer)..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs transition-colors font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />

              {targetRole && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetRole('');
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions & Custom Role Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {/* Custom Role Action Option */}
                {isCustomInput && (
                  <div
                    onClick={() => handleSelectRole(targetRole.trim())}
                    className="p-3 hover:bg-indigo-50/70 cursor-pointer flex items-center gap-2 text-indigo-700 bg-indigo-50/30 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="text-xs font-semibold">
                      Use custom role: <span className="font-bold text-slate-900">"{targetRole.trim()}"</span>
                    </div>
                  </div>
                )}

                {/* Suggested Role List */}
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((role) => {
                    const isSelected = role.toLowerCase() === targetRole.toLowerCase().trim();
                    return (
                      <div
                        key={role}
                        onClick={() => handleSelectRole(role)}
                        className={`px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isSelected ? 'bg-indigo-50/60 text-indigo-700 font-bold' : 'text-slate-800 font-medium'
                        }`}
                      >
                        <span>{role}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                    );
                  })
                ) : !isCustomInput ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    Type a custom role name above.
                  </div>
                ) : null}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Select from common engineering roles or type your exact custom specialization.
            </p>
          </div>

          {/* Upload Box */}
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 bg-slate-50/70 hover:bg-indigo-50/20 text-center transition-colors cursor-pointer block">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-indigo-700">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono">{fileName}</span>
                </div>
              ) : (
                'Drop your Resume (PDF, DOCX, TXT) or click to browse'
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Supports standard resume formats up to 10MB</p>
          </label>

          {/* Quick Paste Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Or Paste Resume Highlights / Skills Summary:
            </label>
            <textarea
              rows={3}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                if (e.target.value) {
                  setSelectedFile(null);
                  setFileName(null);
                }
              }}
              placeholder="e.g. 4+ years full-stack engineer. Proficient with React, TypeScript, Node.js, PostgreSQL, Docker, AWS, microservices, REST APIs..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-sans shadow-2xs"
            />
          </div>

          {/* Real Result Preview (Only rendered when real result is received from backend) */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ATS Match Score:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {typeof result.atsScore === 'number' ? `${result.atsScore}%` : 'Analyzed'}
                  </strong>
                </span>
                {typeof result.targetRoleMatch === 'number' && (
                  <span className="text-xs text-indigo-700 font-semibold font-mono">
                    Role Alignment: {result.targetRoleMatch}%
                  </span>
                )}
              </div>

              {result.extractedSkills && result.extractedSkills.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">
                    Extracted Core Skills ({result.extractedSkills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {result.extractedSkills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-mono shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleParse}
            disabled={isLoading || (!selectedFile && !textInput.trim())}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing your resume...</span>
              </>
            ) : (
              <>
                <span>Analyze Resume & Personalize Prep</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
