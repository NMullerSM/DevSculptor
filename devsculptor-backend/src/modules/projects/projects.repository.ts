import { BaseRepository } from '../../shared/base/BaseRepository';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  architecture_style: string | null;
  created_at: Date;
  updated_at: Date;
}

export class ProjectsRepository extends BaseRepository<Project> {
  constructor() {
    super('projects', ['user_id', 'name', 'description', 'architecture_style']);
  }

  async findAllByUserId(
    userId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Project>> {
    return this.findAllByField('user_id', userId, params);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Project | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2;`;
    const result = await this.pool.query(query, [id, userId]);
    return (result.rows[0] as Project) || null;
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Project | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) AND user_id = $2;`;
    const result = await this.pool.query(query, [name, userId]);
    return (result.rows[0] as Project) || null;
  }
}
