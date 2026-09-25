import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Mic2, 
  Code2, 
  AlertTriangle, 
  Loader2,
  PlayCircle,
  Sparkles,
  Volume2,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Save,
  Clock,
  Check,
  AlertOctagon,
  RotateCcw,
  LogOut,
  Search,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  Cpu,
  Database,
  Network,
  Boxes,
  Compass,
  Zap,
  Target,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal,
  ArrowRight,
  BookMarked,
  Flame,
  CheckCircle2,
  Terminal,
  HelpCircle,
  FolderCode
} from 'lucide-react';
import { 
  IInterviewSession, 
  IQuestion, 
  IInstantFeedback, 
  ICodeExecutionResult, 
  InterviewDomain, 
  ExperienceLevel, 
  InterviewFormat,
  IUserProfile,
  IQuestionBankItem,
  IQuestionCategoryItem,
  AssessmentPracticeMode
} from '../types';
import { AIAvatarVisualizer, AIAvatarState } from '../components/arena/AIAvatarVisualizer';
import { AudioWaveform } from '../components/arena/AudioWaveform';
import { QuestionCard } from '../components/arena/QuestionCard';
import { VoiceTranscriber } from '../components/arena/VoiceTranscriber';
import { CodeEditorPanel } from '../components/arena/CodeEditorPanel';
import { InstantFeedbackModal } from '../components/arena/InstantFeedbackModal';
import { AudioVisualizerService } from '../services/audioService';
import { SpeechRecognitionService } from '../services/speechRecognition';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Helper: Compute Remaining Time from session state
const calculateSessionRemainingSeconds = (s: IInterviewSession | null | undefined): number => {
  if (!s) return 45 * 60;
  
  const durationMins = s.allocatedDurationMinutes ||
    (s.questions && s.questions.length > 0
      ? s.questions.reduce((sum, q) => sum + (Number(q.expectedDurationMinutes) || 15), 0)
      : 45);

  if (s.expiresAt) {
    const diff = Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }

  if (s.startedAt) {
    const startedMs = new Date(s.startedAt).getTime();
    const elapsed = Math.floor((Date.now() - startedMs) / 1000);
    return Math.max(0, durationMins * 60 - elapsed);
  }

  return durationMins * 60;
};

interface InterviewArenaPageProps {
  user?: IUserProfile | null;
  session?: IInterviewSession | null;
  onStartMock?: (params: {
    domain?: InterviewDomain;
    difficulty?: ExperienceLevel;
    format?: InterviewFormat;
    customTopicFocus?: string;
    questionIds?: string[];
    selectedQuestionId?: string;
    durationMinutes?: number;
    title?: string;
  }) => void;
  onFinishInterview: () => void;
  onExit: () => void;
}

