import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDiagramNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
}

export interface IDiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string; // HTTP, gRPC, WebSocket, TCP, Async Queue, SQL/Query, Redis Protocol
}

export interface ITrafficConfig {
  dau: number;
  requestsPerUser: number;
  peakMultiplier: number;
  readWriteRatio: number; // e.g. 10 (10:1 read to write)
  payloadSizeKb: number;
}

export interface ICalculatedMetrics {
  totalDailyRequests: number;
  avgRps: number;
  peakRps: number;
  readRps: number;
  writeRps: number;
  ingressBandwidthMbps: number;
  egressBandwidthMbps: number;
  dailyStorageGb: number;
  annualStorageTb: number;
}

export interface ISystemDesignDiagram extends Document {
  userId: Types.ObjectId;
  problemId: string;
  templateTitle: string;
  domain: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff';
  trafficEstimation?: string;
  trafficConfig?: ITrafficConfig;
  calculatedMetrics?: ICalculatedMetrics;
  nodes: IDiagramNode[];
  edges: IDiagramEdge[];
  components: string[];
  notes?: string;
  validationResults?: Array<{ severity: 'error' | 'warning' | 'info'; message: string; componentId?: string }>;
  evaluation?: Record<string, any>;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SystemDesignDiagramSchema = new Schema<ISystemDesignDiagram>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: String, default: 'url-shortener', index: true },
    templateTitle: { type: String, required: true, index: true },
    domain: { type: String, default: 'System Design' },
    difficulty: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Staff'],
      default: 'Senior',
    },
    trafficEstimation: String,
    trafficConfig: {
      dau: { type: Number, default: 10000000 },
      requestsPerUser: { type: Number, default: 20 },
      peakMultiplier: { type: Number, default: 2.5 },
      readWriteRatio: { type: Number, default: 10 },
      payloadSizeKb: { type: Number, default: 2 },
    },
    calculatedMetrics: {
      totalDailyRequests: Number,
      avgRps: Number,
      peakRps: Number,
      readRps: Number,
      writeRps: Number,
      ingressBandwidthMbps: Number,
      egressBandwidthMbps: Number,
      dailyStorageGb: Number,
      annualStorageTb: Number,
    },
    nodes: [
      {
        id: { type: String, required: true },
        type: { type: String, default: 'custom' },
        label: { type: String, required: true },
        position: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
        },
        data: { type: Schema.Types.Mixed },
      },
    ],
    edges: [
      {
        id: { type: String, required: true },
        source: { type: String, required: true },
        target: { type: String, required: true },
        label: String,
        protocol: String,
      },
    ],
    components: [String],
    notes: String,
    validationResults: [
      {
        severity: { type: String, enum: ['error', 'warning', 'info'], default: 'warning' },
        message: String,
        componentId: String,
      },
    ],
    evaluation: { type: Schema.Types.Mixed },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SystemDesignDiagramSchema.index({ userId: 1, createdAt: -1 });
SystemDesignDiagramSchema.index({ userId: 1, problemId: 1 });

export const SystemDesignDiagram = mongoose.model<ISystemDesignDiagram>(
  'SystemDesignDiagram',
  SystemDesignDiagramSchema
);
