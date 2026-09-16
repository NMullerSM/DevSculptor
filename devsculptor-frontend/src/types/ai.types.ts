export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiSuggestedRequirement {
  code: string;
  title: string;
  type: 'RF' | 'RNF';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
}

export interface AiSuggestedColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: string;
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

export interface DevSculptorActions {
  requirements?: AiSuggestedRequirement[];
  entities?: AiSuggestedEntity[];
  decisions?: AiSuggestedDecision[];
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
