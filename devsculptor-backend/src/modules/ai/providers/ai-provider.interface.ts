export interface AiProjectContext {
  projectName: string;
  projectDescription?: string;
  organization?: string;
  leadArchitect?: string;
  architectureStyle: string;
  requirements: Array<{
    code: string;
    title: string;
    type: string;
    priority: string;
    description?: string;
    entityRelation?: string[];
  }>;
  entities: Array<{
    tableName: string;
    columns: Array<Record<string, unknown>>;
  }>;
  decisions: Array<{
    code: string;
    title: string;
    status: string;
    context?: string;
    decision?: string;
  }>;
  okfDocuments?: Array<{
    canonicalPath: string;
    title: string;
    documentType: string;
    preview: string;
    contentMarkdown?: string;
  }>;
  nextRfCode?: string;
  nextRnfCode?: string;
  nextAdrCode?: string;
}

export interface AiSuggestedRequirement {
  code: string;
  title: string;
  type: 'RF' | 'RNF';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  entityRelation?: string[];
}

export interface AiSuggestedEntity {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    nullable?: boolean;
    unique?: boolean;
    referencesTable?: string;
    referencesColumn?: string;
    cardinality?: '1:1' | '1:N' | 'N:M';
  }>;
}

export interface AiSuggestedDecision {
  code: string;
  title: string;
  context: string;
  decision: string;
  consequences?: string;
}

export interface AiSuggestedDiagram {
  code?: string;
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
    columns: Array<{
      name: string;
      type: string;
      isPk?: boolean;
      isFk?: boolean;
      nullable?: boolean;
      unique?: boolean;
      referencesTable?: string;
      referencesColumn?: string;
      cardinality?: '1:1' | '1:N' | 'N:M';
    }>;
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

export interface AiChatResult {
  content: string;
  reply?: string;
  provider: string;
  model: string;
  actions?: {
    requirements?: AiSuggestedRequirement[];
    entities?: AiSuggestedEntity[];
    decisions?: AiSuggestedDecision[];
    diagrams?: AiSuggestedDiagram[];
    mutatedEntities?: AiEntityMutation[];
    mutatedRequirements?: AiRequirementMutation[];
    mutatedDecisions?: AiDecisionMutation[];
    mutatedDiagrams?: AiDiagramMutation[];
  };
  suggestedRequirements?: AiSuggestedRequirement[];
  suggestedEntities?: AiSuggestedEntity[];
  suggestedDecisions?: AiSuggestedDecision[];
  suggestedDiagrams?: AiSuggestedDiagram[];
  mutatedEntities?: AiEntityMutation[];
  mutatedRequirements?: AiRequirementMutation[];
  mutatedDecisions?: AiDecisionMutation[];
  mutatedDiagrams?: AiDiagramMutation[];
}

export interface IAiProvider {
  name: string;
  generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    options?: { temperature?: number; actionContext?: string }
  ): Promise<AiChatResult>;

  analyzeSchema(
    context: AiProjectContext
  ): Promise<AiChatResult>;

  suggestRequirements(
    userPrompt: string,
    context: AiProjectContext
  ): Promise<AiChatResult>;
}

export interface UserAiOverride {
  apiKey?: string;
  provider?: string;
  model?: string;
  baseUrl?: string;
}
