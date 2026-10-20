import { BaseRepository } from '../../shared/base/BaseRepository';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { DecisionStatus } from './decisions.dto';

export interface ArchitectureDecision {
  id: string;
  project_id: string;
  code: string | null;
  title: string;
  context: string | null;
  decision: string;
  status: DecisionStatus;
  created_at: Date;
  updated_at: Date;
}

export class DecisionsRepository extends BaseRepository<ArchitectureDecision> {
  constructor() {
    super('architecture_decisions', ['project_id', 'code', 'title', 'context', 'decision', 'status']);
  }

  async findAllByProjectId(
    projectId: string,
    status?: DecisionStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArchitectureDecision>> {
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = params?.offset && params.offset >= 0 ? params.offset : 0;

    let countQuery = `SELECT COUNT(*)::INT AS total FROM ${this.tableName} WHERE project_id = $1`;
    let dataQuery = `SELECT * FROM ${this.tableName} WHERE project_id = $1`;
    const countValues: unknown[] = [projectId];
    const dataValues: unknown[] = [projectId];

    if (status) {
      countQuery += ` AND status = $2;`;
      countValues.push(status);

      dataQuery += ` AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4;`;
      dataValues.push(status, limit, offset);
    } else {
      countQuery += `;`;
      dataQuery += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
      dataValues.push(limit, offset);
    }

    const countRes = await this.pool.query(countQuery, countValues);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.pool.query(dataQuery, dataValues);
    const data = dataRes.rows as ArchitectureDecision[];

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

  async findByIdAndProjectId(
    id: string,
    projectId: string
  ): Promise<ArchitectureDecision | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND project_id = $2;`;
    const result = await this.pool.query(query, [id, projectId]);
    return (result.rows[0] as ArchitectureDecision) || null;
  }
}
