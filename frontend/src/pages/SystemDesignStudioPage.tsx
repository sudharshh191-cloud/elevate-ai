import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderOpen,
  Sparkles,
  Calculator,
  ShieldAlert,
  RotateCcw,
  BookOpen,
  Loader2,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  ISystemDesignProblem,
  ISystemDesignNode,
  ISystemDesignEdge,
  ITrafficConfig,
  ICalculatedMetrics,
  ISystemDesignDiagram,
  ISystemDesignEvaluation,
  InterviewDomain,
  ExperienceLevel,
  InterviewFormat,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { SYSTEM_DESIGN_PROBLEMS } from '../data/systemDesignProblems';
import { IComponentDefinition } from '../data/architectureComponents';
import { ComponentPalette } from '../components/systemDesign/ComponentPalette';
import { ArchitectureCanvas } from '../components/systemDesign/ArchitectureCanvas';
import { NodeConfigPanel } from '../components/systemDesign/NodeConfigPanel';
import { TrafficCalculatorModal } from '../components/systemDesign/TrafficCalculatorModal';
import { ValidationWarningsModal } from '../components/systemDesign/ValidationWarningsModal';
import { EvaluationScorecardModal } from '../components/systemDesign/EvaluationScorecardModal';
import { SavedDesignsDrawer } from '../components/systemDesign/SavedDesignsDrawer';
import { ProblemRequirementsModal } from '../components/systemDesign/ProblemRequirementsModal';
import {
  calculateArchitectureMetrics,
  validateArchitectureGraph,
} from '../utils/systemDesignCalculations';
import { ApiService } from '../services/api';

interface SystemDesignStudioPageProps {
  onStartDesignMock?: (params: {
    domain: InterviewDomain;
    difficulty: ExperienceLevel;
    format: InterviewFormat;
    customTopicFocus?: string;
  }) => void;
}

