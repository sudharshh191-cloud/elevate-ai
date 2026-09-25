import React from 'react';
import { X, Trash2, Sliders, Server, Database, Zap, Globe, Radio } from 'lucide-react';
import { ISystemDesignNode } from '../../types';
import { ARCHITECTURE_COMPONENTS } from '../../data/architectureComponents';

interface NodeConfigPanelProps {
  node: ISystemDesignNode | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<ISystemDesignNode>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onClose,
  onUpdateNode,
  onDeleteNode,
}) => {
  if (!node) return null;

  const componentDef = ARCHITECTURE_COMPONENTS.find((c) => c.type === node.type);
  const data = node.data || {};

  const handleDataChange = (key: string, value: any) => {
    onUpdateNode(node.id, {
      data: {
        ...data,
        [key]: value,
      },
    });
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(node.id, { label: e.target.value });
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden select-none animate-in slide-in-from-right duration-200 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Node Configuration</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Component Identity */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-indigo-700 font-bold">
              {componentDef?.name || node.type}
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: {node.id.slice(0, 8)}</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Display Label</label>
            <input
              type="text"
              value={node.label}
              onChange={handleLabelChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium shadow-2xs"
            />
          </div>
        </div>

        {/* Dynamic Type-Specific Controls */}
        {node.type === 'load_balancer' && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Balancer Parameters</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Balancing Algorithm</label>
              <select
                value={data.algorithm || 'Round Robin'}
                onChange={(e) => handleDataChange('algorithm', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              >
                <option value="Round Robin">Round Robin</option>
                <option value="Least Connections">Least Connections</option>
                <option value="IP Hash">IP Hash (Sticky Session)</option>
                <option value="Weighted Response Time">Weighted Response Time</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Health Check Interval (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={data.healthCheckIntervalSec || 5}
                onChange={(e) => handleDataChange('healthCheckIntervalSec', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}

        {(node.type === 'sql_db' || node.type === 'nosql_db') && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Database & Replication Tier</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Engine & Version</label>
              <input
                type="text"
                value={data.engine || (node.type === 'sql_db' ? 'PostgreSQL 16' : 'DynamoDB / Cassandra')}
                onChange={(e) => handleDataChange('engine', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            {node.type === 'sql_db' && (
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 font-medium">Read Replicas Count</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={data.readReplicas ?? 2}
                  onChange={(e) => handleDataChange('readReplicas', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Partitioning / Sharding Key</label>
              <input
                type="text"
                value={data.shardingKey || data.partitionKey || 'user_id (Hash)'}
                onChange={(e) => handleDataChange('shardingKey', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}

        {(node.type === 'cache' || node.type === 'redis_cluster') && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-600" />
              <span>Caching & Eviction Policy</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Eviction Policy</label>
              <select
                value={data.evictionPolicy || 'allkeys-lru (Least Recently Used)'}
                onChange={(e) => handleDataChange('evictionPolicy', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              >
                <option value="allkeys-lru (Least Recently Used)">allkeys-lru (Least Recently Used)</option>
                <option value="allkeys-lfu (Least Frequently Used)">allkeys-lfu (Least Frequently Used)</option>
                <option value="volatile-ttl (TTL Expiration)">volatile-ttl (TTL Expiration)</option>
                <option value="noeviction">noeviction (Reject on Full)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Cache TTL (seconds)</label>
              <input
                type="number"
                min="10"
                max="604800"
                value={data.ttlSeconds || 3600}
                onChange={(e) => handleDataChange('ttlSeconds', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Memory Capacity (GB)</label>
              <input
                type="number"
                min="1"
                max="512"
                value={data.memoryCapacityGb || 32}
                onChange={(e) => handleDataChange('memoryCapacityGb', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}

        {(node.type === 'message_queue' || node.type === 'kafka_stream') && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-lime-600" />
              <span>Queue & Partition Settings</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Partition Count</label>
              <input
                type="number"
                min="1"
                max="256"
                value={data.partitions || 16}
                onChange={(e) => handleDataChange('partitions', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Retention Period (days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={data.retentionDays || 7}
                onChange={(e) => handleDataChange('retentionDays', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}

        {node.type === 'cdn' && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span>CDN Edge Caching</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 font-medium">Edge TTL (seconds)</label>
              <input
                type="number"
                min="60"
                max="2592000"
                value={data.cacheTtlSeconds || 86400}
                onChange={(e) => handleDataChange('cacheTtlSeconds', Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Position coordinates */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span>Position:</span>
          <span>X: {Math.round(node.position.x)}, Y: {Math.round(node.position.y)}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => onDeleteNode(node.id)}
          className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Component</span>
        </button>
      </div>
    </div>
  );
};
