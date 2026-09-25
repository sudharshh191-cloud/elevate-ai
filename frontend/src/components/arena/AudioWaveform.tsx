import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface AudioWaveformProps {
  frequencies: Uint8Array | null;
  volume: number;
  isRecording: boolean;
  isSimulated?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  frequencies,
  volume,
  isRecording,
  isSimulated = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barCount = 32;
    const barWidth = 4;
    const gap = (width - barCount * barWidth) / (barCount - 1);

    for (let i = 0; i < barCount; i++) {
      let barHeight = 6;
      if (isRecording && frequencies && frequencies.length > 0) {
        const freqIndex = Math.floor((i / barCount) * (frequencies.length / 2));
        const val = frequencies[freqIndex] || 0;
        barHeight = Math.max(6, (val / 255) * height * 0.95);
      } else if (isRecording) {
        // Idle ambient pulse
        barHeight = 6 + Math.sin(Date.now() * 0.005 + i * 0.3) * 8;
      }

      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Indigo to Emerald Gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(0.5, '#6366F1');
      gradient.addColorStop(1, '#10B981');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }, [frequencies, volume, isRecording]);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Activity className="w-3.5 h-3.5 text-indigo-600" />
          <span>Real-time Audio Stream</span>
        </div>
        <div className="flex items-center gap-2">
          {isSimulated && isRecording && (
            <span className="text-[10px] text-amber-800 font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              Synthetic Mic Simulator
            </span>
          )}
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isRecording
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 animate-pulse'
              : 'text-slate-500 bg-slate-100 border-slate-200'
          }`}>
            {isRecording ? 'STREAMING ACTIVE' : 'MIC STANDBY'}
          </span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={360}
        height={48}
        className="w-full max-w-sm h-12"
      />

      <div className="flex items-center justify-between w-full text-[10px] text-slate-400 mt-2">
        <span>Dynamic Web Audio FFT Engine</span>
        <span>Vol Level: {Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};
