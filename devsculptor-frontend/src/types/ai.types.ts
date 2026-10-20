export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiSuggestedRequirement {
  code: string;
  title: string;
  type: 'RF' | 'RNF';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  entityRelation?: string[];
}

export interface AiSuggestedColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isPk?: boolean;
  isFk?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: string;
  referencesTable?: string;
  referencesColumn?: string;
  cardinality?: '1:1' | '1:N' | 'N:M';
  defaultValue?: string;
  description?: string;
}

export interface AiSuggestedEntity {
  tableName: string;
  columns: AiSuggestedColumn[];
  description?: string;
}

export interface AiSuggestedDecision {
  code: string;
  title: string;
  status: 'ACCEPTED' | 'PROPOSED' | 'REJECTED';
  context?: string;
  decision?: string;
  consequences?: string;
}

export interface AiSuggestedDiagram {
  code: string;
  title: string;
  type: 'class' | 'sequence' | 'er' | 'state' | 'c4' | 'deployment' | 'activity' | 'flowchart';
  format: 'mermaid';
  mermaidCode: string;
  description?: string;
}

export interface DevSculptorActions {
  requirements?: AiSuggestedRequirement[];
  entities?: AiSuggestedEntity[];
  decisions?: AiSuggestedDecision[];
  diagrams?: AiSuggestedDiagram[];
}

export interface AiChatResult {
  reply: string;
  content?: string;
  provider: string;
  model?: string;
  actions?: DevSculptorActions;
  suggestedRequirements?: AiSuggestedRequirement[];
  suggestedEntities?: AiSuggestedEntity[];
  suggestedDecisions?: AiSuggestedDecision[];
  suggestedDiagrams?: AiSuggestedDiagram[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  actions?: DevSculptorActions;
  timestamp: number;
}

export interface SendChatMessagePayload {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  actionContext?: string;
}

export interface SuggestRequirementsPayload {
  prompt: string;
}
