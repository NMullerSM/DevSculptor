import { BaseRepository } from '../../shared/base/BaseRepository';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface Requirement {
  id: string;
  project_id: string;
  code: string;
  title: string;
  description: string | null;
  type: 'RF' | 'RNF';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: Date;
}

export class RequirementsRepository extends BaseRepository<Requirement> {
  constructor() {
    super('requirements', ['project_id', 'code', 'title', 'description', 'type', 'priority']);
  }

  async findAllByProjectId(
    projectId: string,
    type?: 'RF' | 'RNF',
    params?: PaginationParams
  ): Promise<PaginatedResult<Requirement>> {
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = params?.offset && params.offset >= 0 ? params.offset : 0;

    let countQuery = `SELECT COUNT(*)::INT AS total FROM ${this.tableName} WHERE project_id = $1`;
    let dataQuery = `SELECT * FROM ${this.tableName} WHERE project_id = $1`;
    const countValues: unknown[] = [projectId];
    const dataValues: unknown[] = [projectId];

    if (type) {
      countQuery += ` AND type = $2;`;
      countValues.push(type);

      dataQuery += ` AND type = $2 ORDER BY created_at ASC LIMIT $3 OFFSET $4;`;
      dataValues.push(type, limit, offset);
    } else {
      countQuery += `;`;
      dataQuery += ` ORDER BY created_at ASC LIMIT $2 OFFSET $3;`;
      dataValues.push(limit, offset);
    }

    const countRes = await this.pool.query(countQuery, countValues);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.pool.query(dataQuery, dataValues);
    const data = dataRes.rows as Requirement[];

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

  async findByIdAndProjectId(id: string, projectId: string): Promise<Requirement | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND project_id = $2;`;
    const result = await this.pool.query(query, [id, projectId]);
    return (result.rows[0] as Requirement) || null;
  }

  async findByCodeAndProjectId(code: string, projectId: string): Promise<Requirement | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE UPPER(code) = UPPER($1) AND project_id = $2;`;
    const result = await this.pool.query(query, [code, projectId]);
    return (result.rows[0] as Requirement) || null;
  }
}
