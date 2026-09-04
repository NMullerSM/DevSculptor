import { BaseRepository } from '../../shared/base/BaseRepository';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: Date;
}

export class AuthRepository extends BaseRepository<User> {
  constructor() {
    super('users', ['email', 'password_hash', 'full_name']);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE LOWER(email) = LOWER($1);`;
    const result = await this.pool.query(query, [email]);
    return (result.rows[0] as User) || null;
  }
}
