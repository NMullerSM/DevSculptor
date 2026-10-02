import { BaseRepository } from '../../shared/base/BaseRepository';
import { UserRole } from '../../shared/types/express';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  mfa_enabled?: boolean;
  mfa_secret?: string | null;
  created_at: Date;
}

export interface PasswordResetRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class AuthRepository extends BaseRepository<User> {
  constructor() {
    super('users', ['email', 'password_hash', 'full_name', 'role', 'is_active', 'mfa_enabled', 'mfa_secret']);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE LOWER(email) = LOWER($1);`;
    const result = await this.pool.query(query, [email]);
    return (result.rows[0] as User) || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1;`;
    const result = await this.pool.query(query, [id]);
    return (result.rows[0] as User) || null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = `UPDATE ${this.tableName} SET password_hash = $1 WHERE id = $2;`;
    await this.pool.query(query, [passwordHash, userId]);
  }

  async createPasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const query = `
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3);
    `;
    await this.pool.query(query, [userId, tokenHash, expiresAt]);
  }

  async findValidPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null> {
    const query = `
      SELECT * FROM password_resets
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await this.pool.query(query, [tokenHash]);
    return (result.rows[0] as PasswordResetRecord) || null;
  }

  async markPasswordResetUsed(resetId: string): Promise<void> {
    const query = `UPDATE password_resets SET used_at = NOW() WHERE id = $1;`;
    await this.pool.query(query, [resetId]);
  }

  async updateMfaSecret(userId: string, secret: string | null): Promise<void> {
    const query = `UPDATE ${this.tableName} SET mfa_secret = $1 WHERE id = $2;`;
    await this.pool.query(query, [secret, userId]);
  }

  async setMfaEnabled(userId: string, enabled: boolean): Promise<void> {
    const query = `UPDATE ${this.tableName} SET mfa_enabled = $1 WHERE id = $2;`;
    await this.pool.query(query, [enabled, userId]);
  }
}
