import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { AuthRepository } from '../../modules/auth/auth.repository';
import { SecurityEventService, SecurityEventType } from '../../shared/services/securityEvent.service';
import { hashPassword } from '../../shared/utils/hash';
import { signToken } from '../../shared/utils/jwt';

describe('SEC-10: Forensic Security Audit Events Suite', () => {
  const app = createApp();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe registrar LOGIN_FAILED con emailRef truncado ante usuario inexistente sin filtrar datos sensibles', async () => {
    const recordSpy = vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent-attacker@target-domain.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');

    expect(recordSpy).toHaveBeenCalledTimes(1);
    const callArgs = recordSpy.mock.calls[0][0];
    expect(callArgs.eventType).toBe(SecurityEventType.LOGIN_FAILED);
    expect(callArgs.userId).toBeNull();
    expect(callArgs.metadata?.reason).toBe('unknown_user');
    expect(callArgs.metadata?.emailRef).toBeDefined();
    expect(typeof callArgs.metadata?.emailRef).toBe('string');
    // Asegurar que el email en claro o contraseña NO se envíen en metadata
    expect(callArgs.metadata?.password).toBeUndefined();
    expect(callArgs.metadata?.email).toBeUndefined();
  });

  it('debe registrar LOGIN_FAILED ante contraseña incorrecta', async () => {
    const recordSpy = vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    const mockHash = await hashPassword('CorrectPassword123!');

    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user-audit@devsculptor.app',
      password_hash: mockHash,
      full_name: 'Audit User',
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 1,
      locked_until: null,
      mfa_enabled: false,
      created_at: new Date(),
    });
    vi.spyOn(AuthRepository.prototype, 'recordFailedLogin').mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user-audit@devsculptor.app', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000001',
        eventType: SecurityEventType.LOGIN_FAILED,
        metadata: { reason: 'bad_password' },
      })
    );
  });

  it('debe registrar ACCOUNT_LOCKED cuando los intentos fallidos alcanzan el umbral (5 intentos)', async () => {
    const recordSpy = vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    const mockHash = await hashPassword('CorrectPassword123!');

    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'brute-target@devsculptor.app',
      password_hash: mockHash,
      full_name: 'Target User',
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 4, // Al fallar pasa a 5
      locked_until: null,
      mfa_enabled: false,
      created_at: new Date(),
    });
    vi.spyOn(AuthRepository.prototype, 'recordFailedLogin').mockResolvedValue();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'brute-target@devsculptor.app', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);

    const lockedEvent = recordSpy.mock.calls.find(
      (c) => c[0].eventType === SecurityEventType.ACCOUNT_LOCKED
    );
    expect(lockedEvent).toBeDefined();
    expect(lockedEvent?.[0].userId).toBe('00000000-0000-0000-0000-000000000002');
    expect(lockedEvent?.[0].metadata?.attempts).toBe(5);
  });

  it('debe registrar LOGIN_SUCCESS ante credenciales válidas', async () => {
    const recordSpy = vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    const mockHash = await hashPassword('CorrectPassword123!');

    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000003',
      email: 'valid-user@devsculptor.app',
      password_hash: mockHash,
      full_name: 'Valid User',
      role: 'USER',
      is_active: true,
      token_version: 1,
      failed_login_attempts: 0,
      locked_until: null,
      mfa_enabled: false,
      created_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'valid-user@devsculptor.app', password: 'CorrectPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000003',
        eventType: SecurityEventType.LOGIN_SUCCESS,
        metadata: { mfa: false },
      })
    );
  });

  it('debe registrar MFA_FAILED ante código 2FA incorrecto en verifyMfaLogin', async () => {
    const recordSpy = vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    const tempToken = signToken(
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'mfa-user@devsculptor.app',
        role: 'USER',
        tv: 0,
      },
      'mfa_pending',
      '5m'
    );

    // Mock usuario con MFA activo y secreto
    vi.spyOn(AuthRepository.prototype, 'findById').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000004',
      email: 'mfa-user@devsculptor.app',
      password_hash: 'hash',
      full_name: 'MFA User',
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 0,
      locked_until: null,
      mfa_enabled: true,
      mfa_secret: 'JBSWY3DPEHPK3PXP', // Secreto Base32 de prueba
      created_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/mfa/verify')
      .send({ temp_token: tempToken, code: '000000' }); // Código deliberadamente incorrecto

    expect(res.status).toBe(401);

    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000004',
        eventType: SecurityEventType.MFA_FAILED,
        metadata: {},
      })
    );
  });

  it('debe responder con envelope y mensaje idéntico e indistinguible entre usuario inexistente, clave errónea y cuenta bloqueada (H-02)', async () => {
    vi.spyOn(SecurityEventService, 'record').mockResolvedValue();
    const mockHash = await hashPassword('CorrectPassword123!');

    // 1. Caso: Usuario inexistente
    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue(null);
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@target.com', password: 'Password123!' });

    // 2. Caso: Usuario existente con clave incorrecta
    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000005',
      email: 'existing@target.com',
      password_hash: mockHash,
      full_name: 'Existing User',
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 1,
      locked_until: null,
      mfa_enabled: false,
      created_at: new Date(),
    });
    vi.spyOn(AuthRepository.prototype, 'recordFailedLogin').mockResolvedValue();
    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'existing@target.com', password: 'WrongPassword123!' });

    // 3. Caso: Usuario existente con cuenta bloqueada
    vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000006',
      email: 'locked@target.com',
      password_hash: mockHash,
      full_name: 'Locked User',
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 5,
      locked_until: new Date(Date.now() + 15 * 60 * 1000), // Bloqueado 15 minutos
      mfa_enabled: false,
      created_at: new Date(),
    });
    const res3 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'locked@target.com', password: 'CorrectPassword123!' });

    // Los 3 casos deben tener exactamente el mismo status HTTP 401 y el mismo mensaje genérico
    expect(res1.status).toBe(401);
    expect(res2.status).toBe(401);
    expect(res3.status).toBe(401);

    expect(res1.body.error.message).toBe(res2.body.error.message);
    expect(res2.body.error.message).toBe(res3.body.error.message);
    expect(res1.body.error.code).toBe('UNAUTHORIZED');
  });
});
