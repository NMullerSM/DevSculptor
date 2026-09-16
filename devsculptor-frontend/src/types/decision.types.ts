export type DecisionStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

export interface Decision {
  id: string;
  project_id: string;
  code: string; // formato ^ADR-\d{2,3}$
  title: string;
  context: string;
  decision: string;
  consequences?: string | null;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateDecisionPayload {
  code: string;
  title: string;
  context: string;
  decision: string;
  consequences?: string;
  status?: DecisionStatus;
}

export interface UpdateDecisionPayload {
  title?: string;
  context?: string;
  decision?: string;
  consequences?: string;
}

export interface ChangeDecisionStatusPayload {
  status: DecisionStatus;
}
