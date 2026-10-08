import { BaseRepository } from '../../shared/base/BaseRepository';
import { UserRole } from '../../shared/types/express';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  token_version: number;
  failed_login_attempts: number;
  locked_until: Date | null;
  mfa_enabled?: boolean;
  mfa_secret?: string | null;
  mfa_last_used_step?: number | null;
  mfa_pending_secret?: string | null;
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
    super('users', [
      'email',
      'password_hash',
      'full_name',
      'role',
      'is_active',
      'token_version',
      'failed_login_attempts',
      'locked_until',
      'mfa_enabled',
      'mfa_secret',
      'mfa_last_used_step',
      'mfa_pending_secret',
    ]);
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

  async incrementTokenVersion(userId: string): Promise<number> {
    const query = `
      UPDATE ${this.tableName} 
      SET token_version = token_version + 1 
      WHERE id = $1 
      RETURNING token_version;
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0]?.token_version ?? 0;
  }

  async recordFailedLogin(userId: string, lockUntil?: Date): Promise<void> {
    const query = `
      UPDATE ${this.tableName} 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = COALESCE($2, locked_until)
      WHERE id = $1;
    `;
    await this.pool.query(query, [userId, lockUntil || null]);
  }

  async resetFailedLogins(userId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName} 
      SET failed_login_attempts = 0,
          locked_until = NULL 
      WHERE id = $1;
    `;
    await this.pool.query(query, [userId]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName} 
      SET password_hash = $1, 
          token_version = token_version + 1,
          failed_login_attempts = 0,
          locked_until = NULL 
      WHERE id = $2;
    `;
    await this.pool.query(query, [passwordHash, userId]);
  }

  async invalidatePendingPasswordResets(userId: string): Promise<void> {
    const query = `
      UPDATE password_resets 
      SET used_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND used_at IS NULL;
    `;
    await this.pool.query(query, [userId]);
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

  async updateMfaPendingSecret(userId: string, secret: string | null): Promise<void> {
    const query = `UPDATE ${this.tableName} SET mfa_pending_secret = $1 WHERE id = $2;`;
    await this.pool.query(query, [secret, userId]);
  }

  async confirmMfaSetup(userId: string, secret: string, step: number): Promise<void> {
    const query = `
      UPDATE ${this.tableName} 
      SET mfa_enabled = true,
          mfa_secret = $1,
          mfa_last_used_step = $2,
          mfa_pending_secret = NULL,
          token_version = token_version + 1
      WHERE id = $3;
    `;
    await this.pool.query(query, [secret, step, userId]);
  }

  async updateMfaLastUsedStep(userId: string, step: number): Promise<void> {
    const query = `UPDATE ${this.tableName} SET mfa_last_used_step = $1 WHERE id = $2;`;
    await this.pool.query(query, [step, userId]);
  }

  async disableMfa(userId: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName} 
      SET mfa_enabled = false,
          mfa_secret = NULL,
          mfa_pending_secret = NULL,
          token_version = token_version + 1
      WHERE id = $1;
    `;
    await this.pool.query(query, [userId]);
  }

  async updateProfile(userId: string, fullName: string): Promise<User> {
    const query = `UPDATE ${this.tableName} SET full_name = $1 WHERE id = $2 RETURNING *;`;
    const result = await this.pool.query(query, [fullName, userId]);
    return result.rows[0] as User;
  }
}
