import React, { useState } from 'react';
import { Crosshair, Info, Sparkles } from 'lucide-react';

interface RadarItem {
  skill: string;
  candidateScore: number;
  industryBenchmark: number;
}

interface SkillRadarChartProps {
  data?: RadarItem[];
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  data = [],
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[340px] space-y-3">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400">
          <Crosshair className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">No Assessment Radar Data Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Complete an assessment in the Mock Arena to map your rubric dimensions across engineering axes.
          </p>
        </div>
      </div>
    );
  }

  const size = 340;
  const center = size / 2;
  const radius = 115;
  const total = data.length;

  const candidateAvg = total > 0 ? Math.round(data.reduce((acc, d) => acc + (d.candidateScore || 0), 0) / total) : 0;
  const benchmarkAvg = total > 0 ? Math.round(data.reduce((acc, d) => acc + (d.industryBenchmark || 0), 0) / total) : 0;

  const topDiffItem = total > 0
    ? [...data].sort((a, b) => ((b.candidateScore || 0) - (b.industryBenchmark || 0)) - ((a.candidateScore || 0) - (a.industryBenchmark || 0)))[0]
    : null;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate polygon points
  const candidatePoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.candidateScore, i);
    return `${x},${y}`;
  }).join(' ');

  const benchmarkPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(d.industryBenchmark, i);
    return `${x},${y}`;
  }).join(' ');

  // Grid concentric rings (20%, 40%, 60%, 80%, 100%)
  const rings = [20, 40, 60, 80, 100];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Skill Proficiency Radar
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Staff 360°
              </span>
            </h3>
            <p className="text-xs text-slate-500">Your live competency vs. Senior Industry Benchmark</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span className="text-slate-700 font-medium">You (Avg: {candidateAvg}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Benchmark ({benchmarkAvg}%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex items-center justify-center my-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Concentric Grid Rings */}
          {rings.map((ringValue) => {
            const ringPoints = data.map((_, i) => {
              const { x, y } = getCoordinates(ringValue, i);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={ringValue}
                points={ringPoints}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Radial Spokes */}
          {data.map((_, i) => {
            const { x, y } = getCoordinates(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Industry Benchmark Polygon */}
          <polygon
            points={benchmarkPoints}
            fill="rgba(16, 185, 129, 0.06)"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Candidate Score Polygon */}
          <polygon
            points={candidatePoints}
            fill="rgba(79, 70, 229, 0.12)"
            stroke="#4F46E5"
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Candidate Score Vertices */}
          {data.map((item, i) => {
            const { x, y } = getCoordinates(item.candidateScore, i);
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 4}
                  fill="#4F46E5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}

          {/* Text Labels */}
          {data.map((item, i) => {
            const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
            const labelRadius = radius + 28;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            const isHovered = hoveredIdx === i;

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isHovered ? '#4338CA' : '#475569'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                className="cursor-pointer select-none transition-colors duration-150"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {item.skill.split(' ')[0]}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over a dimension */}
        {hoveredIdx !== null && (
          <div className="absolute bottom-2 bg-slate-900 text-white border border-slate-700 px-3.5 py-2 rounded-xl shadow-xl text-xs pointer-events-none transition-all">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{data[hoveredIdx].skill}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-slate-300">
              <span>Your Score: <strong className="text-indigo-400">{data[hoveredIdx].candidateScore}%</strong></span>
              <span>Benchmark: <strong className="text-emerald-400">{data[hoveredIdx].industryBenchmark}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Coach Insight */}
      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong className="text-slate-900">Coach Insight:</strong>{' '}
          {topDiffItem && topDiffItem.candidateScore > topDiffItem.industryBenchmark
            ? `${topDiffItem.skill} (+${topDiffItem.candidateScore - topDiffItem.industryBenchmark}% vs benchmark) is your strongest relative area.`
            : 'Complete practice mock sessions to establish your personalized competency benchmarks.'}
        </span>
      </div>
    </div>
  );
};
