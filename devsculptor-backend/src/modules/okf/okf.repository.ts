import { PoolClient } from 'pg';
import { BaseRepository } from '../../shared/base/BaseRepository';
import { QueryOkfDocsDto } from './okf.dto';

export interface OkfDocumentRecord {
  id: string;
  project_id: string;
  document_id: string;
  document_type: string;
  canonical_path: string;
  title: string;
  tags: string[];
  content_preview: string | null;
  state_hash: string;
  freshness_status: 'FRESH' | 'STALE' | 'DRIFT_DETECTED';
  storage_path: string | null;
  verified_by: string | null;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface VaultStatsRecord {
  total: number;
  fresh_count: number;
  stale_count: number;
  drift_count: number;
}

export class OkfRepository extends BaseRepository<OkfDocumentRecord> {
  constructor() {
    super('okf_documents', [
      'project_id',
      'document_id',
      'document_type',
      'canonical_path',
      'title',
      'tags',
      'content_preview',
      'state_hash',
      'freshness_status',
      'storage_path',
      'verified_by',
      'last_verified_at',
    ]);
  }

  /**
   * Inserta o actualiza un documento de la bóveda garantizando idempotencia por (project_id, canonical_path).
   */
  async upsertDocument(
    projectId: string,
    doc: {
      document_id: string;
      document_type: string;
      canonical_path: string;
      title: string;
      tags: string[];
      content_preview?: string | null;
      state_hash: string;
      freshness_status?: string;
      storage_path?: string | null;
      verified_by?: string | null;
    },
    client?: PoolClient
  ): Promise<OkfDocumentRecord> {
    const runner = this.getClient(client);

    const query = `
      INSERT INTO okf_documents (
        project_id,
        document_id,
        document_type,
        canonical_path,
        title,
        tags,
        content_preview,
        state_hash,
        freshness_status,
        storage_path,
        verified_by,
        last_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id, canonical_path) DO UPDATE SET
        document_id = EXCLUDED.document_id,
        document_type = EXCLUDED.document_type,
        title = EXCLUDED.title,
        tags = EXCLUDED.tags,
        content_preview = EXCLUDED.content_preview,
        state_hash = EXCLUDED.state_hash,
        freshness_status = EXCLUDED.freshness_status,
        storage_path = COALESCE(EXCLUDED.storage_path, okf_documents.storage_path),
        verified_by = COALESCE(EXCLUDED.verified_by, okf_documents.verified_by),
        last_verified_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      projectId,
      doc.document_id,
      doc.document_type,
      doc.canonical_path,
      doc.title,
      doc.tags,
      doc.content_preview || null,
      doc.state_hash,
      doc.freshness_status || 'FRESH',
      doc.storage_path || null,
      doc.verified_by || null,
    ];

    const result = await runner.query(query, values);
    return result.rows[0] as OkfDocumentRecord;
  }

  /**
   * Sincroniza en lote una colección de documentos dentro de una sola transacción.
   */
  async bulkUpsert(
    projectId: string,
    docs: Array<{
      document_id: string;
      document_type: string;
      canonical_path: string;
      title: string;
      tags: string[];
      content_preview?: string | null;
      state_hash: string;
      freshness_status?: string;
      storage_path?: string | null;
      verified_by?: string | null;
    }>,
    client?: PoolClient
  ): Promise<OkfDocumentRecord[]> {
    const runner = this.getClient(client);
    const results: OkfDocumentRecord[] = [];

    for (const doc of docs) {
      const saved = await this.upsertDocument(projectId, doc, runner as PoolClient);
      results.push(saved);
    }

    return results;
  }

  /**
   * Consulta documentos de un proyecto con filtros parametrizados por tipo, frescura, tags y búsqueda.
   */
  async findByProject(
    projectId: string,
    filters?: QueryOkfDocsDto,
    client?: PoolClient
  ): Promise<OkfDocumentRecord[]> {
    const runner = this.getClient(client);
    const whereClauses: string[] = ['project_id = $1'];
    const values: unknown[] = [projectId];
    let paramIndex = 2;

    if (filters?.documentType) {
      whereClauses.push(`document_type = $${paramIndex}`);
      values.push(filters.documentType);
      paramIndex++;
    }

    if (filters?.freshnessStatus) {
      whereClauses.push(`freshness_status = $${paramIndex}`);
      values.push(filters.freshnessStatus);
      paramIndex++;
    }

    if (filters?.tag) {
      whereClauses.push(`tags @> ARRAY[$${paramIndex}]::TEXT[]`);
      values.push(filters.tag);
      paramIndex++;
    }

    if (filters?.search) {
      whereClauses.push(`(title ILIKE $${paramIndex} OR canonical_path ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
    }

    const query = `
      SELECT * FROM okf_documents
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY canonical_path ASC;
    `;

    const result = await runner.query(query, values);
    return result.rows as OkfDocumentRecord[];
  }

  /**
   * Obtiene un documento por su ruta canónica exacta dentro de un proyecto.
   */
  async findByCanonicalPath(
    projectId: string,
    canonicalPath: string,
    client?: PoolClient
  ): Promise<OkfDocumentRecord | null> {
    const runner = this.getClient(client);
    const query = `
      SELECT * FROM okf_documents
      WHERE project_id = $1 AND canonical_path = $2;
    `;
    const result = await runner.query(query, [projectId, canonicalPath]);
    return (result.rows[0] as OkfDocumentRecord) || null;
  }

  /**
   * Calcula las estadísticas de frescura de la bóveda OKF para el proyecto.
   */
  async getVaultStats(projectId: string, client?: PoolClient): Promise<VaultStatsRecord> {
    const runner = this.getClient(client);
    const query = `
      SELECT 
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE freshness_status = 'FRESH')::INT AS fresh_count,
        COUNT(*) FILTER (WHERE freshness_status = 'STALE')::INT AS stale_count,
        COUNT(*) FILTER (WHERE freshness_status = 'DRIFT_DETECTED')::INT AS drift_count
      FROM okf_documents
      WHERE project_id = $1;
    `;
    const result = await runner.query(query, [projectId]);
    const row = result.rows[0];
    return {
      total: row?.total || 0,
      fresh_count: row?.fresh_count || 0,
      stale_count: row?.stale_count || 0,
      drift_count: row?.drift_count || 0,
    };
  }

  /**
   * Actualiza el estado de verificación y frescura de un documento por el arquitecto.
   */
  async verifyDocument(
    projectId: string,
    canonicalPath: string,
    verifiedBy: string,
    status: 'FRESH' | 'STALE' | 'DRIFT_DETECTED' = 'FRESH',
    client?: PoolClient
  ): Promise<OkfDocumentRecord | null> {
    const runner = this.getClient(client);
    const query = `
      UPDATE okf_documents
      SET 
        verified_by = $3,
        freshness_status = $4,
        last_verified_at = CURRENT_TIMESTAMP
      WHERE project_id = $1 AND canonical_path = $2
      RETURNING *;
    `;
    const result = await runner.query(query, [projectId, canonicalPath, verifiedBy, status]);
    return (result.rows[0] as OkfDocumentRecord) || null;
  }
}
