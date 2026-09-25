import React, { useState } from 'react';
import {
  X,
  Calculator,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  HardDrive,
  Users,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { ITrafficConfig, ICalculatedMetrics } from '../../types';
import { calculateArchitectureMetrics } from '../../utils/systemDesignCalculations';

interface TrafficCalculatorModalProps {
  initialConfig: ITrafficConfig;
  onApplyConfig: (config: ITrafficConfig, metrics: ICalculatedMetrics) => void;
  onClose: () => void;
}

export const TrafficCalculatorModal: React.FC<TrafficCalculatorModalProps> = ({
  initialConfig,
  onApplyConfig,
  onClose,
}) => {
  const [dau, setDau] = useState<number>(initialConfig.dau || 10000000);
  const [requestsPerUser, setRequestsPerUser] = useState<number>(initialConfig.requestsPerUser || 20);
  const [peakMultiplier, setPeakMultiplier] = useState<number>(initialConfig.peakMultiplier || 2.5);
  const [readWriteRatio, setReadWriteRatio] = useState<number>(initialConfig.readWriteRatio || 10);
  const [payloadSizeKb, setPayloadSizeKb] = useState<number>(initialConfig.payloadSizeKb || 2);

  const currentConfig: ITrafficConfig = {
    dau,
    requestsPerUser,
    peakMultiplier,
    readWriteRatio,
    payloadSizeKb,
  };

  const metrics = calculateArchitectureMetrics(currentConfig);

  const handleApply = () => {
    onApplyConfig(currentConfig, metrics);
    onClose();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distributed Traffic & Capacity Estimator</h2>
              <p className="text-[11px] text-slate-500">
                Formula-driven capacity calculations for RPS, bandwidth, and annual storage growth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Sliders and Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DAU */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Daily Active Users (DAU)</span>
                </label>
                <span className="font-mono text-indigo-700 font-bold">{formatNumber(dau)}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={1000000000}
                step={1000000}
                value={dau}
                onChange={(e) => setDau(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Requests / User */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Requests / User / Day</span>
                </label>
                <span className="font-mono text-emerald-700 font-bold">{requestsPerUser} req/day</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={requestsPerUser}
                onChange={(e) => setRequestsPerUser(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Peak Multiplier */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Peak Traffic Multiplier</span>
                </label>
                <span className="font-mono text-amber-700 font-bold">{peakMultiplier}x Peak</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={6.0}
                step={0.1}
                value={peakMultiplier}
                onChange={(e) => setPeakMultiplier(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Read/Write Ratio */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-semibold">Read-to-Write Ratio</label>
                <span className="font-mono text-purple-700 font-bold">{readWriteRatio} : 1</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={readWriteRatio}
                onChange={(e) => setReadWriteRatio(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Payload Size */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-semibold">Avg Request Payload Size (KB)</label>
                <span className="font-mono text-sky-700 font-bold">{payloadSizeKb} KB</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={50}
                step={0.5}
                value={payloadSizeKb}
                onChange={(e) => setPayloadSizeKb(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Calculated Output Cards */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Calculated System Demands
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Avg RPS */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Average Load</span>
                <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">
                  {metrics.avgRps.toLocaleString()} <span className="text-[10px] text-slate-500">RPS</span>
                </span>
              </div>

              {/* Peak RPS */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 shadow-2xs">
                <span className="text-[10px] text-amber-800 font-semibold block">Peak Throughput</span>
                <span className="text-sm font-mono font-bold text-amber-900 mt-0.5 block">
                  {metrics.peakRps.toLocaleString()} <span className="text-[10px] text-amber-700">RPS</span>
                </span>
              </div>

              {/* Read RPS */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                  <ArrowDownCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>Read Load</span>
                </span>
                <span className="text-sm font-mono font-bold text-sky-700 mt-0.5 block">
                  {metrics.readRps.toLocaleString()} <span className="text-[10px] text-slate-500">RPS</span>
                </span>
              </div>

              {/* Write RPS */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Write Load</span>
                </span>
                <span className="text-sm font-mono font-bold text-rose-700 mt-0.5 block">
                  {metrics.writeRps.toLocaleString()} <span className="text-[10px] text-slate-500">RPS</span>
                </span>
              </div>
            </div>

            {/* Bandwidth and Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-600 font-semibold">Estimated Network Bandwidth</span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono text-emerald-700">
                    Ingress: <strong>{metrics.ingressBandwidthMbps} Mbps</strong>
                  </span>
                  <span className="text-xs font-mono text-sky-700">
                    Egress: <strong>{metrics.egressBandwidthMbps} Mbps</strong>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Storage Growth (3x Replicated)</span>
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono text-purple-700">
                    Daily: <strong>{metrics.dailyStorageGb} GB/day</strong>
                  </span>
                  <span className="text-xs font-mono text-indigo-700">
                    Annual: <strong>{metrics.annualStorageTb} TB/yr</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Formulas: RPS = (DAU × Req/User)/86,400 • Peak = Avg × Multiplier
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Apply to Architecture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
