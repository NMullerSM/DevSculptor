import crypto from 'crypto';
import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../shared/exceptions/ValidationError';
import { UserRole } from '../../shared/types/express';

export interface PlatformStats {
  totalProjects: number;
  totalUsers: number;
  totalEntities: number;
  totalRequirements: number;
  totalDecisions: number;
  totalOkfDocuments: number;
  averageMaturityIndex: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  projects_count: number;
  created_at: Date;
}

export interface GlobalVaultItem {
  id: string;
  path: string;
  filename: string;
  category: 'templates' | 'skills' | 'rules' | 'archetypes';
  title: string;
  description: string | null;
  content: string;
  state_hash: string;
  author: string;
  version: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLogItem {
  id: string;
  project_id: string;
  user_id: string;
  user_email?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload_before: unknown;
  payload_after: unknown;
  created_at: Date;
}

export class AdminService {
  private readonly pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Obtiene la telemetría agregada de la plataforma entera.
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const query = `
      SELECT 
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM canvas_entities) AS total_entities,
        (SELECT COUNT(*)::int FROM requirements) AS total_requirements,
        (SELECT COUNT(*)::int FROM architecture_decisions) AS total_decisions,
        (SELECT COUNT(*)::int FROM okf_documents) AS total_okf_documents,
        (
          SELECT COALESCE(ROUND(AVG(m.maturity_index)::numeric, 1), 0)::float 
          FROM projects p
          CROSS JOIN LATERAL sp_calculate_project_metrics(p.id) m
        ) AS average_maturity_index;
    `;

    const result = await this.pool.query(query);
    const row = result.rows[0];

    return {
      totalProjects: row.total_projects || 0,
      totalUsers: row.total_users || 0,
      totalEntities: row.total_entities || 0,
      totalRequirements: row.total_requirements || 0,
      totalDecisions: row.total_decisions || 0,
      totalOkfDocuments: row.total_okf_documents || 0,
      averageMaturityIndex: row.average_maturity_index || 0,
      // Alias snake_case para compatibilidad con el frontend
      total_projects: row.total_projects || 0,
      total_users: row.total_users || 0,
      total_entities: row.total_entities || 0,
      total_requirements: row.total_requirements || 0,
      avg_maturity_score: row.average_maturity_index || 0,
    } as PlatformStats;
  }

  /**
   * Lista todos los usuarios de la plataforma con su conteo de proyectos.
   */
  async listUsers(): Promise<AdminUserItem[]> {
    const query = `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.is_active, 
        u.created_at,
        COUNT(p.id)::int AS projects_count
      FROM users u
      LEFT JOIN projects p ON p.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC;
    `;

    const result = await this.pool.query(query);
    return result.rows.map((r) => ({
      id: r.id,
      email: r.email,
      full_name: r.full_name,
      role: r.role as UserRole,
      is_active: r.is_active,
      projects_count: r.projects_count,
      created_at: r.created_at,
    }));
  }

  /**
   * Actualiza el rol o estado de un usuario.
   */
  async updateUserRole(targetUserId: string, newRole: UserRole, actorId: string): Promise<AdminUserItem> {
    if (targetUserId === actorId && newRole !== 'SUPERADMIN') {
      throw new ValidationError('No puedes revocar tu propio rol de SUPERADMIN.');
    }

    const checkQuery = `SELECT * FROM users WHERE id = $1;`;
    const checkRes = await this.pool.query(checkQuery, [targetUserId]);
    if (checkRes.rowCount === 0) {
      throw new NotFoundError('Usuario');
    }

    const updateQuery = `
      UPDATE users 
      SET role = $1,
          token_version = token_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING id, email, full_name, role, is_active, created_at;
    `;
    const result = await this.pool.query(updateQuery, [newRole, targetUserId]);
    const updated = result.rows[0];

    return {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      role: updated.role,
      is_active: updated.is_active,
      projects_count: 0,
      created_at: updated.created_at,
    };
  }

  /**
   * Actualiza el estado de activación de un usuario (SEC-03).
   * Al suspender o reactivar, incrementa token_version para revocar sesiones existentes.
   */
  async updateUserStatus(targetUserId: string, isActive: boolean, actorId: string): Promise<AdminUserItem> {
    if (targetUserId === actorId) {
      throw new ValidationError('No puedes modificar tu propio estado de activación.');
    }

    const checkQuery = `SELECT * FROM users WHERE id = $1;`;
    const checkRes = await this.pool.query(checkQuery, [targetUserId]);
    if (checkRes.rowCount === 0) {
      throw new NotFoundError('Usuario');
    }

    const updateQuery = `
      UPDATE users 
      SET is_active = $1,
          token_version = token_version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING id, email, full_name, role, is_active, created_at;
    `;
    const result = await this.pool.query(updateQuery, [isActive, targetUserId]);
    const updated = result.rows[0];

    return {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      role: updated.role,
      is_active: updated.is_active,
      projects_count: 0,
      created_at: updated.created_at,
    };
  }

