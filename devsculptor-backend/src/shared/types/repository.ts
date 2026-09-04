import { PaginationParams, PaginatedResult } from './pagination';

export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
  findAllByField(field: string, value: unknown, params?: PaginationParams): Promise<PaginatedResult<T>>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
}
