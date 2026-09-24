export type OkfDocumentType =
  | 'PROJECT_CONTEXT'
  | 'REQUIREMENT_SPEC'
  | 'DECISION_ADR'
  | 'DATABASE_SCHEMA'
  | 'AGENT_SKILL'
  | 'KNOWLEDGE_BASE'
  | 'ARCHITECTURE_PATTERN'
  | 'DOCUMENT_TEMPLATE';

export type OkfFreshnessStatus = 'FRESH' | 'STALE' | 'DRIFT_DETECTED';

export interface OkfDocumentRecord {
  id: string;
  project_id: string;
  document_id: string;
  document_type: OkfDocumentType;
  canonical_path: string;
  title: string;
  tags: string[];
  content_preview: string | null;
  state_hash: string;
  freshness_status: OkfFreshnessStatus;
  storage_path: string | null;
  verified_by: string | null;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface VaultStats {
  total: number;
  fresh_count: number;
  stale_count: number;
  drift_count: number;
}

export interface ConvertDocumentPayload {
  rawContent: string;
  title?: string;
  documentType?: OkfDocumentType;
  targetCategory: 'knowledge-base' | 'patterns' | 'templates';
  tags: string[];
  author?: string;
}

export interface AiConvertDocumentPayload {
  rawContent: string;
  contextHint?: string;
  targetCategory: 'knowledge-base' | 'patterns' | 'templates';
  suggestedTags?: string[];
}

export interface ConvertedOkfResponse {
  documentId: string;
  documentType: OkfDocumentType;
  canonicalPath: string;
  title: string;
  tags: string[];
  contentPreview: string;
  stateHash: string;
  compiledMarkdown: string;
  freshnessStatus: OkfFreshnessStatus;
}

export interface SyncVaultItemPayload {
  documentId: string;
  documentType: OkfDocumentType;
  canonicalPath: string;
  title: string;
  tags: string[];
  contentPreview?: string | null;
  stateHash: string;
  freshnessStatus: OkfFreshnessStatus;
  storagePath?: string | null;
  verifiedBy?: string | null;
}

export interface SyncVaultResponse {
  syncedCount: number;
  documents: OkfDocumentRecord[];
  stats: VaultStats;
}
