import {
  AiProjectContext,
  AiChatResult,
  UserAiOverride,
} from '../ai/providers/ai-provider.interface';

export interface ExpectedCanvasRubric {
  expectedTables?: string[];
  expectedColumns?: Record<string, string[]>;
  expectedDroppedColumns?: Record<string, string[]>;
  requiredFks?: Array<{ fromTable: string; toTable: string }>;
  expectedMutations?: Array<{
    targetTableName: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
  }>;
}

export interface ExpectedRequirementsRubric {
  minRfCount?: number;
  minRnfCount?: number;
  keyTopics: string[]; // Conceptos clave que los requisitos deben cubrir
  expectedMutations?: Array<{
    targetCode: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
  }>;
}

export interface ExpectedDecisionsRubric {
  minAdrCount?: number;
  expectedKeywords: string[];
  mustBeProposed?: boolean;
}

export interface ExpectedDiagramsRubric {
  expectedType?: 'sequence' | 'flowchart' | 'class' | 'er' | 'state' | 'c4';
  requiredMermaidKeywords: string[];
}

export interface ExpectedRubric {
  canvas?: ExpectedCanvasRubric;
  requirements?: ExpectedRequirementsRubric;
  decisions?: ExpectedDecisionsRubric;
  diagrams?: ExpectedDiagramsRubric;
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  initialContext: AiProjectContext;
  userPrompt: string; // Lenguaje natural realista y humano, no determinista
  actionContext?: string;
  expectedRubric: ExpectedRubric;
}

export interface CanvasEvaluationDetail {
  passed: boolean;
  score: number;
  matchedTables: string[];
  missingTables: string[];
  matchedColumns: string[];
  missingColumns: string[];
  droppedColumnsVerified: boolean;
  notes: string[];
}

export interface RequirementsEvaluationDetail {
  passed: boolean;
  score: number;
  rfCount: number;
  rnfCount: number;
  topicsCovered: string[];
  topicsMissing: string[];
  mutationsMatched: boolean;
  notes: string[];
}

export interface DecisionsEvaluationDetail {
  passed: boolean;
  score: number;
  adrCount: number;
  foundKeywords: string[];
  missingKeywords: string[];
  isProposedStatus: boolean;
  notes: string[];
}

export interface DiagramsEvaluationDetail {
  passed: boolean;
  score: number;
  hasDiagram: boolean;
  syntaxValid: boolean;
  foundKeywords: string[];
  missingKeywords: string[];
  notes: string[];
}

export interface EvaluationResult {
  scenarioId: string;
  scenarioName: string;
  provider: string;
  model: string;
  executionTimeMs: number;
  affinityScore: number; // 0 a 100%
  breakdown: {
    canvas: CanvasEvaluationDetail;
    requirements: RequirementsEvaluationDetail;
    decisions: DecisionsEvaluationDetail;
    diagrams: DiagramsEvaluationDetail;
  };
  feedback: string[]; // Sugerencias accionables para ajustar prompts
  rawResult: {
    reply: string;
    actions?: AiChatResult['actions'];
  };
}

export interface BenchmarkSuiteSummary {
  timestamp: string;
  totalScenarios: number;
  averageAffinityScore: number;
  provider: string;
  model: string;
  results: EvaluationResult[];
}

export interface RunBenchmarkDto {
  scenarioId?: string;
  providerOverride?: UserAiOverride;
  customScenario?: BenchmarkScenario;
}
