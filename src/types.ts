export type TrafficCategory =
  | 'BENIGN'
  | 'DoS-Hulk'
  | 'DoS-GoldenEye'
  | 'DDoS-LOIC'
  | 'PortScan'
  | 'SSH-BruteForce'
  | 'FTP-Patator'
  | 'Botnet-Ares'
  | 'WebAttack-SQLi';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'Info';

export type AlertStatus = 'New' | 'Under Review' | 'Investigated' | 'Closed';

export interface NetworkFlowRecord {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  flowDurationMs: number;
  totalFwdPackets: number;
  totalBwdPackets: number;
  totalFwdBytes: number;
  totalBwdBytes: number;
  flowBytesPerSec: number;
  flowPacketsPerSec: number;
  fwdIatMeanMs: number;
  bwdIatMeanMs: number;
  finFlags: number;
  synFlags: number;
  rstFlags: number;
  pshFlags: number;
  ackFlags: number;
  predictedCategory: TrafficCategory;
  confidence: number; // 0.0 - 1.0
  riskLevel: RiskLevel;
  status: AlertStatus;
  notes?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  category: TrafficCategory;
  severity: RiskLevel;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  confidence: number;
  status: AlertStatus;
  description: string;
  recommendation: string;
  mitreTechnique: string;
  investigationNotes: string[];
}

export type NodeType =
  | 'gateway'
  | 'firewall'
  | 'router'
  | 'server'
  | 'database'
  | 'workstation'
  | 'iot';

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  ip: string;
  status: 'normal' | 'suspicious' | 'critical' | 'offline';
  connections: number;
  bandwidthMbps: number;
  packetsInPerSec: number;
  packetsOutPerSec: number;
  activeThreatCount: number;
  position: [number, number, number];
  description: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  status: 'normal' | 'suspicious' | 'critical' | 'inactive';
  protocol: string;
  bandwidthMbps: number;
  packetRate: number;
}

export interface SensorProbe {
  id: string;
  name: string;
  region: string;
  location: string;
  lat: number;
  lng: number;
  ip: string;
  status: 'operational' | 'warning' | 'critical';
  latencyMs: number;
  packetRateKpps: number;
  threatsDetected: number;
  lastHeartbeat: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  alertContextId?: string;
  isStreaming?: boolean;
}

export interface AnalysisSession {
  id: string;
  datasetName: string;
  timestamp: string;
  recordCount: number;
  normalCount: number;
  suspiciousCount: number;
  criticalCount: number;
  accuracyEstimate: number;
  modelVersion: string;
  records: NetworkFlowRecord[];
}

export interface ModelMetrics {
  name: string;
  version: string;
  dataset: string;
  trainingDate: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  confusionMatrix: {
    trueNormal: number;
    falsePositive: number;
    falseNegative: number;
    trueAttack: number;
  };
  featureImportance: { feature: string; weight: number }[];
}