export const InterviewArenaPage: React.FC<InterviewArenaPageProps> = ({
  user: propUser,
  session,
  onStartMock,
  onFinishInterview,
  onExit,
}) => {
  const { user: authUser, requireAuth } = useAuth();
  const effectiveUser = propUser || authUser;

  // Persona & Level Calculations
  const userType = effectiveUser?.userType || 'JOB_SEEKER';
  const trackLevel = effectiveUser?.trackLevel || effectiveUser?.experienceLevel || 'Senior';
  const experienceLevel = (effectiveUser?.experienceLevel as ExperienceLevel) || 'Senior';
  const targetRole = effectiveUser?.targetRole || 'Fullstack Software Engineer';
  const isBeginner = trackLevel.toLowerCase().includes('junior') || trackLevel.toLowerCase().includes('beginner') || experienceLevel === 'Junior';
  const isStudentBeginner = userType === 'STUDENT' && isBeginner;
  const isStudentAdvanced = userType === 'STUDENT' && !isBeginner;
  const isJobSeeker = userType === 'JOB_SEEKER';
  const isProfessional = userType === 'PROFESSIONAL';
  const isCareerSwitcher = userType === 'CAREER_SWITCHER';

  // Arena Lobby Configuration State (used when session is null)
  const [selectedDomain, setSelectedDomain] = useState<InterviewDomain>('Frontend');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExperienceLevel>(
    isBeginner ? 'Junior' : isProfessional ? 'Senior' : 'Mid'
  );
  const [selectedFormat, setSelectedFormat] = useState<InterviewFormat>('Hybrid');
  const [customFocus, setCustomFocus] = useState('');

  // Question Bank & Universal Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSearchDomain, setSelectedSearchDomain] = useState<string>('All');
  const [selectedSearchDifficulty, setSelectedSearchDifficulty] = useState<string>('All');
  const [selectedSearchFormat, setSelectedSearchFormat] = useState<string>('All');
  const [practiceMode, setPracticeMode] = useState<AssessmentPracticeMode>('learn_practice');
  const [subjectTab, setSubjectTab] = useState<'languages' | 'dsa' | 'core_cs'>('dsa');
  const [switcherPhase, setSwitcherPhase] = useState<'foundations' | 'role_prep'>('foundations');

  const [searchResults, setSearchResults] = useState<IQuestionBankItem[]>([]);
  const [recommendedQuestions, setRecommendedQuestions] = useState<IQuestionBankItem[]>([]);
  const [categories, setCategories] = useState<IQuestionCategoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalFound, setTotalFound] = useState(0);

  // Active Session State with LocalStorage Persistence
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    if (session?._id) {
      try {
        const savedIdx = localStorage.getItem(`elevate_current_q_${session._id}`);
        if (savedIdx !== null && !isNaN(Number(savedIdx))) {
          const parsed = Number(savedIdx);
          if (parsed >= 0 && parsed < (session.questions?.length || 1)) {
            return parsed;
          }
        }
      } catch {}
    }
    return session?.currentQuestionIndex || 0;
  });
  const [activeTab, setActiveTab] = useState<'voice' | 'code'>('voice');
  const [transcript, setTranscript] = useState('');
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');
  const [isRecording, setIsRecording] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.15);
  const [frequencies, setFrequencies] = useState<Uint8Array | null>(null);
  const [isSimulatedAudio, setIsSimulatedAudio] = useState(false);
  const [isSpeechUnsupported, setIsSpeechUnsupported] = useState(false);
  const [avatarState, setAvatarState] = useState<AIAvatarState>('idle');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState<ICodeExecutionResult | null>(null);

  // Proctored Environment & Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredFullscreenOnce, setHasEnteredFullscreenOnce] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isAssessmentPaused, setIsAssessmentPaused] = useState(false);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [isAssessmentTerminated, setIsAssessmentTerminated] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draftRestoredNote, setDraftRestoredNote] = useState<string | null>(null);
  const [customTestCases, setCustomTestCases] = useState<Array<{ input: string; expectedOutput: string }>>([]);

  // Server-Aware Dynamic Assessment Countdown (Single Source of Truth)
  const [globalTimeRemaining, setGlobalTimeRemaining] = useState<number>(() =>
    calculateSessionRemainingSeconds(session)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [instantFeedback, setInstantFeedback] = useState<IInstantFeedback | null>(null);

  const audioVisualizerRef = useRef<AudioVisualizerService>(new AudioVisualizerService());
  const speechRecognitionRef = useRef<SpeechRecognitionService>(new SpeechRecognitionService());
  const autosaveTimeoutRef = useRef<any>(null);

  const totalQuestions = session?.questions?.length || 1;
  const currentQuestion: IQuestion =
    session?.questions?.[currentQuestionIndex] ||
    session?.questions?.[0] ||
    ({
      questionText: 'Explain the core system architecture and data flow.',
      domain: session?.domain || selectedDomain,
      category: 'System Architecture',
      difficulty: session?.difficulty || selectedDifficulty,
      format: session?.format || selectedFormat,
      expectedDurationMinutes: 60,
      hints: [],
      rubricCriteria: [],
    } as any);

  // Native Fullscreen API Request Handler
  const requestBrowserFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      }
      setIsFullscreen(true);
      setIsAssessmentPaused(false);
      setShowExitConfirmModal(false);
      setAwaySeconds(0);
      setHasEnteredFullscreenOnce(true);
      setFullscreenError(null);
      return true;
    } catch (err: any) {
      console.warn('Fullscreen request rejected or requires user gesture:', err);
      setFullscreenError('Fullscreen permission is required to launch this assessment. Please allow fullscreen in your browser settings and try again.');
      return false;
    }
  }, []);

  const exitBrowserFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  }, []);

  // Monitor Fullscreen State Changes & Trigger Away Monitoring
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      if (session && !isAssessmentTerminated) {
        if (!inFullscreen) {
          setIsAssessmentPaused(true);
        } else {
          setIsAssessmentPaused(false);
          setShowExitConfirmModal(false);
          setAwaySeconds(0);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [session, isAssessmentTerminated]);

  // Away Timer: Counts continuously when outside fullscreen (60-second limit)
  useEffect(() => {
    if (!session || !isAssessmentPaused || isAssessmentTerminated) return;

    const awayInterval = setInterval(() => {
      setAwaySeconds((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          setIsAssessmentTerminated(true);
          setShowExitConfirmModal(false);
          // Persist server-side termination as FULLSCREEN_TIMEOUT
          ApiService.terminateSession(session._id, 'FULLSCREEN_TIMEOUT').catch((err) => {
            console.warn('Failed to persist timeout termination:', err);
          });
          try {
            localStorage.removeItem('elevate_active_session_id');
          } catch {}
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(awayInterval);
  }, [session, isAssessmentPaused, isAssessmentTerminated]);

  // Handle Voluntary Exit Flow with Confirmation
  const handleCancelExitTest = () => {
    setShowExitConfirmModal(false);
  };

  const handleConfirmExitTest = async () => {
    if (!session || isTerminating) return;
    setIsTerminating(true);

    try {
      // 1. Stop recording & audio visualizer if active
      if (isRecording) {
        speechRecognitionRef.current.stop();
        audioVisualizerRef.current.stop();
        setIsRecording(false);
      }

      // 2. Clear debounced autosave and immediately flush current code draft if present
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      if (code && code.trim().length > 0) {
        try {
          await ApiService.saveCodeDraft({
            sessionId: session._id,
            questionIndex: currentQuestionIndex,
            code,
            language: selectedLanguage,
          });
        } catch {}
      }

      // 3. Persist termination on backend with terminationReason: USER_EXITED
      await ApiService.terminateSession(session._id, 'USER_EXITED');

      // 4. Remove active session ID from localStorage so refresh will not resume it
      try {
        localStorage.removeItem('elevate_active_session_id');
      } catch {}

      // 5. Safely exit fullscreen
      await exitBrowserFullscreen();

      // 6. Reset modals and navigate back to dashboard/history
      setShowExitConfirmModal(false);
      setIsAssessmentPaused(false);
      onExit();
    } catch (err: any) {
      console.error('Error terminating assessment upon voluntary exit:', err);
      // Clean up locally and exit safely
      try {
        localStorage.removeItem('elevate_active_session_id');
      } catch {}
      await exitBrowserFullscreen();
      setShowExitConfirmModal(false);
      setIsAssessmentPaused(false);
      onExit();
    } finally {
      setIsTerminating(false);
    }
  };

  // Synchronize currentQuestionIndex with session / localStorage when session changes
  useEffect(() => {
    if (session?._id) {
      try {
        const savedIdx = localStorage.getItem(`elevate_current_q_${session._id}`);
        if (savedIdx !== null && !isNaN(Number(savedIdx))) {
          const parsed = Number(savedIdx);
          if (parsed >= 0 && parsed < (session.questions?.length || 1)) {
            setCurrentQuestionIndex(parsed);
            return;
          }
        }
      } catch {}
      setCurrentQuestionIndex(session.currentQuestionIndex || 0);
    }
  }, [session?._id]);

  // Sync remaining seconds when session duration or timing updates
  useEffect(() => {
    if (!session) return;
    setGlobalTimeRemaining(calculateSessionRemainingSeconds(session));
  }, [session?._id, session?.startedAt, session?.expiresAt, session?.allocatedDurationMinutes]);

  // Global Assessment Countdown Timer (Single Source of Truth, never resets on question or language change)
  useEffect(() => {
    if (!session || !hasEnteredFullscreenOnce || isAssessmentPaused || isAssessmentTerminated) return;

    // Immediately calculate from session timestamps
    setGlobalTimeRemaining(calculateSessionRemainingSeconds(session));

    const timerInterval = setInterval(() => {
      const remaining = calculateSessionRemainingSeconds(session);
      setGlobalTimeRemaining(remaining);
      if (remaining <= 0) {
        setIsAssessmentTerminated(true);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [
    session?._id,
    session?.startedAt,
    session?.expiresAt,
    session?.allocatedDurationMinutes,
    hasEnteredFullscreenOnce,
    isAssessmentPaused,
    isAssessmentTerminated,
  ]);

  // Accidental Navigation & BeforeUnload Protection
  useEffect(() => {
    if (!session || isAssessmentTerminated) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active assessment in progress. Leaving will close your test.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isAssessmentTerminated]);

  // Autosave code changes debounced (localStorage + Backend Draft API)
  const saveDraft = useCallback((currentCode: string, lang: string) => {
    if (!session || !currentCode) return;

    // Save to LocalStorage
    try {
      const storageKey = `elevate_draft_${session._id}_${currentQuestionIndex}`;
      localStorage.setItem(storageKey, JSON.stringify({
        code: currentCode,
        language: lang,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    }

    // Debounced Backend API Draft Save
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    setAutosaveStatus('saving');
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await ApiService.saveCodeDraft({
          sessionId: session._id,
          questionIndex: currentQuestionIndex,
          code: currentCode,
          language: lang,
        });
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 3000);
      } catch (err) {
        console.warn('Backend draft autosave note:', err);
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 3000);
      }
    }, 1500);
  }, [session, currentQuestionIndex]);

  // Autosave spoken/written transcript draft locally
  const saveTranscriptDraft = useCallback((text: string) => {
    if (!session) return;
    try {
      const storageKey = `elevate_transcript_${session._id}_${currentQuestionIndex}`;
      localStorage.setItem(storageKey, text);
    } catch (e) {
      console.warn('Failed to save transcript draft to localStorage:', e);
    }
  }, [session, currentQuestionIndex]);

  // Seamless Question Navigation (Persists Draft and Synchronizes Server & Local State)
  const handleNavigateQuestion = useCallback((nextIdx: number) => {
    if (!session || nextIdx < 0 || nextIdx >= totalQuestions || nextIdx === currentQuestionIndex) return;

    // Flush current code draft before navigating away
    if (code && code.trim().length > 0) {
      try {
        const storageKey = `elevate_draft_${session._id}_${currentQuestionIndex}`;
        localStorage.setItem(storageKey, JSON.stringify({
          code,
          language: selectedLanguage,
          timestamp: Date.now()
        }));
        ApiService.saveCodeDraft({
          sessionId: session._id,
          questionIndex: currentQuestionIndex,
          code,
          language: selectedLanguage,
        }).catch(() => {});
      } catch {}
    }

    // Flush current transcript draft before navigating away
    if (transcript && transcript.trim().length > 0) {
      try {
        const transcriptKey = `elevate_transcript_${session._id}_${currentQuestionIndex}`;
        localStorage.setItem(transcriptKey, transcript);
      } catch {}
    }

    try {
      localStorage.setItem(`elevate_current_q_${session._id}`, String(nextIdx));
    } catch {}

    setCurrentQuestionIndex(nextIdx);
    ApiService.navigateQuestion(session._id, nextIdx).catch(() => {});
  }, [session, totalQuestions, currentQuestionIndex, code, selectedLanguage, transcript]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    saveDraft(newCode, selectedLanguage);
  };

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    saveDraft(code, newLang);
  };

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
    saveTranscriptDraft(newTranscript);
  };

  // Initialize Question Starter Code, Restore Draft & Reset Question State on index change
  useEffect(() => {
    if (!session) return;
    const q = session.questions?.[currentQuestionIndex];
    if (q) {
      // Intelligently select active tab based on question format
      if (q.format === 'Code') {
        setActiveTab('code');
      } else if (q.format === 'Voice') {
        setActiveTab('voice');
      } else {
        if (q.codeTemplate?.starterCode) {
          setActiveTab('code');
        } else {
          setActiveTab('voice');
        }
      }

      // 1. Check for local code draft recovery
      const storageKey = `elevate_draft_${session._id}_${currentQuestionIndex}`;
      let restoredCode = false;
      try {
        const localDraft = localStorage.getItem(storageKey);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed && parsed.code) {
            setCode(parsed.code);
            if (parsed.language) setSelectedLanguage(parsed.language);
            setDraftRestoredNote('Restored in-progress draft from cache');
            setTimeout(() => setDraftRestoredNote(null), 4000);
            restoredCode = true;
          }
        }
      } catch (e) {
        // ignore JSON parse error
      }

      if (!restoredCode) {
        if (q.codeTemplate?.starterCode) {
          setCode(q.codeTemplate.starterCode);
          setSelectedLanguage(q.codeTemplate.language || 'typescript');
        } else {
          setCode(
            `// Solution for: ${q.questionText.slice(0, 60)}...\nfunction solution(input: any): any {\n  // Implement optimal solution\n}\n`
          );
        }
      }

      // 2. Check for local transcript draft recovery
      const transcriptStorageKey = `elevate_transcript_${session._id}_${currentQuestionIndex}`;
      try {
        const savedTranscript = localStorage.getItem(transcriptStorageKey);
        if (savedTranscript) {
          setTranscript(savedTranscript);
        } else {
          setTranscript('');
        }
      } catch {
        setTranscript('');
      }

      if (q.codeTemplate?.testCases) {
        setCustomTestCases(q.codeTemplate.testCases.map(tc => ({
          input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input),
          expectedOutput: typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : String(tc.expectedOutput),
        })));
      }
    } else {
      setTranscript('');
    }

    setExecutionResult(null);
    setErrorMessage(null);
    setAvatarState('speaking');

    const timer = setTimeout(() => {
      setAvatarState('listening');
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, session]);

  const toggleRecording = async () => {
    if (isRecording) {
      speechRecognitionRef.current.stop();
      audioVisualizerRef.current.stop();
      setIsRecording(false);
      setAvatarState('idle');
      setFrequencies(null);
      setAudioVolume(0.05);
    } else {
      setIsSpeechUnsupported(false);
      setAvatarState('listening');

      if (!speechRecognitionRef.current.isBrowserSupported()) {
        setIsSpeechUnsupported(true);
      }

      speechRecognitionRef.current.start(
        (recognizedChunk) => {
          setTranscript((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            const nextVal = `${prev}${separator}${recognizedChunk}`;
            saveTranscriptDraft(nextVal);
            return nextVal;
          });
        },
        (status) => {
          if (status === 'error' || status === 'unsupported') {
            setIsSpeechUnsupported(true);
          }
        }
      );

      await audioVisualizerRef.current.start(
        (freqData, vol) => {
          setFrequencies(freqData);
          setAudioVolume(vol);
        },
        (isSim) => {
          setIsSimulatedAudio(isSim);
        }
      );

      setIsRecording(true);
    }
  };

  const handleRunCode = async () => {
    if (!session || !code || isRunningCode) return;
    setIsRunningCode(true);
    setExecutionResult(null);

    try {
      const res = await ApiService.executeCode({
        sessionId: session._id,
        questionIndex: currentQuestionIndex,
        language: selectedLanguage,
        code,
        testCases: customTestCases.length > 0 ? customTestCases : currentQuestion.codeTemplate?.testCases,
      });
      setExecutionResult(res?.result || res);
    } catch (err: any) {
      setExecutionResult({
        status: 'EXECUTION_ERROR',
        passed: false,
        totalTests: customTestCases.length || currentQuestion.codeTemplate?.testCases?.length || 1,
        passedTests: 0,
        failedTests: customTestCases.length || currentQuestion.codeTemplate?.testCases?.length || 1,
        executionTimeMs: 0,
        memoryUsageKb: null,
        tests: [],
        errorOutput: err.message || 'Failed to execute code in sandbox environment.',
        sandboxMode: 'isolated-subprocess',
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Direct Code Submission
  const handleSubmitCode = async () => {
    if (!session || isSubmitting) return;
    if (!code || code.trim().length === 0) {
      setErrorMessage('Please enter code in the editor before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setAvatarState('thinking');

    try {
      const res = await ApiService.submitCode({
        sessionId: session._id,
        questionIndex: currentQuestionIndex,
        language: selectedLanguage,
        code,
        customTestCases: customTestCases.length > 0 ? customTestCases : undefined,
      });

      if (res.evaluation) {
        setInstantFeedback({
          score: res.evaluation.score,
          technicalAccuracy: res.evaluation.technicalAccuracyScore,
          communication: res.evaluation.communicationScore || res.evaluation.codeQualityScore,
          strengths: res.evaluation.strengths,
          improvements: res.evaluation.improvements,
          coachNote: res.evaluation.coachNote,
        });
      } else {
        handleProceedAfterFeedback();
      }
    } catch (err: any) {
      console.error('Failed to submit code solution:', err);
      setErrorMessage(err.message || 'Failed to evaluate code solution. Please retry.');
      setAvatarState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!session || isSubmitting) return;

    if (activeTab === 'code') {
      return handleSubmitCode();
    }

    if (isRecording) {
      toggleRecording();
    }

    const effectiveResponse = transcript;
    if (!effectiveResponse || effectiveResponse.trim().length === 0) {
      setErrorMessage('Please speak or type your answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setAvatarState('thinking');

    try {
      const res = await ApiService.submitResponse({
        sessionId: session._id,
        questionIndex: currentQuestionIndex,
        responseType: 'text',
        textResponse: transcript,
        timeSpentSeconds: 60,
      });

      if (res.evaluation) {
        setInstantFeedback({
          score: res.evaluation.score,
          technicalAccuracy: res.evaluation.technicalAccuracyScore,
          communication: res.evaluation.communicationScore,
          strengths: res.evaluation.strengths,
          improvements: res.evaluation.improvements,
          coachNote: res.evaluation.coachNote,
        });
      } else {
        handleProceedAfterFeedback();
      }
    } catch (err: any) {
      console.error('Failed to evaluate response:', err);
      setErrorMessage(err.message || 'Failed to evaluate response. Please retry.');
      setAvatarState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedAfterFeedback = () => {
    setInstantFeedback(null);
    if (currentQuestionIndex + 1 < totalQuestions) {
      handleNavigateQuestion(currentQuestionIndex + 1);
    } else {
      if (isRecording) {
        toggleRecording();
      }
      onFinishInterview();
    }
  };

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Initial Categories and Personalized Recommendations
  useEffect(() => {
    if (session) return;
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [catsRes, recRes] = await Promise.all([
          ApiService.getQuestionCategories().catch(() => ({ categories: [] })),
          ApiService.getRecommendedQuestions(8).catch(() => ({ recommended: [] })),
        ]);
        if (isMounted) {
          if (catsRes.categories) setCategories(catsRes.categories);
          if (recRes.recommended) setRecommendedQuestions(recRes.recommended);
        }
      } catch (err) {
        console.warn('Initial question bank data note:', err);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [session, userType, trackLevel, targetRole]);

  // Execute Question Bank Live Search whenever query or filters change
  useEffect(() => {
    if (session) return;
    let isMounted = true;
    setIsSearching(true);

    const executeSearch = async () => {
      try {
        const res = await ApiService.searchQuestions({
          q: debouncedQuery || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          domain: selectedSearchDomain !== 'All' ? selectedSearchDomain : undefined,
          difficulty: selectedSearchDifficulty !== 'All' ? selectedSearchDifficulty : undefined,
          format: selectedSearchFormat !== 'All' ? selectedSearchFormat : undefined,
          limit: 12,
        });
        if (isMounted) {
          setSearchResults(res.questions || []);
          setTotalFound(res.total || 0);
        }
      } catch (err) {
        console.warn('Question search error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    executeSearch();
    return () => { isMounted = false; };
  }, [session, debouncedQuery, selectedCategory, selectedSearchDomain, selectedSearchDifficulty, selectedSearchFormat]);

  // Direct Launch for a specific Question from Question Bank
  const handleLaunchQuestion = (q: IQuestionBankItem) => {
    if (onStartMock) {
      requireAuth(async () => {
        await requestBrowserFullscreen();
        onStartMock({
          domain: q.domain,
          difficulty: q.difficulty,
          format: q.format,
          questionIds: [q._id],
          selectedQuestionId: q._id,
          title: q.problemNumber ? `#${q.problemNumber} ${q.title}` : q.title,
          durationMinutes: q.expectedDurationMinutes || 15,
        });
      }, `${q.title} Practice Round`);
    }
  };

  // Direct Launch for a specific fundamental topic / category
  const handleLaunchTopic = (topicName: string, domainOverride?: InterviewDomain, diffOverride?: ExperienceLevel) => {
    if (onStartMock) {
      const mappedDomain: InterviewDomain = domainOverride || selectedDomain;
      const mappedDiff: ExperienceLevel = diffOverride || selectedDifficulty;
      requireAuth(async () => {
        await requestBrowserFullscreen();
        onStartMock({
          domain: mappedDomain,
          difficulty: mappedDiff,
          format: selectedFormat,
          customTopicFocus: topicName,
          title: `${topicName} Topic Assessment`,
          durationMinutes: 30,
        });
      }, `${topicName} Assessment`);
    }
  };

  // Launch Assessment from Custom Configurator: Requests Fullscreen on user gesture immediately
  const handleLobbyLaunch = async () => {
    if (onStartMock) {
      requireAuth(async () => {
        await requestBrowserFullscreen();
        onStartMock({
          domain: selectedDomain,
          difficulty: selectedDifficulty,
          format: selectedFormat,
          customTopicFocus: customFocus.trim() || undefined,
          durationMinutes: selectedFormat === 'Code' ? 45 : 60,
        });
      }, `${selectedDifficulty} ${selectedDomain} Mock Assessment`);
    }
  };

  const formatGlobalTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const formatAwayTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER 1: ADAPTIVE ARENA LOBBIES
  // (Tailored by UserType, Level, and Target Role)
  // ==========================================
  if (!session) {
    return (
      <div className="space-y-8 pb-16 animate-in fade-in duration-200 max-w-6xl mx-auto">
        
        {/* ========================================================= */}
        {/* 1. PERSONA-SPECIFIC HERO BANNER & INTRO                   */}
        {/* ========================================================= */}
        {isStudentBeginner ? (
          /* PERSONA 1: STUDENT + BEGINNER (Educational Framing) */
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-400/20 border border-indigo-300/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Student Learning Track • Fundamentals & Practice</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  What do you want to learn today?
                </h1>
                <p className="text-xs sm:text-sm text-indigo-100/85 leading-relaxed">
                  Master core programming concepts, data structures, and computer science foundations with guided code sandboxes, step-by-step test execution, and instant feedback.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleLaunchTopic('Programming Fundamentals', 'Fullstack', 'Junior')}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <PlayCircle className="w-5 h-5 text-indigo-600" />
                  <span>Start Daily Practice</span>
                </button>
              </div>
            </div>

            {/* Practice Modes Selector for Students */}
            <div className="mt-6 pt-6 border-t border-indigo-700/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPracticeMode('learn_practice')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  practiceMode === 'learn_practice'
                    ? 'bg-white/15 border-indigo-300/40 text-white shadow-inner'
                    : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200 hover:bg-indigo-950/50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-300" />
                  <span>1. Learn & Practice</span>
                </div>
                <p className="text-[11px] text-indigo-200/80">Guided code problem with hints and immediate feedback.</p>
              </button>

              <button
                onClick={() => setPracticeMode('topic_assessment')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  practiceMode === 'topic_assessment'
                    ? 'bg-white/15 border-indigo-300/40 text-white shadow-inner'
                    : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200 hover:bg-indigo-950/50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Boxes className="w-4 h-4 text-emerald-300" />
                  <span>2. Topic Assessment</span>
                </div>
                <p className="text-[11px] text-indigo-200/80">Focused questions on Arrays, Trees, or Core CS concepts.</p>
              </button>

              <button
                onClick={() => setPracticeMode('mock_assessment')}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  practiceMode === 'mock_assessment'
                    ? 'bg-white/15 border-indigo-300/40 text-white shadow-inner'
                    : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200 hover:bg-indigo-950/50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>3. Timed Simulation</span>
                </div>
                <p className="text-[11px] text-indigo-200/80">Full proctored simulation to build confidence and speed.</p>
              </button>
            </div>
          </div>
        ) : isStudentAdvanced ? (
          /* PERSONA 2: STUDENT + INTERMEDIATE/ADVANCED (Placement & Competitive Prep) */
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student Placement Track • {targetRole} Readiness</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Placement & Technical Interview Mastery
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sharpen your algorithmic problem solving, core computer science concepts, and coding speed for campus interviews and engineering internships.
                </p>
              </div>

              <button
                onClick={handleLobbyLaunch}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Launch Placement Mock</span>
              </button>
            </div>
          </div>
        ) : isProfessional ? (
          /* PERSONA 4: WORKING PROFESSIONAL (Senior/Lead/Staff Executive Calibration) */
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Executive & Seniority Track • {trackLevel} Level</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Executive & Technical Assessment Arena
                </h1>
                <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">
                  Benchmark your architecture, concurrency, system design, and technical leadership against Principal, Lead, and Staff engineer industry standards.
                </p>
              </div>

              <button
                onClick={handleLobbyLaunch}
                className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shrink-0"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Start {trackLevel} Assessment</span>
              </button>
            </div>
          </div>
        ) : isCareerSwitcher ? (
          /* PERSONA 5: CAREER SWITCHER (Progressive Foundations to Target Role) */
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-sm">
                  <Compass className="w-3.5 h-3.5 text-teal-400" />
                  <span>Career Switch Accelerator • Transitioning to {targetRole}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Career Switch Accelerator Arena
                </h1>
                <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
                  Progressively bridge the gap between your previous background and your new target role with foundational practice followed by role-specific technical drills.
                </p>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-teal-500/30 shrink-0">
                <button
                  onClick={() => setSwitcherPhase('foundations')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    switcherPhase === 'foundations'
                      ? 'bg-teal-500 text-slate-950 shadow'
                      : 'text-teal-200 hover:text-white'
                  }`}
                >
                  1. Foundations
                </button>
                <button
                  onClick={() => setSwitcherPhase('role_prep')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    switcherPhase === 'role_prep'
                      ? 'bg-teal-500 text-slate-950 shadow'
                      : 'text-teal-200 hover:text-white'
                  }`}
                >
                  2. Target Role
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PERSONA 3: JOB SEEKER / GRADUATE (Default Benchmark Arena) */
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Technical Assessment Arena • Proctored Fullscreen Assessment</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Live Technical Mock Arena
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Experience a 60-minute proctored technical evaluation with real-time audio telemetry, 
                  sandboxed code execution, and rubric evaluation calibrated to industry benchmarks.
                </p>
              </div>

              <button
                onClick={handleLobbyLaunch}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow shrink-0"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Start 60-Minute Assessment</span>
              </button>
            </div>
          </div>
        )}

        {/* Telemetry Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Voice Telemetry</span>
              <span className="text-[11px] text-slate-500">Real-time FFT audio visualizer & speech pace monitor</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Isolated Code Sandbox</span>
              <span className="text-[11px] text-slate-500">Multi-language execution runner with test assertions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Proctored Environment</span>
              <span className="text-[11px] text-slate-500">Fullscreen enforcement and away timer monitor</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. UNIVERSAL QUESTION BANK SEARCH (FOR ALL USERS)        */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Universal Question Bank Search
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Search topics, skills, categories, LeetCode problem numbers (e.g. #217, #1), or keywords across the entire platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {totalFound} Questions Available
              </span>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, number (#217, Two Sum), topic (Arrays, SQL, React), or skill..."
              className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="space-y-3">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Category:
              </span>
              {['All', 'Arrays & Hashing', 'Strings', 'Stacks & Queues', 'Binary Search', 'Linked Lists', 'Operating Systems', 'DBMS & SQL', 'Computer Networks', 'Object-Oriented Programming', 'React & UI Architecture', 'Distributed Systems & Caching', 'System Design & High Scale', 'DevOps & Cloud', 'Behavioral & Leadership'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Difficulty & Format Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Difficulty:</span>
                {['All', 'Junior', 'Mid', 'Senior', 'Staff'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedSearchDifficulty(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedSearchDifficulty === d
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {d === 'Junior' ? 'Junior / Beginner' : d}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format:</span>
                {['All', 'Code', 'Voice', 'Hybrid'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedSearchFormat(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedSearchFormat === f
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Results Grid */}
          <div className="space-y-3 pt-2">
            {isSearching ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Searching question database...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((q) => (
                  <div
                    key={q._id}
                    className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {q.problemNumber && (
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                              #{q.problemNumber}
                            </span>
                          )}
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                            {q.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.difficulty === 'Junior'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'Mid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {q.format}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {q.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {q.questionText}
                      </p>

                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {q.tags.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-200/60 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {q.expectedDurationMinutes || 15} mins
                      </span>

                      <button
                        onClick={() => handleLaunchQuestion(q)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:shadow"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Practice Problem</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No questions found matching your filter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query, or clear the category filters to browse all available questions.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedSearchDifficulty('All');
                    setSelectedSearchFormat('All');
                  }}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PERSONA-TAILORED SECONDARY SECTIONS                   */}
        {/* ========================================================= */}

        {/* STUDENT FUNDAMENTALS DRILLS (Student Beginner View) */}
        {isStudentBeginner && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Core Fundamentals Curriculum
                </h2>
                <p className="text-xs text-slate-500">Pick a subject to drill basic syntax, memory models, and standard patterns.</p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
                <button
                  onClick={() => setSubjectTab('languages')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subjectTab === 'languages' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Languages
                </button>
                <button
                  onClick={() => setSubjectTab('dsa')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subjectTab === 'dsa' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  DSA Basics
                </button>
                <button
                  onClick={() => setSubjectTab('core_cs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subjectTab === 'core_cs' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Core CS
                </button>
              </div>
            </div>

            {subjectTab === 'languages' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'Python', icon: '🐍', desc: 'Data structures & syntax' },
                  { name: 'JavaScript', icon: '🟨', desc: 'Async, closures & DOM' },
                  { name: 'TypeScript', icon: '🔷', desc: 'Types & OOP interfaces' },
                  { name: 'Java', icon: '☕', desc: 'Classes & collections' },
                  { name: 'C++', icon: '⚡', desc: 'Pointers & STL memory' },
                  { name: 'C Language', icon: '⚙️', desc: 'Memory & structs' },
                ].map((lang) => (
                  <button
                    key={lang.name}
                    onClick={() => handleLaunchTopic(`${lang.name} Fundamentals`, 'Fullstack', 'Junior')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left space-y-1.5 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl block">{lang.icon}</span>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">{lang.name}</span>
                    <span className="text-[10px] text-slate-500 block">{lang.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {subjectTab === 'dsa' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Arrays & Hashing', desc: 'Two Sum, duplicates, frequency maps', count: '5 Problems' },
                  { name: 'Strings & Two Pointers', desc: 'Anagrams, palindromes, sliding window', count: '4 Problems' },
                  { name: 'Linked Lists & Pointers', desc: 'List reversal, fast & slow pointer', count: '3 Problems' },
                  { name: 'Binary Search & Trees', desc: 'Logarithmic search, binary tree inversion', count: '4 Problems' },
                ].map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => handleLaunchTopic(topic.name, 'Fullstack', 'Junior')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left space-y-2 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">{topic.name}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{topic.desc}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-[11px] font-semibold text-indigo-600">
                      <span>{topic.count}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {subjectTab === 'core_cs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Operating Systems', icon: Cpu, desc: 'Processes, threads, IPC, scheduling' },
                  { name: 'DBMS & SQL', icon: Database, desc: 'Joins, indexing, normalization, ACID' },
                  { name: 'Computer Networks', icon: Network, desc: 'TCP/IP, HTTP/3, TLS handshakes, DNS' },
                  { name: 'OOP & SOLID', icon: Boxes, desc: 'Pillars, polymorphism, design patterns' },
                ].map((subject) => {
                  const Icon = subject.icon;
                  return (
                    <button
                      key={subject.name}
                      onClick={() => handleLaunchTopic(subject.name, 'Backend', 'Junior')}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left space-y-2 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">{subject.name}</span>
                        <span className="text-[11px] text-slate-500 block">{subject.desc}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                        <span>Start Drill</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROFESSIONAL CALIBRATED DOMAIN CARDS (Working Professional View) */}
        {isProfessional && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Senior & Staff Engineering Domain Specializations
              </h2>
              <p className="text-xs text-slate-500">Benchmark your real-world technical decision-making against industry expectations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Backend & High-Concurrency Systems',
                  domain: 'Backend' as InterviewDomain,
                  diff: 'Senior' as ExperienceLevel,
                  desc: 'Distributed rate limiting, Redis Lua atomicity, Saga transaction orchestration.',
                  icon: Database,
                },
                {
                  title: 'Frontend Architecture & UI Systems',
                  domain: 'Frontend' as InterviewDomain,
                  diff: 'Senior' as ExperienceLevel,
                  desc: 'React 18 Fiber reconciliation, Virtual DOM diffing, CSS performance.',
                  icon: Layers,
                },
                {
                  title: 'System Design & High-Scale Infra',
                  domain: 'System Design' as InterviewDomain,
                  diff: 'Staff' as ExperienceLevel,
                  desc: 'Real-time collaborative CRDTs, TinyURL distributed hashing, CAP theorem.',
                  icon: Cpu,
                },
                {
                  title: 'Cloud Infrastructure & DevOps',
                  domain: 'DevOps' as InterviewDomain,
                  diff: 'Senior' as ExperienceLevel,
                  desc: 'Docker multi-stage security, Kubernetes horizontal pod autoscaling.',
                  icon: Boxes,
                },
                {
                  title: 'Executive Behavioral Leadership',
                  domain: 'Behavioral' as InterviewDomain,
                  diff: 'Senior' as ExperienceLevel,
                  desc: 'STAR framework: Critical outage incident response & blameless postmortems.',
                  icon: Target,
                },
                {
                  title: 'Fullstack Algorithmic Mastery',
                  domain: 'Fullstack' as InterviewDomain,
                  diff: 'Senior' as ExperienceLevel,
                  desc: 'LRU Cache design, sliding window algorithms, dynamic programming.',
                  icon: Code2,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLaunchTopic(card.title, card.domain, card.diff)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Launch {card.diff} Assessment</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CAREER SWITCHER PATHWAY (Career Switcher View) */}
        {isCareerSwitcher && switcherPhase === 'foundations' && (
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phase 1: Build Your Software Engineering Foundations
              </h2>
              <p className="text-xs text-slate-500">Core problem-solving patterns required before diving into fullstack frameworks.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: '1. Programming Logic & Syntax', desc: 'Variables, loops, functions, and standard control flow in Python/JavaScript.', diff: 'Junior' as ExperienceLevel },
                { title: '2. Foundational Data Structures', desc: 'Arrays, Hash Tables (Two Sum #1), and String manipulation.', diff: 'Junior' as ExperienceLevel },
                { title: '3. Database & SQL Queries', desc: 'Basic relational joins, filtering, and CRUD operations.', diff: 'Junior' as ExperienceLevel },
              ].map((step) => (
                <div key={step.title} className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-teal-950">{step.title}</h3>
                    <p className="text-xs text-teal-900/80 leading-relaxed">{step.desc}</p>
                  </div>
                  <button
                    onClick={() => handleLaunchTopic(step.title, 'Fullstack', step.diff)}
                    className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors"
                  >
                    Start Foundational Drill
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. STANDARD MOCK CONFIGURATOR (Available to Job Seekers or as full custom configurator) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isStudentBeginner ? 'Custom Mock Assessment Configuration' : 'Configure Custom Assessment Session'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Customize your domain track, difficulty tier, and interview format for a full 60-minute proctored session.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Proctored Mode (60 Mins)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Domain Track */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Domain Track
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as InterviewDomain)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="Frontend">Frontend Architecture & UI Systems</option>
                <option value="Backend">Backend & Distributed Microservices</option>
                <option value="System Design">System Design & High-Scale Infra</option>
                <option value="Fullstack">Fullstack Core & Algorithms</option>
                <option value="DevOps">DevOps & Cloud Infrastructure</option>
                <option value="Behavioral">Behavioral & Executive Leadership</option>
              </select>
            </div>

            {/* Seniority / Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Target Seniority
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as ExperienceLevel)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="Junior">Junior / Beginner Engineer</option>
                <option value="Mid">Mid-Level Engineer</option>
                <option value="Senior">Senior Engineer</option>
                <option value="Lead">Lead / Staff Engineer</option>
                <option value="Staff">Principal / Distinguished Architect</option>
              </select>
            </div>

            {/* Assessment Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assessment Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as InterviewFormat)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="Hybrid">Hybrid (Voice Architecture + Live Coding)</option>
                <option value="Voice">Voice Architectural Discussion Only</option>
                <option value="Code">Live Coding & Algorithmic Sandbox Only</option>
              </select>
            </div>
          </div>

          {/* Custom Focus Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Custom Topic Focus (Optional)
            </label>
            <input
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="e.g. Microfrontends, WebSockets, Kafka concurrency, Redis caching, Rate limiters, Dynamic Programming"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
            />
          </div>

          {/* Launch Arena Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Entering the assessment launches fullscreen mode with away monitoring.</span>
            </div>

            <button
              onClick={handleLobbyLaunch}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start 60-Minute Assessment</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: PRE-ASSESSMENT FULLSCREEN GATE
  // (Enforces user-initiated fullscreen before starting 60-min timer)
  // ==========================================
  if (session && !hasEnteredFullscreenOnce) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 max-w-2xl mx-auto animate-in fade-in duration-200">
        <div className="w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Maximize2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Proctored Environment Gate
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fullscreen is required for this assessment
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              To ensure interview integrity and prevent distractions, this {session.allocatedDurationMinutes || 45}-minute technical evaluation runs in full-screen mode.
            </p>
          </div>

          {/* Assessment Protocol Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex items-start gap-3 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>{session.allocatedDurationMinutes || 45}-Minute Global Timer:</strong> Countdown begins only after fullscreen is activated.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-700">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Away-from-Test Monitor:</strong> Exiting fullscreen pauses the test and starts a 60-second recovery timer.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-700">
              <Code2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Split Workspace:</strong> Real-time question statement on the left, multi-language IDE on the right.</span>
            </div>
          </div>

          {fullscreenError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {fullscreenError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onExit}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              onClick={requestBrowserFullscreen}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Enter Fullscreen & Start</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: ACTIVE LIVE ASSESSMENT ARENA
  // (Fullscreen 2-column layout with test timer)
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
      
      {/* 1. PROFESSIONAL ASSESSMENT HEADER */}
      <header className="h-14 sm:h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs z-10">
        {/* Left: Brand + Title + Question Count */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setShowExitConfirmModal(true)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Exit Assessment"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-indigo-700 tracking-wider">ELEVATE.AI</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                {session.title || 'Technical Assessment'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions} • {session.domain} • {session.difficulty} Tier
            </p>
          </div>
        </div>

        {/* Center: SINGLE GLOBAL ASSESSMENT TIMER */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-2xs ${
            globalTimeRemaining < 300
              ? 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
              : 'text-slate-900 bg-slate-50 border-slate-200'
          }`}>
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{formatGlobalTimer(globalTimeRemaining)}</span>
          </div>
        </div>

        {/* Right: Fullscreen Status + Draft Status + Submit CTA */}
        <div className="flex items-center gap-2.5">
          {/* Proctored Fullscreen Toggle / Indicator */}
          <button
            onClick={isFullscreen ? exitBrowserFullscreen : requestBrowserFullscreen}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs hidden md:inline-flex ${
              isFullscreen
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
            title={isFullscreen ? 'Proctored Fullscreen Active' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fullscreen Active</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Enable Fullscreen</span>
              </>
            )}
          </button>

          {/* Autosave Status */}
          {autosaveStatus === 'saving' && (
            <span className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="text-[11px] font-mono text-emerald-600 hidden sm:flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Autosaved</span>
            </span>
          )}

          {/* Submit Action */}
          <button
            onClick={handleSubmitResponse}
            disabled={isSubmitting}
            className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{activeTab === 'code' ? 'Submit Code' : 'Submit Response'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. DRAFT RESTORED NOTIFICATION BANNER */}
      {draftRestoredNote && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-indigo-900 text-xs flex items-center gap-2 shrink-0">
          <Save className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{draftRestoredNote}</span>
        </div>
      )}

      {/* 3. ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-800 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleSubmitResponse}
            className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[11px] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. MAIN ASSESSMENT WORKSPACE (TWO-COLUMN VIEWPORT LAYOUT) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN (5 COLS): QUESTION PANEL (TOP OCCUPANT)       */}
        {/* Visible immediately without whole-page scroll             */}
        {/* ======================================================== */}
        <section className="lg:col-span-5 h-full flex flex-col min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1 space-y-4">
            {/* The Question Card: Top and primary component on the left */}
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              onNavigateQuestion={handleNavigateQuestion}
            />

            {/* Voice Telemetry & Visualizer (Docked below question if in Voice mode) */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <AIAvatarVisualizer
                  state={avatarState}
                  audioVolume={audioVolume}
                  coachMessage={
                    avatarState === 'listening'
                      ? "Recording audio and analyzing technical reasoning..."
                      : avatarState === 'thinking'
                      ? "Evaluating response against technical criteria..."
                      : "Review the question requirements and state your approach clearly."
                  }
                />

                <AudioWaveform
                  frequencies={frequencies}
                  volume={audioVolume}
                  isRecording={isRecording}
                  isSimulated={isSimulatedAudio}
                />
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (7 COLS): ANSWER AREA / CODE IDE             */}
        {/* ======================================================== */}
        <section className="lg:col-span-7 h-full flex flex-col min-h-0 overflow-hidden space-y-3">
          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-xl bg-slate-200/80 border border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>Voice / Written Answer</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Implementation IDE</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block pr-3 font-medium">
              {activeTab === 'voice' ? 'Spoken & Written Response' : `${selectedLanguage.toUpperCase()} Sandbox`}
            </span>
          </div>

          {/* Answer Workspace Content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeTab === 'voice' ? (
              <div className="h-full overflow-y-auto">
                <VoiceTranscriber
                  transcript={transcript}
                  onTranscriptChange={handleTranscriptChange}
                  isRecording={isRecording}
                  onToggleRecording={toggleRecording}
                  volume={audioVolume}
                  isUnsupported={isSpeechUnsupported}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col min-h-0">
                <CodeEditorPanel
                  codeTemplate={currentQuestion.codeTemplate}
                  code={code}
                  onCodeChange={handleCodeChange}
                  language={selectedLanguage}
                  onLanguageChange={handleLanguageChange}
                  onRunCode={handleRunCode}
                  isRunning={isRunningCode}
                  onSubmitCode={handleSubmitCode}
                  isSubmitting={isSubmitting}
                  executionResult={executionResult}
                  customTestCases={customTestCases}
                  onCustomTestCasesChange={setCustomTestCases}
                  autosaveStatus={autosaveStatus}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* 5. FULLSCREEN EXIT DETECTION MODAL (TEST PAUSED)          */}
      {/* ======================================================== */}
      {isAssessmentPaused && !isAssessmentTerminated && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                TEST PAUSED
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are currently outside fullscreen mode. Proctored integrity requires active fullscreen during the assessment.
              </p>
            </div>

            {/* Away Timer Counter */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Time away from test:
              </span>
              <span className={`text-2xl font-mono font-bold block ${
                awaySeconds > 45 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
              }`}>
                {formatAwayTimer(awaySeconds)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Test will terminate automatically after 01:00 (60 seconds)
              </span>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={requestBrowserFullscreen}
                className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                <span>RETURN TO FULLSCREEN</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(true)}
                className="w-full py-2.5 px-5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>EXIT TEST</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5b. EXIT TEST CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      {showExitConfirmModal && !isAssessmentTerminated && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1 text-left">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Exit Assessment?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Are you sure you want to exit this assessment?
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your current progress will be saved, but the assessment will be marked as exited and you will not be able to continue this attempt.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelExitTest}
                disabled={isTerminating}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExitTest}
                disabled={isTerminating}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTerminating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exiting...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. 60-SECOND AWAY LIMIT EXCEEDED / TERMINATION MODAL      */}
      {/* ======================================================== */}
      {isAssessmentTerminated && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white border border-rose-200 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ASSESSMENT TERMINATED
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {awaySeconds >= 60 
                  ? 'You remained outside fullscreen for more than 60 seconds. Your assessment has been closed.'
                  : 'The total 60-minute test duration has elapsed. Your assessment has been finalized.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  exitBrowserFullscreen();
                  onFinishInterview();
                }}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>VIEW SCORECARD & REPORT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. INSTANT FEEDBACK MODAL (Per question score & breakdown) */}
      {instantFeedback && (
        <InstantFeedbackModal
          feedback={instantFeedback}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          onProceed={handleProceedAfterFeedback}
        />
      )}
    </div>
  );
};
