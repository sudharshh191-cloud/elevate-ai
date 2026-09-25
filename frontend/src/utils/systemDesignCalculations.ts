import {
  ITrafficConfig,
  ICalculatedMetrics,
  ISystemDesignNode,
  ISystemDesignEdge,
  ISystemDesignValidation,
  ISystemDesignProblem,
} from '../types';

/**
 * Calculates deterministic traffic, bandwidth, and storage capacity metrics
 */
export function calculateArchitectureMetrics(config: ITrafficConfig): ICalculatedMetrics {
  const dau = Math.max(1, config.dau || 1000000);
  const requestsPerUser = Math.max(1, config.requestsPerUser || 10);
  const peakMultiplier = Math.max(1, config.peakMultiplier || 2.0);
  const readWriteRatio = Math.max(0.1, config.readWriteRatio || 5);
  const payloadSizeKb = Math.max(0.1, config.payloadSizeKb || 1);

  const totalDailyRequests = Math.round(dau * requestsPerUser);
  const avgRps = Math.round(totalDailyRequests / 86400);
  const peakRps = Math.round(avgRps * peakMultiplier);

  const totalRatioParts = readWriteRatio + 1;
  const readFraction = readWriteRatio / totalRatioParts;
  const writeFraction = 1 / totalRatioParts;

  const readRps = Math.round(peakRps * readFraction);
  const writeRps = Math.round(peakRps * writeFraction);

  // Bandwidth: (RPS * KB * 8 bits) / 1024 = Mbps
  const ingressBandwidthMbps = Number(((writeRps * payloadSizeKb * 8) / 1024).toFixed(2));
  const egressBandwidthMbps = Number(((readRps * payloadSizeKb * 8) / 1024).toFixed(2));

  // Storage: (Daily Writes * KB) / (1024 * 1024) = GB
  const dailyWrites = totalDailyRequests * writeFraction;
  const dailyStorageGb = Number(((dailyWrites * payloadSizeKb) / (1024 * 1024)).toFixed(2));

  // Annual storage with 3x replication factor in TB: (Daily GB * 365 * 3) / 1024 = TB
  const annualStorageTb = Number(((dailyStorageGb * 365 * 3) / 1024).toFixed(2));

  return {
    totalDailyRequests,
    avgRps,
    peakRps,
    readRps,
    writeRps,
    ingressBandwidthMbps,
    egressBandwidthMbps,
    dailyStorageGb,
    annualStorageTb,
  };
}

/**
 * Validates the architecture graph against best practices and identifies potential bottlenecks
 */
export function validateArchitectureGraph(
  nodes: ISystemDesignNode[],
  edges: ISystemDesignEdge[],
  metrics: ICalculatedMetrics,
  problem?: ISystemDesignProblem
): ISystemDesignValidation[] {
  const warnings: ISystemDesignValidation[] = [];

  if (!nodes || nodes.length === 0) {
    return [
      {
        severity: 'error',
        message: 'Architecture canvas is empty. Drag and drop components from the palette to start building.',
      },
    ];
  }

  const nodeTypes = new Set(nodes.map((n) => n.type));
  const connectedNodeIds = new Set<string>();
  const incomingCount: Record<string, number> = {};
  const outgoingCount: Record<string, number> = {};

  nodes.forEach((n) => {
    incomingCount[n.id] = 0;
    outgoingCount[n.id] = 0;
  });

  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
    if (outgoingCount[e.source] !== undefined) outgoingCount[e.source]++;
    if (incomingCount[e.target] !== undefined) incomingCount[e.target]++;
  });

  // 1. Check for completely disconnected nodes
  if (nodes.length > 1) {
    nodes.forEach((node) => {
      if (!connectedNodeIds.has(node.id)) {
        warnings.push({
          severity: 'warning',
          message: `Component '${node.label}' is disconnected from the architecture graph.`,
          componentId: node.id,
        });
      }
    });
  }

  // 2. Direct Client to Database Security Violation
  edges.forEach((edge) => {
    const src = nodes.find((n) => n.id === edge.source);
    const tgt = nodes.find((n) => n.id === edge.target);
    if (src && tgt) {
      if (src.type === 'client' && (tgt.type === 'sql_db' || tgt.type === 'nosql_db')) {
        warnings.push({
          severity: 'error',
          message: `Critical Security Risk: Direct connection from '${src.label}' to database '${tgt.label}'. Must route through an Application Server or API Gateway.`,
          componentId: tgt.id,
        });
      }
    }
  });

  // 3. High Traffic without Load Balancer
  if (metrics.peakRps > 500 && !nodeTypes.has('load_balancer') && !nodeTypes.has('api_gateway')) {
    warnings.push({
      severity: 'warning',
      message: `High peak traffic (${metrics.peakRps.toLocaleString()} RPS) lacks a Load Balancer or API Gateway to distribute requests across backend workers.`,
    });
  }

  // 4. Read-heavy traffic without Caching
  if (metrics.readRps > 1000 && !nodeTypes.has('cache') && !nodeTypes.has('redis_cluster')) {
    warnings.push({
      severity: 'warning',
      message: `Read-heavy workload (${metrics.readRps.toLocaleString()} Read RPS) has no In-Memory Cache (Redis/Memcached) to prevent database saturation.`,
    });
  }

  // 5. Database Single Point of Failure (SPOF)
  const dbNodes = nodes.filter((n) => n.type === 'sql_db');
  dbNodes.forEach((db) => {
    const readReplicas = db.data?.readReplicas || 0;
    if (metrics.peakRps > 2000 && readReplicas < 1) {
      warnings.push({
        severity: 'warning',
        message: `Primary SQL Database '${db.label}' has 0 configured read replicas under heavy peak load. Configure read replicas in the Node Properties panel.`,
        componentId: db.id,
      });
    }
  });

  // 6. Message Queue / Kafka with no consumer
  nodes.forEach((node) => {
    if (node.type === 'message_queue' || node.type === 'kafka_stream') {
      if (outgoingCount[node.id] === 0) {
        warnings.push({
          severity: 'warning',
          message: `Event Stream / Queue '${node.label}' has messages pushed to it but no downstream consumer service connected.`,
          componentId: node.id,
        });
      }
    }
  });

  // 7. CDN recommendation for media/static-heavy systems
  if (
    problem &&
    ['instagram-feed', 'video-streaming', 'ecommerce-platform'].includes(problem.id) &&
    !nodeTypes.has('cdn')
  ) {
    warnings.push({
      severity: 'info',
      message: `Recommendation: For ${problem.title}, consider adding a Global CDN Edge tier to cache media assets and reduce origin server egress bandwidth.`,
    });
  }

  return warnings;
}
