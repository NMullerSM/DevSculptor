export type RequirementType = 'RF' | 'RNF';
export type RequirementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Requirement {
  id: string;
  project_id: string;
  code: string; // formato ^(RF|RNF)-\d{2,3}$
  title: string;
  description?: string | null;
  type: RequirementType;
  priority: RequirementPriority;
  entity_relation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRequirementPayload {
  code: string;
  title: string;
  description?: string;
  type: RequirementType;
  priority: RequirementPriority;
  entity_relation?: string;
}

export interface UpdateRequirementPayload {
  code?: string;
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  entity_relation?: string;
}
