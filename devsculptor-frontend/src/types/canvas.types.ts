export interface CanvasColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  nullable?: boolean;
  unique?: boolean;
}

export interface CanvasEntity {
  id: string;
  project_id: string;
  table_name: string;
  columns_json: CanvasColumn[];
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCanvasEntityPayload {
  table_name: string;
  columns_json: CanvasColumn[];
  position_x?: number;
  position_y?: number;
}

export interface UpdateCanvasEntityPayload {
  table_name?: string;
  columns_json?: CanvasColumn[];
  position_x?: number;
  position_y?: number;
}

export interface AuditLogEntry {
  id: string;
  project_id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload_before?: Record<string, unknown> | null;
  payload_after?: Record<string, unknown> | null;
  user_session?: string;
  created_at: string;
}
