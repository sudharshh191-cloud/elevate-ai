import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link as LinkIcon,
  Move,
} from 'lucide-react';
import { ISystemDesignNode, ISystemDesignEdge } from '../../types';
import { ARCHITECTURE_COMPONENTS } from '../../data/architectureComponents';

interface ArchitectureCanvasProps {
  nodes: ISystemDesignNode[];
  edges: ISystemDesignEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onAddEdge: (sourceId: string, targetId: string, protocol?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connection Mode State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getComponentDef = (type: string) => {
    return ARCHITECTURE_COMPONENTS.find((c) => c.type === type);
  };

  const getIcon = (iconName?: string, className = 'w-4 h-4') => {
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

  // Keyboard Delete listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        if (selectedNodeId) {
          onDeleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          onDeleteEdge(selectedEdgeId);
        }
      } else if (e.key === 'Escape') {
        setConnectingSourceId(null);
        onSelectNode(null);
        onSelectEdge(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, onDeleteNode, onDeleteEdge, onSelectNode, onSelectEdge]);

  // Handle Mouse Down on Node (Start Drag)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // If in connecting mode and this is the target
    if (connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        // Determine protocol based on source and target types
        const srcNode = nodes.find((n) => n.id === connectingSourceId);
        const tgtNode = nodes.find((n) => n.id === nodeId);
        let proto = 'HTTPS';
        if (tgtNode?.type === 'sql_db' || tgtNode?.type === 'nosql_db') proto = 'SQL / Query';
        else if (tgtNode?.type === 'cache' || tgtNode?.type === 'redis_cluster') proto = 'Redis Protocol';
        else if (tgtNode?.type === 'message_queue' || tgtNode?.type === 'kafka_stream') proto = 'Async Event';
        else if (srcNode?.type === 'app_server' && tgtNode?.type === 'microservice') proto = 'gRPC';
        else if (srcNode?.type === 'client' && tgtNode?.type === 'web_server') proto = 'WSS / HTTP';

        onAddEdge(connectingSourceId, nodeId, proto);
      }
      setConnectingSourceId(null);
      return;
    }

    onSelectNode(nodeId);
    onSelectEdge(null);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - panOffset.y) / zoom;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseCanvasX - node.position.x,
      y: mouseCanvasY - node.position.y,
    });
  };

  // Handle Canvas Background Mouse Down (Start Pan)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectNode(null);
      onSelectEdge(null);
      setConnectingSourceId(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // Handle Global Mouse Move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - panOffset.x) / zoom;
      const canvasY = (e.clientY - rect.top - panOffset.y) / zoom;

      setMousePos({ x: canvasX, y: canvasY });

      if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (draggingNodeId) {
        onMoveNode(draggingNodeId, {
          x: Math.max(20, Math.round(canvasX - dragOffset.x)),
          y: Math.max(20, Math.round(canvasY - dragOffset.y)),
        });
      }
    },
    [isPanning, panStart, draggingNodeId, panOffset, zoom, dragOffset, onMoveNode]
  );

  // Handle Global Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Start Connection Mode
  const handleStartConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingSourceId(nodeId);
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 40, y: 40 });
  };

  const NODE_WIDTH = 190;
  const NODE_HEIGHT = 74;

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full overflow-hidden cursor-crosshair select-none bg-[#0B0F19]"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.16) 1.25px, transparent 1.25px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      {/* Top Floating Help Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl border backdrop-blur-md text-[11px] flex items-center gap-2 font-medium bg-slate-900/90 border-slate-800 text-slate-300 shadow-lg">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {connectingSourceId
              ? 'Click target component to establish connection'
              : 'Drag nodes • Click node handle to connect • Backspace to delete'}
          </span>
        </div>

        {connectingSourceId && (
          <button
            onClick={() => setConnectingSourceId(null)}
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer shadow-sm bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900"
          >
            Cancel Connect
          </button>
        )}
      </div>

      {/* Floating Canvas Zoom Toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl border backdrop-blur-md shadow-xl bg-slate-900/90 border-slate-800 text-slate-300">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono px-1 font-bold text-slate-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 mx-1 bg-slate-800" />
        <button
          onClick={handleResetZoom}
          className="p-2 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Workspace Container */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Edges Layer */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
          <defs>
            {/* Arrow Marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#818CF8" />
            </marker>
            <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
          </defs>

          {/* Active Connecting Drag Line */}
          {connectingSourceId && (
            (() => {
              const srcNode = nodes.find((n) => n.id === connectingSourceId);
              if (!srcNode) return null;
              const sx = srcNode.position.x + NODE_WIDTH / 2;
              const sy = srcNode.position.y + NODE_HEIGHT / 2;
              return (
                <line
                  x1={sx}
                  y1={sy}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#818CF8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              );
            })()
          )}

          {/* Established Edges */}
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;

            const sx = src.position.x + NODE_WIDTH / 2;
            const sy = src.position.y + NODE_HEIGHT / 2;
            const tx = tgt.position.x + NODE_WIDTH / 2;
            const ty = tgt.position.y + NODE_HEIGHT / 2;

            // Calculate Bezier curve midpoint
            const dx = tx - sx;
            const dy = ty - sy;
            const cx1 = sx + dx * 0.4;
            const cy1 = sy;
            const cx2 = tx - dx * 0.4;
            const cy2 = ty;

            const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;

            const isSelected = selectedEdgeId === edge.id;

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                onSelectEdge(edge.id);
                onSelectNode(null);
              }}>
                {/* Thick clickable hit area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />

                {/* Visible Edge Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#38BDF8' : '#818CF8'}
                  strokeWidth={isSelected ? '3.5' : '2'}
                  strokeDasharray={isSelected ? 'none' : '6 4'}
                  markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
                />

                {/* Protocol Badge on Edge */}
                {edge.protocol && (
                  <foreignObject
                    x={midX - 45}
                    y={midY - 12}
                    width="90"
                    height="24"
                    className="overflow-visible pointer-events-none"
                  >
                    <div
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border text-center truncate ${
                        isSelected
                          ? 'bg-sky-950/95 text-sky-300 border-sky-400 shadow-sm'
                          : 'bg-slate-900/95 text-indigo-300 border-indigo-500/40 shadow-sm'
                      }`}
                    >
                      {edge.protocol}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const compDef = getComponentDef(node.type);
          const isSelected = selectedNodeId === node.id;
          const isConnectingSource = connectingSourceId === node.id;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                width: `${NODE_WIDTH}px`,
              }}
              className={`absolute top-0 left-0 p-3 rounded-2xl border backdrop-blur-md transition-all cursor-grab active:cursor-grabbing pointer-events-auto group ${
                isSelected
                  ? 'bg-slate-900/95 border-indigo-500 shadow-2xl ring-2 ring-indigo-500/30'
                  : isConnectingSource
                  ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-400/40 animate-pulse'
                  : 'bg-slate-900/95 border-slate-800 hover:border-slate-700 hover:shadow-xl shadow-lg'
              }`}
            >
              {/* Header Icon + Label */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl shrink-0 bg-slate-950/80 border border-slate-800 ${compDef?.colorClass || 'text-indigo-400'}`}
                >
                  {getIcon(compDef?.iconName, 'w-4 h-4')}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-white">
                    {node.label}
                  </div>
                  <div className="text-[10px] font-mono truncate text-slate-400">
                    {compDef?.name || node.type}
                  </div>
                </div>
              </div>

              {/* Node Handle Button (Connect) */}
              <button
                onClick={(e) => handleStartConnection(e, node.id)}
                className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isConnectingSource
                    ? 'bg-indigo-600 text-white border-indigo-400 scale-110 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 hover:scale-110 opacity-0 group-hover:opacity-100 shadow-sm'
                }`}
                title="Click to Connect with another node"
              >
                <LinkIcon className="w-3 h-3" />
              </button>

              {/* Delete Quick Button on Node */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full border opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-700"
                title="Delete Node"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
