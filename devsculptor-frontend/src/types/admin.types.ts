export type AdminTab = 'vault' | 'stats' | 'audit' | 'users';

export interface PlatformStats {
  total_projects: number;
  total_users: number;
  total_entities: number;
  total_requirements: number;
  avg_maturity_score: number;
}

export interface GlobalVaultFile {
  id: string;
  category: string;
  path: string;
  file_path?: string;
  filename: string;
  title: string;
  description: string;
  content?: string;
  state_hash: string;
  sha256_hash?: string;
  author?: string;
  version: string | number;
  is_active?: boolean;
  created_at?: string;
  updated_at: string;
}

export interface SaveVaultFilePayload {
  path: string;
  content: string;
  description?: string;
}

export interface CreateVaultFilePayload {
  path: string;
  content: string;
  category: string;
  title: string;
  description?: string;
}

export interface AuditLogEntry {
  id: string;
  project_id?: string;
  user_id: string | null;
  user_email?: string | null;
  entity_type?: string;
  entity_name?: string;
  entity_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  payload_before?: Record<string, unknown> | null;
  payload_after?: Record<string, unknown> | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at?: string;
  timestamp?: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  is_active: boolean;
  projects_count?: number;
  created_at: string;
}
