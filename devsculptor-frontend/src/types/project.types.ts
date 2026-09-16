export type ArchitectureStyle =
  | 'Por Definir / En Evaluación'
  | 'Monolito Modular Layered MVC'
  | 'Microservicios Desacoplados'
  | 'Event-Driven Architecture'
  | 'Clean Architecture / Hexagonal'
  | string;

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  architecture_style: ArchitectureStyle | string;
  organization?: string | null;
  lead_architect?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  architecture_style?: string;
  organization?: string;
  lead_architect?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  architecture_style?: string;
  organization?: string;
  lead_architect?: string;
}
