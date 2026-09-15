export type ArchitectureStyle =
  | 'Monolito Modular Layered MVC'
  | 'Microservicios Desacoplados'
  | 'Event-Driven Architecture'
  | 'Clean Architecture / Hexagonal';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  architecture_style: ArchitectureStyle | string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  architecture_style?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  architecture_style?: string;
}
