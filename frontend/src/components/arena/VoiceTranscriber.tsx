import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface VoiceTranscriberProps {
  transcript: string;
  onTranscriptChange: (val: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  volume: number;
  isUnsupported?: boolean;
}

export const VoiceTranscriber: React.FC<VoiceTranscriberProps> = ({
  transcript,
  onTranscriptChange,
  isRecording,
  onToggleRecording,
  volume,
  isUnsupported = false,
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [wpm, setWpm] = useState(0);

  useEffect(() => {
    if (!transcript) {
      setWordCount(0);
      setFillerCount(0);
      setWpm(0);
      return;
    }
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);

    // Approximate WPM (standard conversational rate estimate)
    setWpm(Math.min(180, Math.max(90, Math.round(words.length * 1.5))));

    // Detect filler words
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'literally'];
    const lower = transcript.toLowerCase();
    let count = 0;
    fillers.forEach((f) => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) count += matches.length;
    });
    setFillerCount(count);
  }, [transcript]);

  const insertSTARFramework = (part: string) => {
    const templates: Record<string, string> = {
      S: '\n[Situation]: In my previous role handling high-throughput systems, we encountered...',
      T: '\n[Task]: My responsibility was to design and implement...',
      A: '\n[Action]: I architected the solution using...',
      R: '\n[Result]: As a result, we improved latency by 45% and ensured zero downtime.',
    };
    onTranscriptChange((transcript || '') + (templates[part] || ''));
  };

  const micScale = isRecording ? 1 + (volume || 0.1) * 0.45 : 1;

  return (
    <div className="space-y-4">
      {/* Control Strip & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Mic Control */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <div
                className="absolute w-12 h-12 rounded-full bg-emerald-500/20 animate-ping"
                style={{ transform: `scale(${micScale * 1.2})` }}
              ></div>
            )}
            <button
              onClick={onToggleRecording}
              disabled={isUnsupported}
              style={{ transform: `scale(${micScale})` }}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30 ring-4 ring-emerald-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isUnsupported ? 'Speech recognition unavailable in this browser' : isRecording ? 'Stop Recording' : 'Start Voice Input'}
            >
              {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>{isRecording ? 'Listening (Speech-to-Text Active)' : 'Voice Input Mode'}</span>
              {isRecording && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
            </div>
            <p className="text-[11px] text-slate-500">
              {isUnsupported
                ? 'Speech recognition is not supported in this browser. Please type your answer below.'
                : isRecording
                ? 'Speak clearly into your microphone'
                : 'Click mic to record or type in the editor below'}
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-slate-900 font-bold">{wordCount}</div>
            <div className="text-[10px] text-slate-400">WORDS</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div className="text-right">
            <div className={`font-bold ${fillerCount > 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {fillerCount}
            </div>
            <div className="text-[10px] text-slate-400">FILLERS</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div className="text-right">
            <div className="text-indigo-600 font-bold">{wordCount > 0 ? `~${wpm}` : '0'}</div>
            <div className="text-[10px] text-slate-400">WPM PACE</div>
          </div>
        </div>
      </div>

      {isUnsupported && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Speech recognition is not supported in this browser. You can type your response directly in the text editor below.</span>
        </div>
      )}

      {/* Transcript / Text Editor */}
      <div className="relative">
        <textarea
          rows={7}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Speak your response or type detailed architectural explanations here... Your text will be submitted to the AI for rubric evaluation."
          className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all leading-relaxed font-sans shadow-2xs"
        />

        {/* Clear Button */}
        {transcript && (
          <button
            onClick={() => onTranscriptChange('')}
            className="absolute bottom-3 right-3 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* STAR Framework Helper */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Quick STAR Framework:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['S', 'T', 'A', 'R'] as const).map((part) => (
            <button
              key={part}
              onClick={() => insertSTARFramework(part)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-[11px] font-bold text-slate-700 hover:text-indigo-700 transition-all cursor-pointer shadow-2xs"
            >
              +{part} ({part === 'S' ? 'Situation' : part === 'T' ? 'Task' : part === 'A' ? 'Action' : 'Result'})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
