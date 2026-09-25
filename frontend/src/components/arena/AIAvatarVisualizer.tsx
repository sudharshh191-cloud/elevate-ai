import React from 'react';
import { Brain, Mic, Volume2, Cpu } from 'lucide-react';

export type AIAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AIAvatarVisualizerProps {
  state: AIAvatarState;
  audioVolume?: number; // 0.0 - 1.0
  coachMessage?: string;
}

export const AIAvatarVisualizer: React.FC<AIAvatarVisualizerProps> = ({
  state = 'idle',
  audioVolume = 0.2,
  coachMessage = "Walk me through your architectural reasoning and technical approach."
}) => {
  const stateConfigs = {
    idle: {
      label: 'Interviewer Ready',
      color: 'from-indigo-500 to-indigo-600',
      glow: 'shadow-indigo-500/10',
      icon: Cpu,
      statusColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      ringScale: 'scale-100',
    },
    listening: {
      label: 'Recording Spoken Response',
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
      icon: Mic,
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 animate-pulse',
      ringScale: 'scale-110',
    },
    thinking: {
      label: 'Evaluating Technical Criteria...',
      color: 'from-amber-500 to-indigo-600',
      glow: 'shadow-amber-500/20',
      icon: Brain,
      statusColor: 'text-amber-800 bg-amber-50 border-amber-200',
      ringScale: 'scale-105',
    },
    speaking: {
      label: 'Processing Response Feedback',
      color: 'from-indigo-600 via-purple-600 to-emerald-600',
      glow: 'shadow-indigo-500/25',
      icon: Volume2,
      statusColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      ringScale: 'scale-115',
    },
  };

  const currentConfig = stateConfigs[state] || stateConfigs.idle;
  const StateIcon = currentConfig.icon;

  // Dynamic scale calculation based on volume
  const dynamicScale = 1 + (audioVolume || 0) * 0.35;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center text-center relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>

      {/* State Badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${currentConfig.statusColor}`}>
          <StateIcon className="w-3.5 h-3.5" />
          <span>{currentConfig.label}</span>
        </span>
      </div>

      {/* Neural Avatar Orb */}
      <div className="relative my-3 flex items-center justify-center">
        {/* Outermost pulsing wave ring */}
        <div
          className={`absolute w-32 h-32 rounded-full border border-indigo-200 transition-all duration-300 ${
            state === 'listening' || state === 'speaking' ? 'animate-ping opacity-40' : 'opacity-10'
          }`}
          style={{ transform: `scale(${dynamicScale * 1.2})` }}
        ></div>

        {/* Secondary energy ring */}
        <div
          className="absolute w-24 h-24 rounded-full border border-emerald-200 transition-all duration-300"
          style={{ transform: `scale(${dynamicScale * 1.08})` }}
        ></div>

        {/* Core Orb */}
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentConfig.color} p-[2px] shadow-md ${currentConfig.glow} transition-transform duration-200`}
          style={{ transform: `scale(${dynamicScale})` }}
        >
          <div className="w-full h-full rounded-2xl bg-indigo-600 flex items-center justify-center relative overflow-hidden">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>

      {/* Coach Message Prompt */}
      <div className="mt-1 max-w-sm">
        <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
          "{coachMessage}"
        </p>
      </div>

      {/* Telemetry Bar */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2.5 border-t border-slate-100 w-full text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Audio Latency: <strong className="text-slate-700">&lt; 20ms</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          <span>Evaluation Rubric: <strong className="text-slate-700">Engineering Standard</strong></span>
        </div>
      </div>
    </div>
  );
};
