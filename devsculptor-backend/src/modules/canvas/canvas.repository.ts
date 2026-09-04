import { PoolClient } from 'pg';
import { BaseRepository } from '../../shared/base/BaseRepository';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface ColumnItem {
  name: string;
  type: string;
  is_pk?: boolean;
  nullable?: boolean;
  default_value?: string;
}

export interface CanvasEntity {
  id: string;
  project_id: string;
  table_name: string;
  columns_json: ColumnItem[];
  position_x: number;
  position_y: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  project_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload_before: unknown;
  payload_after: unknown;
  created_at: Date;
}

export class CanvasRepository extends BaseRepository<CanvasEntity> {
  constructor() {
    super('canvas_entities', [
      'project_id',
      'table_name',
      'columns_json',
      'position_x',
      'position_y',
    ]);
  }

  async findAllByProjectId(projectId: string): Promise<CanvasEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE project_id = $1
      ORDER BY created_at ASC;
    `;
    const result = await this.pool.query(query, [projectId]);
    return result.rows as CanvasEntity[];
  }

  async findByIdAndProjectId(
    id: string,
    projectId: string,
    client?: PoolClient
  ): Promise<CanvasEntity | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND project_id = $2;`;
    const runner = this.getClient(client);
    const result = await runner.query(query, [id, projectId]);
    return (result.rows[0] as CanvasEntity) || null;
  }

  async findByTableNameAndProjectId(
    tableName: string,
    projectId: string
  ): Promise<CanvasEntity | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE LOWER(table_name) = LOWER($1) AND project_id = $2;
    `;
    const result = await this.pool.query(query, [tableName, projectId]);
    return (result.rows[0] as CanvasEntity) || null;
  }

  async getAuditLogsByProject(
    projectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AuditLog>> {
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = params?.offset && params.offset >= 0 ? params.offset : 0;

    const countQuery = `
      SELECT COUNT(*)::INT AS total
      FROM audit_logs
      WHERE project_id = $1 AND entity_type = 'canvas_entity';
    `;
    const countRes = await this.pool.query(countQuery, [projectId]);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT * FROM audit_logs
      WHERE project_id = $1 AND entity_type = 'canvas_entity'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const dataRes = await this.pool.query(dataQuery, [projectId, limit, offset]);
    const data = dataRes.rows as AuditLog[];

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    };
  }
}