export const SystemDesignStudioPage: React.FC<SystemDesignStudioPageProps> = () => {
  const { user, requireAuth } = useAuth();

  // Problem State
  const [selectedProblem, setSelectedProblem] = useState<ISystemDesignProblem>(SYSTEM_DESIGN_PROBLEMS[0]);

  // Diagram Graph State
  const [nodes, setNodes] = useState<ISystemDesignNode[]>([]);
  const [edges, setEdges] = useState<ISystemDesignEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Traffic & Calculation State
  const [trafficConfig, setTrafficConfig] = useState<ITrafficConfig>(selectedProblem.trafficAssumptions);
  const [metrics, setMetrics] = useState<ICalculatedMetrics>(
    calculateArchitectureMetrics(selectedProblem.trafficAssumptions)
  );

  // Persistence & Save State
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedDesigns, setSavedDesigns] = useState<ISystemDesignDiagram[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);

  // Modals & Drawers State
  const [isProblemModalOpen, setIsProblemModalOpen] = useState<boolean>(false);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<ISystemDesignEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial starter nodes for a problem
  const initializeStarterTopology = useCallback((problem: ISystemDesignProblem) => {
    const starterNodes: ISystemDesignNode[] = [
      {
        id: `node-client-${Date.now()}`,
        type: 'client',
        label: 'Web & Mobile Clients',
        position: { x: 80, y: 160 },
        data: { concurrency: 'High', network: 'HTTPS / WSS' },
      },
      {
        id: `node-lb-${Date.now() + 1}`,
        type: 'load_balancer',
        label: 'Layer 7 Load Balancer',
        position: { x: 300, y: 160 },
        data: { algorithm: 'Least Connections', healthCheckIntervalSec: 5 },
      },
      {
        id: `node-app-${Date.now() + 2}`,
        type: 'app_server',
        label: 'API Gateway / App Cluster',
        position: { x: 540, y: 160 },
        data: { instances: 8, framework: 'Node.js / Go' },
      },
      {
        id: `node-db-${Date.now() + 3}`,
        type: 'sql_db',
        label: 'Primary Database',
        position: { x: 780, y: 160 },
        data: { engine: 'PostgreSQL 16', readReplicas: 2, shardingKey: 'user_id' },
      },
    ];

    const starterEdges: ISystemDesignEdge[] = [
      {
        id: `edge-1-${Date.now()}`,
        source: starterNodes[0].id,
        target: starterNodes[1].id,
        protocol: 'HTTPS / TLS 1.3',
      },
      {
        id: `edge-2-${Date.now()}`,
        source: starterNodes[1].id,
        target: starterNodes[2].id,
        protocol: 'HTTP/2 Internal',
      },
      {
        id: `edge-3-${Date.now()}`,
        source: starterNodes[2].id,
        target: starterNodes[3].id,
        protocol: 'SQL Connection Pool',
      },
    ];

    setNodes(starterNodes);
    setEdges(starterEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setCurrentDiagramId(null);
    setEvaluationResult(null);
    setTrafficConfig(problem.trafficAssumptions);
    setMetrics(calculateArchitectureMetrics(problem.trafficAssumptions));
    setSaveStatus('idle');
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeStarterTopology(selectedProblem);
  }, []);

  // Fetch saved designs when user is logged in
  const fetchUserSavedDesigns = useCallback(async () => {
    if (!user) return;
    setIsLoadingSaved(true);
    try {
      const res = await ApiService.getSystemDesigns();
      setSavedDesigns(res.diagrams || []);
    } catch (err) {
      console.warn('Failed to load saved designs:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserSavedDesigns();
    }
  }, [user, fetchUserSavedDesigns]);

  // Handle Problem Change
  const handleSelectProblem = (problem: ISystemDesignProblem) => {
    setSelectedProblem(problem);
    initializeStarterTopology(problem);
  };

  // Add Component Node to Canvas
  const handleAddComponent = (compDef: IComponentDefinition) => {
    const newNode: ISystemDesignNode = {
      id: `node-${compDef.type}-${Date.now()}`,
      type: compDef.type,
      label: compDef.defaultLabel,
      position: {
        x: 400 + Math.floor(Math.random() * 80) - 40,
        y: 280 + Math.floor(Math.random() * 80) - 40,
      },
      data: { ...compDef.defaultData },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
  };

  // Move Node
  const handleMoveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, position } : n))
    );
  };

  // Add Edge Connection
  const handleAddEdge = (sourceId: string, targetId: string, protocol = 'HTTPS') => {
    const exists = edges.some((e) => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const newEdge: ISystemDesignEdge = {
      id: `edge-${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId,
      protocol,
    };

    setEdges((prev) => [...prev, newEdge]);
    setSelectedEdgeId(newEdge.id);
    setSelectedNodeId(null);
  };

  // Update Node data/label
  const handleUpdateNode = (nodeId: string, updates: Partial<ISystemDesignNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
    );
  };

  // Delete Node & its connected edges
  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  // Apply Traffic Config
  const handleApplyTraffic = (config: ITrafficConfig, calculated: ICalculatedMetrics) => {
    setTrafficConfig(config);
    setMetrics(calculated);
  };

  // Save Diagram to MongoDB Backend
  const handleSaveDiagram = async () => {
    requireAuth(async () => {
      setSaveStatus('saving');
      setErrorMessage(null);
      try {
        const payload = {
          title: `${selectedProblem.title} — Architecture`,
          templateId: selectedProblem.id,
          templateTitle: selectedProblem.title,
          difficulty: selectedProblem.difficulty,
          nodes,
          edges,
          trafficConfig,
          calculatedMetrics: metrics,
          evaluation: evaluationResult || undefined,
        };

        const res = await ApiService.saveSystemDesign(payload);
        if (res.diagram) {
          setCurrentDiagramId(res.diagram._id || res.diagram.id);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
          fetchUserSavedDesigns();
        }
      } catch (err: any) {
        console.error('Failed to save design:', err);
        setSaveStatus('error');
        setErrorMessage(err.message || 'Failed to save system design to backend.');
      }
    }, 'Save Architecture Diagram');
  };

  // Load Saved Diagram
  const handleLoadDiagram = (diagram: ISystemDesignDiagram) => {
    const templateId = (diagram as any).templateId || diagram.problemId;
    const prob = SYSTEM_DESIGN_PROBLEMS.find((p) => p.id === templateId) || SYSTEM_DESIGN_PROBLEMS[0];
    setSelectedProblem(prob);
    setNodes(diagram.nodes || []);
    setEdges(diagram.edges || []);
    if (diagram.trafficConfig) setTrafficConfig(diagram.trafficConfig);
    if (diagram.calculatedMetrics) setMetrics(diagram.calculatedMetrics);
    if (diagram.evaluation) setEvaluationResult(diagram.evaluation);
    setCurrentDiagramId(diagram._id || diagram.id || null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsSavedDrawerOpen(false);
  };

  // Delete Saved Diagram
  const handleDeleteSavedDiagram = async (diagramId: string) => {
    try {
      await ApiService.deleteSystemDesign(diagramId);
      setSavedDesigns((prev) => prev.filter((d) => (d._id || d.id) !== diagramId));
      if (currentDiagramId === diagramId) {
        setCurrentDiagramId(null);
      }
    } catch (err: any) {
      console.error('Failed to delete saved design:', err);
    }
  };

  // Evaluate Architecture via Gemini AI
  const handleEvaluateArchitecture = async () => {
    requireAuth(async () => {
      setIsEvaluating(true);
      setErrorMessage(null);

      try {
        const res = await ApiService.evaluateSystemDesign({
          problemTitle: selectedProblem.title,
          requirements: selectedProblem.description,
          nodes,
          edges,
          trafficConfig,
          calculatedMetrics: metrics,
          validationWarnings,
          diagramId: currentDiagramId || undefined,
        });

        if (res.evaluation) {
          setEvaluationResult(res.evaluation);
          setIsScorecardOpen(true);
        }
      } catch (err: any) {
        console.error('Architecture evaluation failed:', err);
        setErrorMessage(err.message || 'Architecture evaluation failed. Please try again.');
      } finally {
        setIsEvaluating(false);
      }
    }, 'Run AI Architecture Evaluation');
  };

  // Validation Warnings
  const validationWarnings = validateArchitectureGraph(nodes, edges, metrics, selectedProblem);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] min-h-[560px] space-y-3 select-none pb-2">
      {/* Top Engineering Control Ribbon */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Problem Selector & Requirements */}
        <div className="flex items-center gap-2.5">
          {/* Problem Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedProblem.id}
              onChange={(e) => {
                const p = SYSTEM_DESIGN_PROBLEMS.find((prob) => prob.id === e.target.value);
                if (p) handleSelectProblem(p);
              }}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer shadow-2xs"
            >
              {SYSTEM_DESIGN_PROBLEMS.map((prob) => (
                <option key={prob.id} value={prob.id}>
                  {prob.title} ({prob.difficulty} Tier)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Problem Requirements Modal Trigger */}
          <button
            onClick={() => setIsProblemModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Inspect Functional & Non-Functional SLAs"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Requirements SLA</span>
          </button>

          {/* Traffic Capacity Calculator Trigger */}
          <button
            onClick={() => setIsTrafficModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Capacity & Throughput Math Engine"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>{metrics.peakRps.toLocaleString()} Peak RPS</span>
          </button>

          {/* Warnings & Validation Pill */}
          <button
            onClick={() => setIsValidationModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              validationWarnings.some((w) => w.severity === 'error')
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : validationWarnings.length > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Inspect Deterministic Architecture Warnings"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {validationWarnings.length > 0
                ? `${validationWarnings.length} Alert${validationWarnings.length > 1 ? 's' : ''}`
                : 'Graph Validated'}
            </span>
          </button>
        </div>

        {/* Right: Actions (Save, My Designs, Reset, AI Evaluation) */}
        <div className="flex items-center gap-2">
          {/* Reset Starter Canvas */}
          <button
            onClick={() => initializeStarterTopology(selectedProblem)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="Reset to Starter Topology"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* My Saved Designs */}
          <button
            onClick={() => {
              requireAuth(() => {
                fetchUserSavedDesigns();
                setIsSavedDrawerOpen(true);
              }, 'View Saved Architecture Designs');
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>My Designs</span>
          </button>

          {/* Save Design */}
          <button
            onClick={handleSaveDiagram}
            disabled={saveStatus === 'saving'}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 hover:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Saved ✓</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Evaluate Architecture CTA */}
          <button
            onClick={handleEvaluateArchitecture}
            disabled={isEvaluating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating architecture...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Evaluate Architecture</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error / Alert Banner if any */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Workspace (3-Column Layout: Palette | Canvas | Node Config) */}
      <div className="flex-1 rounded-2xl bg-white border border-slate-200 overflow-hidden flex shadow-2xs relative">
        {/* Left Component Palette */}
        <ComponentPalette onAddComponent={handleAddComponent} />

        {/* Central Interactive Architecture Canvas (Dark Canvas with White Dots) */}
        <ArchitectureCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={setSelectedNodeId}
          onSelectEdge={setSelectedEdgeId}
          onMoveNode={handleMoveNode}
          onAddEdge={handleAddEdge}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
        />

        {/* Right Node Configuration Side-Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>

      {/* Problem Requirements Modal */}
      {isProblemModalOpen && (
        <ProblemRequirementsModal
          problem={selectedProblem}
          onClose={() => setIsProblemModalOpen(false)}
        />
      )}

      {/* Traffic Calculator Modal */}
      {isTrafficModalOpen && (
        <TrafficCalculatorModal
          initialConfig={trafficConfig}
          onApplyConfig={handleApplyTraffic}
          onClose={() => setIsTrafficModalOpen(false)}
        />
      )}

      {/* Validation Warnings Modal */}
      {isValidationModalOpen && (
        <ValidationWarningsModal
          warnings={validationWarnings}
          onClose={() => setIsValidationModalOpen(false)}
          onSelectComponent={(compId) => setSelectedNodeId(compId)}
        />
      )}

      {/* Saved Designs Drawer */}
      <SavedDesignsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedDesigns={savedDesigns}
        isLoading={isLoadingSaved}
        onLoadDesign={handleLoadDiagram}
        onDeleteDesign={handleDeleteSavedDiagram}
        onNewDesign={() => initializeStarterTopology(selectedProblem)}
      />

      {/* Gemini AI Evaluation Scorecard Modal */}
      {isScorecardOpen && evaluationResult && (
        <EvaluationScorecardModal
          evaluation={evaluationResult}
          problemTitle={selectedProblem.title}
          onClose={() => setIsScorecardOpen(false)}
        />
      )}
    </div>
  );
};
