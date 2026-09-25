import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, ShieldAlert, Link as LinkIcon, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';

interface ShareScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  initialShareId?: string;
  initialShareEnabled?: boolean;
}

export const ShareScorecardModal: React.FC<ShareScorecardModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  initialShareId,
  initialShareEnabled,
}) => {
  const [shareId, setShareId] = useState<string | undefined>(initialShareId);
  const [shareEnabled, setShareEnabled] = useState<boolean>(initialShareEnabled ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialShareId) {
      setShareId(initialShareId);
      setShareEnabled(initialShareEnabled ?? true);
    }
  }, [initialShareId, initialShareEnabled]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = shareId ? `${origin}/?share=${shareId}` : '';

  const handleGenerateShare = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.shareScorecard(sessionId);
      setShareId(res.shareId);
      setShareEnabled(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await ApiService.revokeScorecardShare(sessionId);
      setShareEnabled(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke share link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Share Assessment Scorecard</h3>
              <p className="text-xs text-slate-500">Generate a secure, public read-only link for recruiters & hiring leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Content */}
        {shareEnabled && shareId ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-800">Public Share Link is Active</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                READ-ONLY
              </span>
            </div>

            {/* URL Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shareable URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-indigo-700 select-all overflow-x-auto shadow-2xs font-medium">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{shareUrl}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                Privacy & Data Isolation Protected
              </span>
              <p>
                Only sanitized scorecards, rubric benchmarks, and executive summaries are exposed. Personal emails, password hashes, and raw audio telemetry are strictly omitted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleRevokeShare}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Revoking...' : 'Revoke Link'}</span>
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Preview Public Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600">
                Sharing allows you to showcase your AI verified scores, strengths, and rubric evaluations with mentors, hiring managers, or portfolio viewers without requiring them to sign in.
              </p>
            </div>

            <button
              onClick={handleGenerateShare}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Generating Public Link...' : 'Create Public Share Link'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
