import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUserProfile } from '../types';
import { ApiService } from '../services/api';

export type AuthModalMode = 'signin' | 'register' | 'forgot_password' | 'prompt';

interface PendingAction {
  callback: () => void;
  featureName?: string;
}

interface AuthContextType {
  user: IUserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, keepMeSignedIn?: boolean) => Promise<void>;
  loginWithOtp: (email: string, otp: string, type?: 'login' | 'reset_password' | 'verification') => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => Promise<{ message: string; email: string; requireOtp: boolean; expiresInSeconds: number }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUser: (updatedUser: IUserProfile) => void;
  requireAuth: (callback?: () => void, featureName?: string) => boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  promptFeatureName: string | null;
  openAuthModal: (mode?: AuthModalMode, featureName?: string, pendingAction?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('elevate_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');
  const [promptFeatureName, setPromptFeatureName] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Initialize and validate token on application mount
  const refreshSession = useCallback(async () => {
    const storedToken = localStorage.getItem('elevate_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await ApiService.getProfile(storedToken);
      if (profile && profile.email) {
        setUser(profile);
        setToken(storedToken);
      } else {
        localStorage.removeItem('elevate_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Session restoration skipped or invalid token:', err);
      localStorage.removeItem('elevate_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Global 401 Unauthorized listener
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('🔒 401 Unauthorized detected. Clearing session.');
      localStorage.removeItem('elevate_token');
      setUser(null);
      setToken(null);
      setIsAuthModalOpen(true);
      setAuthModalMode('signin');
      setPromptFeatureName('Your session has expired. Please sign in again.');
    };

    window.addEventListener('elevate:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('elevate:unauthorized', handleUnauthorized);
  }, []);

  const executePendingActionIfAny = (userProfile: IUserProfile) => {
    if (pendingAction && typeof pendingAction.callback === 'function') {
      const cb = pendingAction.callback;
      setPendingAction(null);
      setPromptFeatureName(null);
      setTimeout(() => {
        try {
          cb();
        } catch (e) {
          console.error('Error executing pending action:', e);
        }
      }, 100);
    }
  };

  const login = async (email: string, password: string, keepMeSignedIn = true) => {
    const res = await ApiService.login(email, password, keepMeSignedIn);
    localStorage.setItem('elevate_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    executePendingActionIfAny(res.user);
  };

  const loginWithOtp = async (
    email: string,
    otp: string,
    type: 'login' | 'reset_password' | 'verification' = 'login'
  ) => {
    const res = await ApiService.verifyOtp(email, otp, type);
    if (res.token && res.user) {
      localStorage.setItem('elevate_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      executePendingActionIfAny(res.user);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    targetRole?: string;
    experienceLevel?: string;
  }) => {
    return await ApiService.register({
      name: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      targetRole: data.targetRole || 'Senior Fullstack Engineer',
      experienceLevel: data.experienceLevel || 'Senior',
    });
  };

  const logout = () => {
    localStorage.removeItem('elevate_token');
    setToken(null);
    setUser(null);
    setPendingAction(null);
    setPromptFeatureName(null);
  };

  const openAuthModal = (
    mode: AuthModalMode = 'signin',
    featureName?: string,
    action?: () => void
  ) => {
    setAuthModalMode(mode);
    setPromptFeatureName(featureName || null);
    if (action) {
      setPendingAction({ callback: action, featureName });
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPromptFeatureName(null);
  };

  const requireAuth = (callback?: () => void, featureName?: string): boolean => {
    if (user && token) {
      if (callback) callback();
      return true;
    }

    // Guest user triggered a protected feature
    openAuthModal('prompt', featureName, callback);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        loginWithOtp,
        register,
        logout,
        refreshSession,
        updateUser: (updatedUser: IUserProfile) => setUser(updatedUser),
        requireAuth,
        isAuthModalOpen,
        authModalMode,
        promptFeatureName,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
