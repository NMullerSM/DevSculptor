import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { signToken } from '../../shared/utils/jwt';
import { AuthRepository } from '../../modules/auth/auth.repository';

describe('Security & Resilience Integration Suite', () => {
  const app = createApp();

  describe('SEC-02 & SEC-03: MFA Bypass Mitigation & JWT Typing', () => {
    it('debe rechazar tokens con typ: "mfa_pending" en endpoints protegidos (401)', async () => {
      // Simular un token emitido en fase 1 de autenticación previo a completar 2FA
      const mfaPendingToken = signToken(
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@devsculptor.app',
          role: 'USER',
          tv: 1,
        },
        'mfa_pending'
      );

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${mfaPendingToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('Token de sesión temporal no autorizado');
    });

    it('debe rechazar solicitudes a rutas protegidas sin encabezado de autorización (401)', async () => {
      const res = await request(app).get('/api/v1/projects');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar tokens con firma manipulada o formato no válido (401)', async () => {
      const validToken = signToken(
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'test@devsculptor.app',
          role: 'USER',
          tv: 1,
        },
        'access'
      );

      // Manipular el último carácter de la firma
      const tamperedToken = validToken.slice(0, -5) + 'XXXXX';

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('SEC-01: Recuperación de Contraseña & Anti-Enumeración', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('debe retornar respuesta genérica idéntica y no exponer token para correos no registrados', async () => {
      // Simular que el correo no se encuentra registrado sin depender de una base de datos activa en CI
      vi.spyOn(AuthRepository.prototype, 'findByEmail').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent-user-audit-test@domain-fake-99218.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      // En entorno de test seguro, resetToken nunca debe exponerse en el envelope
      expect(res.body.data.resetToken).toBeUndefined();
    });

    it('debe validar formato de correo electrónico y devolver 400 ante entrada inválida', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'correo-totalmente-invalido' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('BUG-02: Manejo de Errores & Resiliencia del Body Parser', () => {
    it('debe capturar JSON sintácticamente malformado y devolver 400 amigable', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "invalido", malformed_json: true');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('JSON válido');
    });

    it('debe devolver 404 estandarizado con código NOT_FOUND en rutas inexistentes', async () => {
      const res = await request(app).get('/api/v1/ruta-inexistente-de-auditoria');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Standard Health & Metadata Envelope', () => {
    it('debe devolver información de versión en la raíz "/" bajo envelope sendSuccess', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('DevSculptor Core API');
      expect(res.body.data.status).toBe('online');
      expect(res.body.data.healthCheck).toBe('/api/v1/health');
    });

    it('debe devolver liveness probe en "/api/v1/health" bajo envelope sendSuccess', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.environment).toBeDefined();
    });
  });

  describe('SEC-04 & H-03: Rate Limiting Protection', () => {
    it('debe responder con HTTP 429 y envelope estándar cuando se supera la cuota de /reset-password', async () => {
      let lastRes;
      for (let i = 0; i < 11; i++) {
        lastRes = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: 'fake-test-token-limit', new_password: 'Password123!' });
      }

      expect(lastRes?.status).toBe(429);
      expect(lastRes?.body.success).toBe(false);
      expect(lastRes?.body.error.code).toBe('TOO_MANY_RESET_ATTEMPTS');
      expect(lastRes?.body.error.message).toContain('Demasiados intentos de restablecimiento');
    });
  });
});
