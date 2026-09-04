import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { ProjectMetrics } from './metrics.dto';

export class MetricsRepository {
  private readonly pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const query = `SELECT * FROM sp_calculate_project_metrics($1);`;
    const result = await this.pool.query(query, [projectId]);
    const row = result.rows[0];

    return {
      total_rf: Number(row?.total_rf ?? 0),
      total_rnf: Number(row?.total_rnf ?? 0),
      total_entities: Number(row?.total_entities ?? 0),
      total_adrs_accepted: Number(row?.total_adrs_accepted ?? 0),
      total_adrs_total: Number(row?.total_adrs_total ?? 0),
      maturity_index: Number(row?.maturity_index ?? 0),
    };
  }
}