  /**
   * Lista el catálogo completo de plantillas y reglas de la Bóveda Global (_global/).
   */
  async listGlobalVaultFiles(): Promise<GlobalVaultItem[]> {
    const query = `
      SELECT id, path, filename, category, title, description, content, state_hash, author, version, is_active, created_at, updated_at
      FROM global_vault_templates
      WHERE is_active = TRUE
      ORDER BY category ASC, path ASC;
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Lee el contenido completo de un archivo de la Bóveda Global por su ruta canónica.
   */
  async readVaultFile(filePath: string): Promise<GlobalVaultItem> {
    const query = `
      SELECT id, path, filename, category, title, description, content, state_hash, author, version, is_active, created_at, updated_at
      FROM global_vault_templates
      WHERE path = $1;
    `;
    const result = await this.pool.query(query, [filePath]);
    if (result.rowCount === 0) {
      throw new NotFoundError(`Archivo de bóveda ${filePath}`);
    }
    return result.rows[0];
  }

  /**
   * Guarda o actualiza en caliente el contenido de un archivo de la Bóveda Global.
   */
  async saveVaultFile(filePath: string, content: string, description?: string, authorName?: string): Promise<GlobalVaultItem> {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const author = authorName || 'Nathaniel Muller (Master Architect)';

    const updateQuery = `
      UPDATE global_vault_templates
      SET content = $1, state_hash = $2, description = COALESCE($3, description), author = $4
      WHERE path = $5
      RETURNING id, path, filename, category, title, description, content, state_hash, author, version, is_active, created_at, updated_at;
    `;

    const result = await this.pool.query(updateQuery, [content, hash, description || null, author, filePath]);
    if (result.rowCount === 0) {
      throw new NotFoundError(`Archivo ${filePath}`);
    }

    return result.rows[0];
  }

  /**
   * Crea un nuevo archivo en el árbol global de plantillas/reglas.
   */
  async createVaultFile(
    filePath: string,
    content: string,
    category: 'templates' | 'skills' | 'rules' | 'archetypes' | 'sources' | string,
    title?: string,
    description?: string,
    authorName?: string
  ): Promise<GlobalVaultItem> {
    const normalizedPath = filePath.startsWith('_global/') ? filePath : `_global/${filePath.replace(/^\/+/, '')}`;
    const filename = normalizedPath.split('/').pop() || 'archivo.md';
    const computedTitle = title || filename;
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const author = authorName || 'Nathaniel Muller (Master Architect)';

    const insertQuery = `
      INSERT INTO global_vault_templates (path, filename, category, title, description, content, state_hash, author)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, path, filename, category, title, description, content, state_hash, author, version, is_active, created_at, updated_at;
    `;

    const result = await this.pool.query(insertQuery, [
      normalizedPath,
      filename,
      category,
      computedTitle,
      description || null,
      content,
      hash,
      author,
    ]);

    return result.rows[0];
  }

  /**
   * Elimina un archivo de la Bóveda Global.
   */
  async deleteVaultFile(filePath: string): Promise<void> {
    const deleteQuery = `DELETE FROM global_vault_templates WHERE path = $1;`;
    const result = await this.pool.query(deleteQuery, [filePath]);
    if (result.rowCount === 0) {
      throw new NotFoundError(`Archivo ${filePath}`);
    }
  }

  /**
   * Consulta el registro transversal de auditoría de PostgreSQL.
   */
  async getGlobalAuditLogs(limit: number = 50, offset: number = 0, entity?: string): Promise<AuditLogItem[]> {
    let query = `
      SELECT 
        a.id, 
        a.project_id, 
        a.user_id, 
        u.email AS user_email,
        a.entity_type, 
        a.entity_id, 
        a.action, 
        a.payload_before, 
        a.payload_after, 
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
    `;

    const params: unknown[] = [];
    if (entity) {
      query += ` WHERE a.entity_type = $1`;
      params.push(entity);
      query += ` ORDER BY a.created_at DESC LIMIT $2 OFFSET $3;`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY a.created_at DESC LIMIT $1 OFFSET $2;`;
      params.push(limit, offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Consulta el registro histórico de eventos de seguridad (SEC-10).
   */
  async getSecurityEvents(limit: number = 50, offset: number = 0, eventType?: string): Promise<unknown[]> {
    let query = `
      SELECT 
        s.id, 
        s.user_id, 
        u.email AS user_email,
        s.event_type, 
        s.ip, 
        s.user_agent, 
        s.metadata, 
        s.created_at
      FROM security_events s
      LEFT JOIN users u ON u.id = s.user_id
    `;

    const params: unknown[] = [];
    if (eventType) {
      query += ` WHERE s.event_type = $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3;`;
      params.push(eventType, limit, offset);
    } else {
      query += ` ORDER BY s.created_at DESC LIMIT $1 OFFSET $2;`;
      params.push(limit, offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}
