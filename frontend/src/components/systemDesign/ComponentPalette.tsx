import React, { useState } from 'react';
import {
  Smartphone,
  GitMerge,
  ShieldCheck,
  Globe,
  Server,
  Cpu,
  Boxes,
  KeyRound,
  BellRing,
  Database,
  Layers,
  HardDrive,
  Search,
  Zap,
  Flame,
  Radio,
  Activity,
  Plus,
  Search as SearchIcon,
} from 'lucide-react';
import { ARCHITECTURE_COMPONENTS, IComponentDefinition } from '../../data/architectureComponents';

interface ComponentPaletteProps {
  onAddComponent: (component: IComponentDefinition) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const getIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className={className} />;
      case 'GitMerge':
        return <GitMerge className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Server':
        return <Server className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Boxes':
        return <Boxes className={className} />;
      case 'KeyRound':
        return <KeyRound className={className} />;
      case 'BellRing':
        return <BellRing className={className} />;
      case 'Database':
        return <Database className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'HardDrive':
        return <HardDrive className={className} />;
      case 'Search':
        return <Search className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      default:
        return <Boxes className={className} />;
    }
  };

  const categories = ['All', 'Clients & Gateways', 'Compute & Services', 'Databases & Storage', 'Caching & Queues'];

  const filteredComponents = ARCHITECTURE_COMPONENTS.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || comp.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-indigo-600" />
            <span>Architecture Palette</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold shadow-2xs">
            {ARCHITECTURE_COMPONENTS.length} Nodes
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer font-medium ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? 'All' : cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.map((comp) => (
          <div
            key={comp.type}
            onClick={() => onAddComponent(comp)}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer group flex items-start gap-2.5 shadow-2xs"
          >
            <div className={`p-2 rounded-lg bg-white border border-slate-200 shrink-0 ${comp.colorClass} shadow-2xs`}>
              {getIcon(comp.iconName, 'w-4 h-4')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                  {comp.name}
                </span>
                <button
                  className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all opacity-0 group-hover:opacity-100 shadow-2xs"
                  title="Add to Canvas"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">{comp.description}</p>
            </div>
          </div>
        ))}

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No components match "{searchQuery}"
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 text-center font-medium">
        Click any component to drop it onto the canvas.
      </div>
    </div>
  );
};
