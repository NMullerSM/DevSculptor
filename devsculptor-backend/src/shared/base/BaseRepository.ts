import { Pool, PoolClient } from 'pg';
import { getPool } from '../../config/database';
import { IRepository } from '../types/repository';
import { PaginationParams, PaginatedResult } from '../types/pagination';
import { logger } from '../../config/logger';

export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected readonly pool: Pool;
  protected readonly tableName: string;
  protected readonly insertableColumns: string[];

  constructor(tableName: string, insertableColumns: string[]) {
    this.pool = getPool();
    this.tableName = tableName;
    this.insertableColumns = insertableColumns;
  }

  protected getClient(client?: PoolClient): Pool | PoolClient {
    return client || this.pool;
  }

  async create(data: Partial<T>, client?: PoolClient): Promise<T> {
    const keys = Object.keys(data).filter((k) => this.insertableColumns.includes(k));
    if (keys.length === 0) {
      throw new Error(`No hay columnas válidas para insertar en ${this.tableName}`);
    }

    const values = keys.map((k) => {
      const val = (data as Record<string, unknown>)[k];
      if (k.endsWith('_json') || k.endsWith('_payload') || k === 'columns_json') {
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
      }
      return val;
    });
    const columnNames = keys.join(', ');
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columnNames})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const runner = this.getClient(client);
    const result = await runner.query(query, values);
    return result.rows[0] as T;
  }

  async findById(id: string, client?: PoolClient): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1;`;
    const runner = this.getClient(client);
    const result = await runner.query(query, [id]);
    return (result.rows[0] as T) || null;
  }

  async findAll(params?: PaginationParams, client?: PoolClient): Promise<PaginatedResult<T>> {
    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = params?.offset && params.offset >= 0 ? params.offset : 0;

    const runner = this.getClient(client);

    const countQuery = `SELECT COUNT(*)::INT AS total FROM ${this.tableName};`;
    const countResult = await runner.query(countQuery);
    const total = countResult.rows[0]?.total || 0;

    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const dataResult = await runner.query(dataQuery, [limit, offset]);
    const data = dataResult.rows as T[];

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

  async findAllByField(
    field: string,
    value: unknown,
    params?: PaginationParams,
    client?: PoolClient
  ): Promise<PaginatedResult<T>> {
    // Validar nombre de campo para evitar inyección SQL en identificadores
    if (!/^[a-zA-Z0-9_]+$/.test(field)) {
      throw new Error(`Nombre de campo inválido: ${field}`);
    }

    const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = params?.offset && params.offset >= 0 ? params.offset : 0;

    const runner = this.getClient(client);

    const countQuery = `SELECT COUNT(*)::INT AS total FROM ${this.tableName} WHERE ${field} = $1;`;
    const countResult = await runner.query(countQuery, [value]);
    const total = countResult.rows[0]?.total || 0;

    const dataQuery = `
      SELECT * FROM ${this.tableName}
      WHERE ${field} = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const dataResult = await runner.query(dataQuery, [value, limit, offset]);
    const data = dataResult.rows as T[];

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

  async update(id: string, data: Partial<T>, client?: PoolClient): Promise<T | null> {
    const keys = Object.keys(data).filter(
      (k) => this.insertableColumns.includes(k) && (data as Record<string, unknown>)[k] !== undefined
    );
    if (keys.length === 0) {
      return this.findById(id, client);
    }

    const setClauses = keys.map((k, idx) => `${k} = $${idx + 2}`).join(', ');
    const values = [
      id,
      ...keys.map((k) => {
        const val = (data as Record<string, unknown>)[k];
        if (k.endsWith('_json') || k.endsWith('_payload') || k === 'columns_json') {
          return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
        }
        return val;
      }),
    ];

    const query = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE id = $1
      RETURNING *;
    `;

    const runner = this.getClient(client);
    const result = await runner.query(query, values);
    return (result.rows[0] as T) || null;
  }

  async delete(id: string, client?: PoolClient): Promise<T | null> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *;`;
    const runner = this.getClient(client);
    const result = await runner.query(query, [id]);
    return (result.rows[0] as T) || null;
  }

  async withTransaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ err: error }, `Transacción abortada con rollback en ${this.tableName}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async setSessionUserId(client: PoolClient, userId: string): Promise<void> {
    // Uso de set_config parametrizado de PostgreSQL para seguridad total
    await client.query(`SELECT set_config('app.current_user_id', $1, true);`, [userId]);
  }
}
