import React from 'react';
import { X, FolderOpen, Trash2, Calendar, Layers, Activity, Plus, ArrowRight } from 'lucide-react';
import { ISystemDesignDiagram } from '../../types';

interface SavedDesignsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedDesigns: ISystemDesignDiagram[];
  isLoading: boolean;
  onLoadDesign: (design: ISystemDesignDiagram) => void;
  onDeleteDesign: (designId: string) => void;
  onNewDesign: () => void;
}

export const SavedDesignsDrawer: React.FC<SavedDesignsDrawerProps> = ({
  isOpen,
  onClose,
  savedDesigns,
  isLoading,
  onLoadDesign,
  onDeleteDesign,
  onNewDesign,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Saved Architecture Designs</h2>
              <p className="text-[11px] text-slate-500">Saved in your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <button
            onClick={() => {
              onNewDesign();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Canvas Diagram</span>
          </button>
        </div>

        {/* List of Designs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading your saved architectures...</p>
            </div>
          ) : savedDesigns.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No saved architecture designs yet.</p>
              <p className="text-[11px] text-slate-500">Save your current canvas to access it later.</p>
            </div>
          ) : (
            savedDesigns.map((item) => {
              const nodeCount = item.nodes?.length || 0;
              const edgeCount = item.edges?.length || 0;
              const dateStr = item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div
                  key={item._id || item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all space-y-3 group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {item.templateTitle}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="text-indigo-700 font-semibold">{item.difficulty} Tier</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteDesign((item._id || item.id)!)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-2xs"
                      title="Delete Design"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
                      <span>{nodeCount} Nodes</span>
                      <span>{edgeCount} Edges</span>
                      {item.evaluation && (
                        <span className="text-emerald-700 font-bold font-mono">
                          Score: {item.evaluation.overallScore}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onLoadDesign(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 border border-slate-200 text-slate-700 hover:text-white font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
