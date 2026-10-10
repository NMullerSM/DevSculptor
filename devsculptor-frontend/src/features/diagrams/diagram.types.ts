/**
 * Tipos de datos estrictos para el motor de diagramas nativo de DevSculptor.
 * Inspirado en la visualización interactiva por capas (Archify),
 * implementado con React + SVG puro sin scripts inline para estricto cumplimiento de CSP.
 */

export type DiagramKind = 'graph' | 'sequence';

export type DiagramCategory = 'platform' | 'project';

export type NodeStatus = 'ok' | 'warning' | 'info' | 'critical' | 'neutral';

export interface DiagramNodeMetric {
  label: string;
  value: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  subtitle?: string;
  group: 'frontend' | 'backend' | 'database' | 'ai' | 'security' | 'governance' | 'client' | 'external';
  badge?: string;
  icon?: string;
  status?: NodeStatus;
  metrics?: DiagramNodeMetric[];
  description?: string;
  details?: Record<string, string>;
  layer?: number; // Capa explícita para layout layered (opcional)
}

export type EdgeVariant = 'default' | 'accent' | 'warning' | 'dashed' | 'success';

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  protocol?: string; // ej: 'REST / HTTPS', 'PostgreSQL Wire', 'Internal RPC'
  animated?: boolean; // activa partículas SMIL animadas
  bidirectional?: boolean;
  variant?: EdgeVariant;
}

export interface GraphSpec {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  kind: 'graph';
  category: DiagramCategory;
  badge?: string;
  icon: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface SequenceParticipant {
  id: string;
  label: string;
  subtitle?: string;
  group: 'frontend' | 'backend' | 'database' | 'ai' | 'security' | 'governance' | 'client' | 'external';
  icon?: string;
}

export type SequenceMessageType = 'sync' | 'async' | 'return' | 'self';

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  detail?: string;
  type?: SequenceMessageType;
  badge?: string;
}

export interface SequenceSpec {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  kind: 'sequence';
  category: DiagramCategory;
  badge?: string;
  icon: string;
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
}

export type DiagramSpec = GraphSpec | SequenceSpec;

export interface ProjectDiagramContext {
  projectId: string;
  projectName?: string;
  architectureStyle?: string;
  reqsCount: number;
  adrsCount: number;
  adrsProposed: number;
  adrsAccepted: number;
  adrsRejected: number;
  tablesCount: number;
  tables: Array<{
    id: string;
    name: string;
    columns: Array<{ name: string; type: string; isPrimary?: boolean; isForeign?: boolean }>;
    foreignKeys?: Array<{ targetTable: string; targetColumn: string }>;
  }>;
}

export interface DiagramCatalogItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: DiagramCategory;
  kind: DiagramKind;
  badge: string;
  icon: string;
  getSpec: (context: ProjectDiagramContext) => DiagramSpec;
}
