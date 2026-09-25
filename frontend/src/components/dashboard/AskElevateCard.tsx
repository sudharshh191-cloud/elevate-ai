import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  Bot, 
  Lightbulb, 
  Target, 
  AlertCircle,
  Briefcase,
  FileText,
  Cpu,
  User,
  Compass,
  Trash2,
  Code
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { IAskElevateResponse, IAssistantSuggestedAction, IAssistantMessage } from '../../types';

interface AskElevateCardProps {
  targetRole?: string;
  trackLevel?: string;
  userType?: string;
  onNavigate?: (page: 'dashboard' | 'arena' | 'resume' | 'system-design' | 'analytics' | 'profile' | 'job-intelligence') => void;
  onNavigateArena: () => void;
  onNavigateResume: () => void;
  onNavigateJobIntelligence?: () => void;
  onNavigateSystemDesign?: () => void;
  onNavigateProfile?: () => void;
  onNavigateRoadmap?: () => void;
}

const LOADING_MESSAGES = [
  'Cross-referencing your verified platform records...',
  'Reviewing your career profile & resume skills...',
  'Analyzing your job intelligence & skill gaps...',
  'Aligning roadmap with your target role...',
  'Formulating personalized evidence-based guidance...',
];

const DEFAULT_SUGGESTED_QUESTIONS = [
  'What should I work on today?',
  'What skills am I missing for my target role?',
  'What should I improve in my resume?',
  'Explain my current roadmap priorities',
  'Should I practice DSA or system design first?',
  'How do my verified skills compare to job requirements?',
];

export const AskElevateCard: React.FC<AskElevateCardProps> = ({
  targetRole,
  trackLevel,
  userType,
  onNavigate,
  onNavigateArena,
  onNavigateResume,
  onNavigateJobIntelligence,
  onNavigateSystemDesign,
  onNavigateProfile,
  onNavigateRoadmap,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [messages, setMessages] = useState<IAssistantMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const roleName = targetRole || 'Software Engineering';

  // Load conversation history and dynamic suggested questions on mount
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const historyData = await ApiService.getElevateAssistantHistory();
        if (isMounted && historyData) {
          if (historyData.messages && Array.isArray(historyData.messages)) {
            setMessages(historyData.messages);
          }
          if (historyData.suggestedQuestions && historyData.suggestedQuestions.length > 0) {
            setSuggestedQuestions(historyData.suggestedQuestions);
          }
        }
      } catch (err) {
        // Non-fatal: fallback to clean state
        console.warn('Could not load assistant history:', err);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cycle friendly loading states
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Scroll to bottom of conversation when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleAsk = async (qText?: string) => {
    const textToAsk = (qText || question).trim();
    if (!textToAsk || isLoading) return;

    setError(null);
    setQuestion('');
    setIsLoading(true);
    setLoadingMsgIndex(0);

    // Optimistically add user message to list
    const tempUserMsg: IAssistantMessage = {
      role: 'user',
      content: textToAsk,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result: IAskElevateResponse = await ApiService.askElevateAssistant(textToAsk);
      
      const assistantMsg: IAssistantMessage = {
        role: 'assistant',
        content: result.answer,
        whyThisMatters: result.whyThisMatters,
        suggestedActions: result.suggestedActions,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get career assistance:', err);
      setError(err.message || 'ELEVATE could not generate a recommendation right now. Please try again.');
      // Remove the optimistic user message if call failed completely
      setMessages((prev) => prev.slice(0, -1));
      setQuestion(textToAsk);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (isClearing || isLoading) return;
    setIsClearing(true);
    try {
      await ApiService.clearElevateAssistantHistory();
      setMessages([]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to clear assistant history:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleActionClick = (action: IAssistantSuggestedAction) => {
    const route = action.route;
    if (route === 'job-intelligence' && onNavigateJobIntelligence) {
      onNavigateJobIntelligence();
    } else if (route === 'resume' && onNavigateResume) {
      onNavigateResume();
    } else if (route === 'system-design' && onNavigateSystemDesign) {
      onNavigateSystemDesign();
    } else if (route === 'profile' && onNavigateProfile) {
      onNavigateProfile();
    } else if (route === 'arena' && onNavigateArena) {
      onNavigateArena();
    } else if (route === 'roadmap' && onNavigateRoadmap) {
      onNavigateRoadmap();
    } else if (onNavigate) {
      onNavigate(route as any);
    } else if (onNavigateArena) {
      onNavigateArena();
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'JOB_INTELLIGENCE':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'RESUME':
        return <FileText className="w-3.5 h-3.5" />;
      case 'SYSTEM_DESIGN':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'PROFILE':
        return <User className="w-3.5 h-3.5" />;
      case 'ROADMAP':
        return <Compass className="w-3.5 h-3.5" />;
      case 'PRACTICE':
        return <Code className="w-3.5 h-3.5" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-600" />
              ASK ELEVATE
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              Personal Career Assistant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalized guidance grounded strictly in your verified profile, resume, job intelligence, and roadmap
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={isClearing || isLoading}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Thread</span>
          </button>
        )}
      </div>

      {/* Suggested Questions Grid (Show when empty or at top) */}
      {messages.length === 0 && (
        <div className="space-y-2 mb-4">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Suggested questions for your {roleName} preparation:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestedQuestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleAsk(prompt);
                }}
                disabled={isLoading}
                className="text-left text-xs px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center justify-between group disabled:opacity-50"
              >
                <span className="truncate mr-2 font-medium">{prompt}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Multi-turn Conversation Stream */}
      {messages.length > 0 && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 mb-4 rounded-xl">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              {msg.role === 'user' ? (
                /* User Message Bubble */
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-indigo-600 text-white shadow-2xs">
                    <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                /* Assistant Message Block */
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-xs font-semibold text-slate-700">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>ELEVATE Recommendation for {roleName} ({trackLevel || 'Senior'} Track)</span>
                  </div>

                  {/* Main Answer Content */}
                  <div className="text-xs text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Why This Matters Callout */}
                  {msg.whyThisMatters && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                      <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-amber-900 block">Why This Matters:</span>
                        <p className="text-amber-800 leading-relaxed">{msg.whyThisMatters}</p>
                      </div>
                    </div>
                  )}

                  {/* Suggested Action Buttons */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Recommended Next Actions:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {msg.suggestedActions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => handleActionClick(action)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-sm"
                          >
                            <span>{action.label}</span>
                            {getActionIcon(action.type)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      )}

      {/* Suggested Follow-up Prompts when messages exist */}
      {messages.length > 0 && !isLoading && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">Quick follow-ups:</span>
          {suggestedQuestions.slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(prompt)}
              className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Loading Animation Box */}
      {isLoading && (
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 animate-in fade-in duration-200 mb-3">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-indigo-900">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
            <p className="text-[10px] text-indigo-700/80">
              Cross-referencing verified platform records and active role targets
            </p>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 mb-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-rose-700">{error}</p>
            <button
              onClick={() => handleAsk()}
              className="mt-1 text-xs font-semibold text-rose-800 hover:underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Interactive Input Form */}
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
          placeholder={`Ask ELEVATE anything about your skills, missing requirements, roadmap, or ${roleName} preparation...`}
          rows={2}
          className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none font-sans"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-400">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[9px]">Enter</kbd> to ask · Strictly grounded in your data
          </span>
          <button
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Ask ELEVATE</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskElevateCard;
