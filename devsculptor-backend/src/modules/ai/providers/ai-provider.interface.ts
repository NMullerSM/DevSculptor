export interface AiProjectContext {
  projectName: string;
  projectDescription?: string;
  architectureStyle: string;
  requirements: Array<{
    code: string;
    title: string;
    type: string;
    priority: string;
    description?: string;
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
}

export interface AiSuggestedRequirement {
  code: string;
  title: string;
  type: 'RF' | 'RNF';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
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
  };
  suggestedRequirements?: AiSuggestedRequirement[];
  suggestedEntities?: AiSuggestedEntity[];
  suggestedDecisions?: AiSuggestedDecision[];
  suggestedDiagrams?: AiSuggestedDiagram[];
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

