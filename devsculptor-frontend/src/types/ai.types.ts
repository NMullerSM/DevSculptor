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

export type EntityActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ColumnMutation {
  type: 'ADD' | 'MODIFY' | 'DROP';
  column: {
    name: string;
    type?: string;
    isPk?: boolean;
    isFk?: boolean;
    referencesTable?: string;
    referencesColumn?: string;
    cardinality?: '1:1' | '1:N' | 'N:M';
    nullable?: boolean;
    unique?: boolean;
  };
  previousColumnName?: string;
}

export interface AiEntityMutation {
  action: EntityActionType;
  targetTableName: string;
  renameTableTo?: string;
  rationale: string;
  columnMutations?: ColumnMutation[];
  newSchemaPreview?: {
    tableName: string;
    columns: AiSuggestedColumn[];
  };
}

export interface AiRequirementMutation {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetCode: string;
  rationale: string;
  updatedFields?: Partial<AiSuggestedRequirement>;
}

export interface AiDecisionMutation {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetCode: string;
  rationale: string;
  updatedFields?: Partial<AiSuggestedDecision>;
}

export interface AiDiagramMutation {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetCode?: string;
  targetTitle?: string;
  rationale: string;
  updatedFields?: Partial<AiSuggestedDiagram>;
}

export interface DevSculptorActions {
  requirements?: AiSuggestedRequirement[];
  entities?: AiSuggestedEntity[];
  decisions?: AiSuggestedDecision[];
  diagrams?: AiSuggestedDiagram[];
  mutatedEntities?: AiEntityMutation[];
  mutatedRequirements?: AiRequirementMutation[];
  mutatedDecisions?: AiDecisionMutation[];
  mutatedDiagrams?: AiDiagramMutation[];
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
  mutatedEntities?: AiEntityMutation[];
  mutatedRequirements?: AiRequirementMutation[];
  mutatedDecisions?: AiDecisionMutation[];
  mutatedDiagrams?: AiDiagramMutation[];
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
