import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ISystemDesignValidation } from '../../types';

interface ValidationWarningsModalProps {
  warnings: ISystemDesignValidation[];
  onClose: () => void;
  onSelectComponent?: (componentId: string) => void;
}

export const ValidationWarningsModal: React.FC<ValidationWarningsModalProps> = ({
  warnings,
  onClose,
  onSelectComponent,
}) => {
  const errors = warnings.filter((w) => w.severity === 'error');
  const warningList = warnings.filter((w) => w.severity === 'warning');
  const infos = warnings.filter((w) => w.severity === 'info');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Deterministic Architecture Validation</h2>
              <p className="text-[11px] text-slate-500">
                Automated graph analysis for single points of failure, bottlenecks, and security rules
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {warnings.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Critical Issues Detected</h3>
                <p className="text-xs text-slate-500">
                  Your architecture graph satisfies baseline distributed system best practices.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Errors */}
              {errors.map((item, idx) => (
                <div
                  key={`err-${idx}`}
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-rose-700 font-mono tracking-wider block">
                      Critical Risk
                    </span>
                    <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">{item.message}</p>
                    {item.componentId && onSelectComponent && (
                      <button
                        onClick={() => {
                          onSelectComponent(item.componentId!);
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                      >
                        Inspect Affected Node →
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Warnings */}
              {warningList.map((item, idx) => (
                <div
                  key={`warn-${idx}`}
                  className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-700 font-mono tracking-wider block">
                      Architecture Warning
                    </span>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">{item.message}</p>
                    {item.componentId && onSelectComponent && (
                      <button
                        onClick={() => {
                          onSelectComponent(item.componentId!);
                          onClose();
                        }}
                        className="mt-2 text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                      >
                        Inspect Affected Node →
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Info / Best practices */}
              {infos.map((item, idx) => (
                <div
                  key={`info-${idx}`}
                  className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-start gap-3"
                >
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-sky-700 font-mono tracking-wider block">
                      Best Practice Recommendation
                    </span>
                    <p className="text-xs text-sky-900 mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {errors.length} Critical • {warningList.length} Warnings • {infos.length} Suggestions
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
