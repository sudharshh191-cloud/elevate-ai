import {
  IInterviewSession,
  IFeedbackReport,
  IUserProfile,
  InterviewDomain,
  ExperienceLevel,
  InterviewFormat,
  ICodeExecutionResult,
  IDashboardAnalytics,
  IJobDescriptionAnalysis,
  IRoadmapItem,
  IRoadmapResponse,
  RoadmapStatus,
  IAskElevateResponse,
  IAssistantMessage,
  IQuestionBankItem,
  IQuestionCategoryItem,
  ITrackedJob,
  ITrackedJobStats,
} from '../types';

const API_BASE = 'http://localhost:5000/api';

/**
 * Retrieves the persisted JWT token from localStorage
 */
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('elevate_token');
  } catch {
    return null;
  }
};

/**
 * Authenticated fetch helper that injects Bearer JWT and handles 401 globally
 */
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Dispatch global unauthorized event for AuthContext
    window.dispatchEvent(new CustomEvent('elevate:unauthorized'));
  }

  return response;
};

export const ApiService = {
  // ==========================================
  // Authentication & Candidate Account Endpoints
  // ==========================================

  /**
   * Step 1: Check if an email account exists in MongoDB
   */
  async checkUser(
    identifier: string
  ): Promise<{ exists: boolean; email: string; name?: string | null; isVerified?: boolean; targetRole?: string }> {
    const res = await fetch(`${API_BASE}/auth/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Unable to check account' }));
    throw new Error(err.error || 'Failed to check account');
  },

  /**
   * Step 2: Sign in with password
   */
  async login(
    email: string,
    password: string,
    keepMeSignedIn = true
  ): Promise<{ token: string; user: IUserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, keepMeSignedIn }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Sign in failed' }));
    throw new Error(err.error || 'Invalid email or password');
  },

  /**
   * Registration: Creates new user in MongoDB and triggers 6-digit email OTP
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    targetRole?: string;
    experienceLevel?: string;
  }): Promise<{ message: string; email: string; requireOtp: boolean; expiresInSeconds: number }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Failed to create account');
  },

  /**
   * Send 6-digit OTP passcode to email
   */
  async sendOtp(
    email: string,
    type: 'login' | 'reset_password' | 'verification' = 'login'
  ): Promise<{ message: string; expiresInSeconds: number }> {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to send verification code' }));
    throw new Error(err.error || 'Failed to send OTP code');
  },

  /**
   * Verify 6-digit OTP passcode sent to email
   */
  async verifyOtp(
    email: string,
    otp: string,
    type: 'login' | 'reset_password' | 'verification' = 'login'
  ): Promise<{ token?: string; user?: IUserProfile; resetToken?: string; verified?: boolean }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Invalid verification passcode' }));
    throw new Error(err.error || 'Invalid passcode');
  },

  /**
   * Dispatches real password reset email via backend Nodemailer SMTP
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to request password reset' }));
    throw new Error(err.error || 'Failed to request password reset');
  },

  /**
   * Validates if a password reset token is valid
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; name?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    return await res.json();
  },

  /**
   * Submits a new password with the cryptographic reset token
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to reset password' }));
    throw new Error(err.error || 'Failed to reset password');
  },

  /**
   * Fetches authenticated user profile from MongoDB
   */
  async getProfile(tokenOverride?: string): Promise<IUserProfile | null> {
    const token = tokenOverride || getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch {
      // Network failure
    }
    return null;
  },

  /**
   * Updates authenticated user profile in MongoDB
   */
  async updateProfile(profileData: Partial<IUserProfile>): Promise<{ user: IUserProfile; completeness: any; message?: string }> {
    const res = await authFetch(`${API_BASE}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
    throw new Error(err.error || 'Failed to update profile');
  },

  /**
   * Uploads real PDF/DOCX/TXT resume file to backend & Python NLP service and updates MongoDB
   */
  async uploadResumeFile(file: File, targetRole?: string): Promise<{ parsedData: any; user: IUserProfile }> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('resumeFile', file);
    if (targetRole) {
      formData.append('targetRole', targetRole);
    }

    const res = await fetch(`${API_BASE}/auth/upload-resume`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Resume upload and parsing failed' }));
    throw new Error(err.error || 'Failed to upload and parse resume file');
  },

  /**
   * Completes onboarding and persists persona profile
   */
  async saveOnboarding(data: {
    userType: string;
    targetRole?: string;
    trackLevel?: string;
    experienceLevel?: string;
    studentProfile?: any;
    professionalProfile?: any;
    careerSwitcherProfile?: any;
    skills?: Array<{ name: string; level: number; category: string }>;
  }): Promise<{ message: string; user: IUserProfile }> {
    const res = await authFetch(`${API_BASE}/auth/onboarding`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to save onboarding profile' }));
    throw new Error(err.error || 'Failed to complete onboarding');
  },

  /**
   * Connects to Python FastAPI NLP service to parse resume text and updates MongoDB
   */
  async parseResume(rawText: string, targetRole?: string): Promise<{ parsedData: any; user: IUserProfile }> {
    const res = await authFetch(`${API_BASE}/auth/parse-resume`, {
      method: 'POST',
      body: JSON.stringify({ rawText, targetRole }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Resume parsing failed' }));
    throw new Error(err.error || 'Failed to parse resume');
  },

  // ==========================================
  // Question Bank Endpoints
  // ==========================================

  /**
   * Search real Question Bank with keyword/number, category, domain, difficulty, and format
   */
  async searchQuestions(params: {
    q?: string;
    category?: string;
    domain?: string;
    difficulty?: string;
    format?: string;
    limit?: number;
    page?: number;
  }): Promise<{ questions: IQuestionBankItem[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.domain && params.domain !== 'All') query.set('domain', params.domain);
    if (params.difficulty && params.difficulty !== 'All') query.set('difficulty', params.difficulty);
    if (params.format && params.format !== 'All') query.set('format', params.format);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.page) query.set('page', String(params.page));

    const res = await fetch(`${API_BASE}/interview/questions/search?${query.toString()}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to search questions' }));
    throw new Error(err.error || 'Failed to search questions');
  },

  /**
   * Get distinct categories with counts and primary domains
   */
  async getQuestionCategories(): Promise<{ categories: IQuestionCategoryItem[] }> {
    const res = await fetch(`${API_BASE}/interview/questions/categories`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to load categories' }));
    throw new Error(err.error || 'Failed to load question categories');
  },

  /**
   * Get recommended questions tailored to authenticated candidate's persona and skills
   */
  async getRecommendedQuestions(limit = 6): Promise<{ recommended: IQuestionBankItem[] }> {
    const res = await authFetch(`${API_BASE}/interview/questions/recommended?limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to load recommendations' }));
    throw new Error(err.error || 'Failed to load recommended questions');
  },

  // ==========================================
  // Interview Assessment Endpoints (Protected)
  // ==========================================

  async startInterview(params: {
    domain?: InterviewDomain;
    difficulty?: ExperienceLevel;
    format?: InterviewFormat;
    targetRole?: string;
    customTopicFocus?: string;
    questionIds?: string[];
    selectedQuestionId?: string;
    durationMinutes?: number;
    title?: string;
  }): Promise<{ sessionId: string; session: IInterviewSession }> {
    const res = await authFetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to start interview' }));
    throw new Error(err.error || 'Failed to start interview');
  },

  async getSession(sessionId: string): Promise<{ session: IInterviewSession }> {
    const res = await authFetch(`${API_BASE}/interview/${sessionId}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch session' }));
    throw new Error(err.error || 'Failed to fetch session');
  },

  async navigateQuestion(sessionId: string, questionIndex: number): Promise<{ success: boolean; currentQuestionIndex: number }> {
    try {
      const res = await authFetch(`${API_BASE}/interview/navigate`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, questionIndex }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { success: false, currentQuestionIndex: questionIndex };
  },

  async submitResponse(payload: {
    sessionId: string;
    questionIndex: number;
    responseType: 'audio' | 'code' | 'mixed' | 'voice_transcript' | 'text';
    textResponse?: string;
    codeSubmission?: {
      code: string;
      language: string;
      executionOutput?: string;
      passedTestCases?: number;
      totalTestCases?: number;
    };
    timeSpentSeconds?: number;
    audioMetrics?: any;
  }): Promise<{
    message: string;
    evaluation: any;
    nextQuestionIndex: number;
    isFinished: boolean;
  }> {
    const res = await authFetch(`${API_BASE}/interview/submit-response`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to submit response' }));
    throw new Error(err.error || 'Failed to evaluate response');
  },

  async executeCode(payload: {
    sessionId: string;
    questionIndex: number;
    language: string;
    code: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }) {
    const res = await authFetch(`${API_BASE}/code/execute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Code execution failed' }));
    throw new Error(err.error || 'Failed to execute code in sandbox');
  },

  async submitCode(payload: {
    sessionId: string;
    questionIndex: number;
    language: string;
    code: string;
    customTestCases?: Array<{ input: string; expectedOutput: string }>;
    timeSpentSeconds?: number;
  }): Promise<{
    message: string;
    executionResult: ICodeExecutionResult;
    evaluation: any;
    score: number;
    passedTests: number;
    totalTests: number;
    isFinished: boolean;
    nextQuestionIndex: number;
  }> {
    const res = await authFetch(`${API_BASE}/code/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Code submission failed' }));
    throw new Error(err.error || 'Failed to submit code solution');
  },

  async saveCodeDraft(payload: {
    sessionId: string;
    questionIndex: number;
    language: string;
    code: string;
  }): Promise<{ saved: boolean; timestamp: string }> {
    const res = await authFetch(`${API_BASE}/code/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
    return { saved: false, timestamp: new Date().toISOString() };
  },

  async getFeedbackReport(sessionId: string): Promise<{ report: IFeedbackReport } | null> {
    const res = await authFetch(`${API_BASE}/interview/feedback/${sessionId}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  },

  async finishInterview(sessionId: string): Promise<{ report: IFeedbackReport }> {
    const res = await authFetch(`${API_BASE}/interview/finish`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to synthesize report' }));
    throw new Error(err.error || 'Failed to finish interview');
  },

  async terminateSession(
    sessionId: string,
    reason: 'USER_EXITED' | 'FULLSCREEN_TIMEOUT' | 'DURATION_EXPIRED' | string = 'USER_EXITED'
  ): Promise<{ message: string; sessionId: string; status: string; terminationReason?: string }> {
    const res = await authFetch(`${API_BASE}/interview/terminate`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, reason }),
    });

    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to terminate session' }));
    throw new Error(err.error || 'Failed to terminate session');
  },

  async getInterviewHistory(page = 1, limit = 10): Promise<{
    sessions: IInterviewSession[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const res = await authFetch(`${API_BASE}/interview/history?page=${page}&limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
    return { sessions: [], total: 0, page: 1, totalPages: 1 };
  },

  /* ========================================================================= */
  /* SYSTEM DESIGN STUDIO API                                                  */
  /* ========================================================================= */

  async saveSystemDesign(diagram: any): Promise<{ message: string; diagram: any }> {
    const res = await authFetch(`${API_BASE}/system-design`, {
      method: 'POST',
      body: JSON.stringify(diagram),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to save system design' }));
    throw new Error(err.error || 'Failed to save system design');
  },

  async getSystemDesigns(): Promise<{ diagrams: any[] }> {
    const res = await authFetch(`${API_BASE}/system-design`);
    if (res.ok) {
      return await res.json();
    }
    return { diagrams: [] };
  },

  async getSystemDesignById(id: string): Promise<{ diagram: any }> {
    const res = await authFetch(`${API_BASE}/system-design/${id}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to load system design' }));
    throw new Error(err.error || 'Failed to load system design');
  },

  async deleteSystemDesign(id: string): Promise<{ message: string }> {
    const res = await authFetch(`${API_BASE}/system-design/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to delete system design' }));
    throw new Error(err.error || 'Failed to delete system design');
  },

  async evaluateSystemDesign(payload: {
    problemTitle: string;
    requirements?: string;
    nodes: any[];
    edges: any[];
    trafficConfig?: any;
    calculatedMetrics?: any;
    validationWarnings?: any[];
    diagramId?: string;
  }): Promise<{ message: string; evaluation: any }> {
    const res = await authFetch(`${API_BASE}/system-design/evaluate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to evaluate architecture' }));
    throw new Error(err.error || 'Failed to evaluate architecture');
  },

  /* ========================================================================= */
  /* PHASE 4: PDF EXPORT & SCORECARD SHARING                                  */
  /* ========================================================================= */

  async downloadReportPdf(sessionId: string): Promise<void> {
    const token = localStorage.getItem('elevate_token');
    const res = await fetch(`${API_BASE}/interview/export-pdf/${sessionId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'PDF export failed' }));
      throw new Error(err.error || 'Failed to download PDF report');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELEVATE_AI_Assessment_Report_${sessionId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async shareScorecard(sessionId: string): Promise<{ shareId: string; shareUrl: string; message: string }> {
    const res = await authFetch(`${API_BASE}/interview/share/${sessionId}`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to generate share link' }));
    throw new Error(err.error || 'Failed to generate share link');
  },

  async revokeScorecardShare(sessionId: string): Promise<{ message: string; shareEnabled: boolean }> {
    const res = await authFetch(`${API_BASE}/interview/share/${sessionId}/revoke`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to revoke share link' }));
    throw new Error(err.error || 'Failed to revoke share link');
  },

  async getPublicScorecard(shareId: string): Promise<{ report: any }> {
    const res = await fetch(`${API_BASE}/public/scorecard/${shareId}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Scorecard is unavailable' }));
    throw new Error(err.error || 'Scorecard is unavailable or link has been revoked');
  },

  /* ========================================================================= */
  /* PHASE 4: NOTIFICATIONS                                                    */
  /* ========================================================================= */

  async getNotifications(page = 1, limit = 15): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    const res = await authFetch(`${API_BASE}/notifications?page=${page}&limit=${limit}`);
    if (res.ok) {
      return await res.json();
    }
    return { notifications: [], total: 0, unreadCount: 0, page: 1, totalPages: 1 };
  },

  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    const res = await authFetch(`${API_BASE}/notifications/unread-count`);
    if (res.ok) {
      return await res.json();
    }
    return { unreadCount: 0 };
  },

  async markNotificationRead(id: string): Promise<{ message: string; unreadCount: number }> {
    const res = await authFetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to mark notification read' }));
    throw new Error(err.error || 'Failed to mark notification read');
  },

  async markAllNotificationsRead(): Promise<{ message: string; unreadCount: number }> {
    const res = await authFetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to mark all notifications read' }));
    throw new Error(err.error || 'Failed to mark all notifications read');
  },

  /* ========================================================================= */
  /* PHASE 4: USER SETTINGS                                                    */
  /* ========================================================================= */

  async getUserSettings(): Promise<{ settings: any }> {
    const res = await authFetch(`${API_BASE}/user/settings`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch settings' }));
    throw new Error(err.error || 'Failed to fetch settings');
  },

  async updateUserSettings(payload: any): Promise<{ message: string; settings: any }> {
    const res = await authFetch(`${API_BASE}/user/settings`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
    throw new Error(err.error || 'Failed to update settings');
  },

  /* ========================================================================= */
  /* ELEVATE DASHBOARD & CAREER ASSISTANT                                      */
  /* ========================================================================= */

  async getDashboardAnalytics(): Promise<IDashboardAnalytics> {
    const res = await authFetch(`${API_BASE}/analytics/dashboard`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch dashboard data' }));
    throw new Error(err.error || 'Failed to fetch dashboard data');
  },

  async askElevateAssistant(message: string): Promise<IAskElevateResponse> {
    const res = await authFetch(`${API_BASE}/assistant/ask`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      return await res.json();
    }
    // Fallback attempt to analytics endpoint
    const fallbackRes = await authFetch(`${API_BASE}/analytics/ask-elevate`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (fallbackRes.ok) {
      return await fallbackRes.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to get career guidance' }));
    throw new Error(err.error || 'Failed to get career guidance');
  },

  async getElevateAssistantHistory(): Promise<{ messages: IAssistantMessage[]; suggestedQuestions: string[] }> {
    const res = await authFetch(`${API_BASE}/assistant/history`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch assistant history' }));
    throw new Error(err.error || 'Failed to fetch assistant history');
  },

  async clearElevateAssistantHistory(): Promise<{ message: string }> {
    const res = await authFetch(`${API_BASE}/assistant/history`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to clear assistant history' }));
    throw new Error(err.error || 'Failed to clear assistant history');
  },

  /* ========================================================================= */
  /* JOB INTELLIGENCE & SKILL GAP ANALYSIS                                     */
  /* ========================================================================= */

  async analyzeJobDescription(
    jobDescription: string,
    jobTitle?: string,
    company?: string
  ): Promise<IJobDescriptionAnalysis> {
    const res = await authFetch(`${API_BASE}/analytics/analyze-job`, {
      method: 'POST',
      body: JSON.stringify({ jobDescription, jobTitle, company }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to analyze job description' }));
    throw new Error(err.error || 'Failed to analyze job description');
  },

  async getRecentJobAnalyses(): Promise<{ analyses: IJobDescriptionAnalysis[]; total: number }> {
    const res = await authFetch(`${API_BASE}/analytics/recent-jobs`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch recent job analyses' }));
    throw new Error(err.error || 'Failed to fetch recent job analyses');
  },

  async getJobAnalysisById(id: string): Promise<{ analysis: IJobDescriptionAnalysis }> {
    const res = await authFetch(`${API_BASE}/analytics/recent-jobs/${id}`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch job analysis' }));
    throw new Error(err.error || 'Failed to fetch job analysis');
  },

  async deleteJobAnalysis(id: string): Promise<{ message: string }> {
    const res = await authFetch(`${API_BASE}/analytics/recent-jobs/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to delete job analysis' }));
    throw new Error(err.error || 'Failed to delete job analysis');
  },

  async addJobGapToRoadmap(data: {
    skill: string;
    category?: string;
    reason?: string;
    jobTitle?: string;
    company?: string;
    actionTarget?: any;
  }): Promise<{ message: string; roadmapItem: IRoadmapItem; isNew: boolean }> {
    const res = await authFetch(`${API_BASE}/analytics/roadmap/add-gap`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to add gap to roadmap' }));
    throw new Error(err.error || 'Failed to add gap to roadmap');
  },

  /* ========================================================================= */
  /* ADAPTIVE CAREER ROADMAP                                                   */
  /* ========================================================================= */

  async getRoadmap(): Promise<IRoadmapResponse> {
    const res = await authFetch(`${API_BASE}/analytics/roadmap`);
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to fetch roadmap' }));
    throw new Error(err.error || 'Failed to fetch adaptive roadmap');
  },

  async generateOrRefreshRoadmap(jdSkillGaps?: string[]): Promise<IRoadmapResponse> {
    const res = await authFetch(`${API_BASE}/analytics/roadmap/generate`, {
      method: 'POST',
      body: JSON.stringify({ jdSkillGaps }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to generate roadmap' }));
    throw new Error(err.error || 'Failed to generate adaptive roadmap');
  },

  async updateRoadmapItem(
    id: string,
    updates: { status?: RoadmapStatus; order?: number }
  ): Promise<{ message: string; roadmapItem: IRoadmapItem }> {
    const res = await authFetch(`${API_BASE}/analytics/roadmap/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to update roadmap item' }));
    throw new Error(err.error || 'Failed to update roadmap item');
  },

  async deleteRoadmapItem(id: string): Promise<{ message: string }> {
    const res = await authFetch(`${API_BASE}/analytics/roadmap/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to delete roadmap item' }));
    throw new Error(err.error || 'Failed to delete roadmap item');
  },

  /* ========================================================================= */
  /* PHASE 9: JOB TRACKER & OPPORTUNITY INTELLIGENCE                           */
  /* ========================================================================= */

  async getTrackedJobs(
    status?: string,
    q?: string
  ): Promise<{ jobs: ITrackedJob[]; total: number; stats: ITrackedJobStats }> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (q) params.append('q', q);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await authFetch(`${API_BASE}/jobs${qs}`);
    if (res.ok) {
      return await res.json();
    }
    return {
      jobs: [],
      total: 0,
      stats: {
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
      },
    };
  },

  async getTrackedJobStats(): Promise<{ stats: ITrackedJobStats }> {
    const res = await authFetch(`${API_BASE}/jobs/stats`);
    if (res.ok) {
      return await res.json();
    }
    return {
      stats: {
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
      },
    };
  },

  async getTrackedJobById(id: string): Promise<{ job: ITrackedJob } | null> {
    const res = await authFetch(`${API_BASE}/jobs/${id}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  },

  async createTrackedJob(
    data: Partial<ITrackedJob> & { syncRoadmap?: boolean }
  ): Promise<{ message: string; job: ITrackedJob; isNew: boolean }> {
    const res = await authFetch(`${API_BASE}/jobs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to create tracked job' }));
    throw new Error(err.error || 'Failed to track opportunity');
  },

  async updateTrackedJob(
    id: string,
    updates: Partial<ITrackedJob>
  ): Promise<{ message: string; job: ITrackedJob }> {
    const res = await authFetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to update tracked job' }));
    throw new Error(err.error || 'Failed to update opportunity');
  },

  async deleteTrackedJob(id: string): Promise<{ message: string; id: string }> {
    const res = await authFetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to delete tracked job' }));
    throw new Error(err.error || 'Failed to delete opportunity');
  },

  async syncJobToRoadmap(id: string): Promise<{ message: string; roadmapItems?: IRoadmapItem[] }> {
    const res = await authFetch(`${API_BASE}/jobs/${id}/sync-roadmap`, {
      method: 'POST',
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({ error: 'Failed to sync job to roadmap' }));
    throw new Error(err.error || 'Failed to sync job to roadmap');
  },
};


