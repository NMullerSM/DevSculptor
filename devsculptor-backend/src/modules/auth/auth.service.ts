import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MfaEnableDto,
  MfaVerifyDto,
  DisableMfaDto,
  ChangePasswordDto,
} from './auth.dto';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';
import { ValidationError } from '../../shared/exceptions/ValidationError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { signToken, verifyToken } from '../../shared/utils/jwt';
import {
  generateTotpSecret,
  generateOtpauthUri,
  verifyTotpTokenWithStep,
} from '../../shared/utils/totp';
import { encryptSecret, decryptSecret } from '../../shared/utils/crypto';
import { getMailer } from '../../shared/mailer';
import { UserRole } from '../../shared/types/express';
import { env } from '../../config/env';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    mfa_enabled: boolean;
  };
}

export interface LoginResult {
  mfaRequired?: boolean;
  tempToken?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    mfa_enabled: boolean;
  };
}

// Hash dummy constante para neutralizar enumeración por timing (SEC-04)
const DUMMY_BCRYPT_HASH = '$2b$12$8Z3fs4Az1nfuPPmIaD69S.9eXgViRlfzG6UERWpChffItxjTW1JQ2';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository = new AuthRepository()) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.');
    }

    const passwordHash = await hashPassword(dto.password);

    const newUser = await this.authRepository.create({
      email: dto.email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: dto.full_name.trim(),
      role: 'USER',
      is_active: true,
      token_version: 0,
      failed_login_attempts: 0,
      mfa_enabled: false,
    });

    const userRole = newUser.role || 'USER';
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: userRole,
      tv: newUser.token_version ?? 0,
    });

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: userRole,
        mfa_enabled: false,
      },
    };
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.authRepository.findByEmail(dto.email);

    // Protección anti-timing contra enumeración de correos
    if (!user) {
      await comparePassword(dto.password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    // Verificación de estado activo (SEC-03)
    if (!user.is_active) {
      throw new UnauthorizedError('Esta cuenta se encuentra inactiva o ha sido suspendida.');
    }

    // Verificación de bloqueo temporal por fuerza bruta (SEC-04)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Cuenta temporalmente bloqueada por exceso de intentos fallidos. Intente nuevamente en ${waitMinutes} minutos.`
      );
    }

    const isMatch = await comparePassword(dto.password, user.password_hash);
    if (!isMatch) {
      // Incrementar contador de fallos; bloquear a los 5 intentos por 15 minutos
      const nextAttempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = nextAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;
      await this.authRepository.recordFailedLogin(user.id, lockUntil);
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    // Restablecer contador de fallos tras login exitoso
    if (user.failed_login_attempts > 0 || user.locked_until) {
      await this.authRepository.resetFailedLogins(user.id);
    }

    const userRole = user.role || 'USER';
    const tokenVersion = user.token_version ?? 0;

    // Si tiene 2FA / MFA activado, emitir token temporal restringido (typ: 'mfa_pending') (SEC-02)
    if (user.mfa_enabled && user.mfa_secret) {
      const tempToken = signToken(
        { id: user.id, email: user.email, role: userRole, tv: tokenVersion },
        'mfa_pending',
        '5m'
      );
      return {
        mfaRequired: true,
        tempToken,
      };
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: userRole,
      tv: tokenVersion,
    });

    return {
      mfaRequired: false,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: userRole,
        mfa_enabled: Boolean(user.mfa_enabled),
      },
    };
  }

  /**
   * Flujo de Recuperación de Contraseña:
   * Blindaje contra enumeración de cuentas y entrega segura mediante mailer (SEC-01).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string; resetUrl?: string }> {
    const user = await this.authRepository.findByEmail(dto.email);

    // Mensaje unificado indistinguible para correos existentes o inexistentes
    const genericResponse: { message: string; resetToken?: string; resetUrl?: string } = {
      message: 'Si el correo electrónico se encuentra registrado, recibirás un enlace de recuperación en breve.',
    };

    if (!user || !user.is_active) {
      // Retardo simétrico para neutralizar ataques de canal lateral por tiempo
      await new Promise((resolve) => setTimeout(resolve, 50));
      return genericResponse;
    }

    // Invalidar solicitudes pendientes previas para evitar acumulación
    await this.authRepository.invalidatePendingPasswordResets(user.id);

    // Generar token criptográfico seguro
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de vigencia

    await this.authRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    const resetUrl = `${env.FRONTEND_URL}/?resetToken=${rawToken}`;
    await getMailer().sendPasswordReset(user.email, resetUrl);

    // En desarrollo, exponer token solo si la variable explícita DEV_EXPOSE_RESET_TOKEN está activa
    if (env.NODE_ENV === 'development' && env.DEV_EXPOSE_RESET_TOKEN) {
      genericResponse.resetToken = rawToken;
      genericResponse.resetUrl = resetUrl;
    }

    return genericResponse;
  }

  /**
   * Restablecimiento seguro de contraseña mediante token de un solo uso.
   * Invalida inmediatamente sesiones activas incrementando token_version (SEC-03).
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const resetRecord = await this.authRepository.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new ValidationError('El enlace o token de recuperación es inválido, ya fue utilizado o ha expirado.');
    }

    const newPasswordHash = await hashPassword(dto.new_password);
    await this.authRepository.updatePassword(resetRecord.user_id, newPasswordHash);
    await this.authRepository.markPasswordResetUsed(resetRecord.id);
    await this.authRepository.invalidatePendingPasswordResets(resetRecord.user_id);

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.',
    };
  }

  /**
   * Inicia configuración de 2FA generando un secreto Base32 y guardándolo en mfa_pending_secret (cifrado).
   * Impide sobrescritura maliciosa si el 2FA ya está activo (SEC-04).
   */
  async setupMfa(userId: string): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado.');
    }

    if (user.mfa_enabled) {
      throw new ConflictError(
        'La autenticación de dos factores ya está activada en esta cuenta. Debe desactivarla primero si desea cambiarla.'
      );
    }

    const secret = generateTotpSecret();
    const encryptedSecret = encryptSecret(secret);
    await this.authRepository.updateMfaPendingSecret(userId, encryptedSecret);

    const otpauthUri = generateOtpauthUri(user.email, secret, 'DevSculptor');

    return {
      secret,
      otpauthUri,
    };
  }

  /**
   * Activa formalmente 2FA tras verificar el primer código de 6 dígitos con anti-replay (SEC-04).
   */
  async enableMfa(userId: string, dto: MfaEnableDto): Promise<{ message: string; mfaEnabled: boolean }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.mfa_pending_secret) {
      throw new ValidationError('No se ha iniciado la configuración de 2FA para este usuario.');
    }

    const plainSecret = decryptSecret(user.mfa_pending_secret);
    if (!plainSecret) {
      throw new ValidationError('Error al recuperar la configuración pendiente de 2FA.');
    }

    const verification = verifyTotpTokenWithStep(plainSecret, dto.code, 1);
    if (!verification.valid || verification.step === undefined) {
      throw new ValidationError('Código 2FA incorrecto o expirado. Por favor verifica la hora en tu dispositivo.');
    }

    await this.authRepository.confirmMfaSetup(userId, user.mfa_pending_secret, verification.step);

    return {
      message: 'Autenticación de dos factores (2FA) activada satisfactoriamente.',
      mfaEnabled: true,
    };
  }

  /**
   * Verificación de código 2FA durante el login con tempToken.
   * Exige typ='mfa_pending', valida anti-replay y cifra secretos legados al vuelo (SEC-02, SEC-04).
   */
  async verifyMfaLogin(dto: MfaVerifyDto): Promise<AuthResponse> {
    let payload;
    try {
      payload = verifyToken(dto.temp_token, 'mfa_pending');
    } catch {
      throw new UnauthorizedError('La sesión temporal de verificación 2FA ha expirado o es inválida. Inicia sesión nuevamente.');
    }

    const user = await this.authRepository.findById(payload.id);
    if (!user || !user.mfa_secret || !user.mfa_enabled) {
      throw new UnauthorizedError('El usuario no tiene una configuración 2FA activa válida.');
    }

    const plainSecret = decryptSecret(user.mfa_secret);
    if (!plainSecret) {
      throw new UnauthorizedError('Error de descifrado del secreto 2FA.');
    }

    const verification = verifyTotpTokenWithStep(plainSecret, dto.code, 1, user.mfa_last_used_step);
    if (!verification.valid || verification.step === undefined) {
      throw new UnauthorizedError('Código de autenticación 2FA incorrecto o ya utilizado.');
    }

    // Actualizar paso consumido para neutralizar ataques de repetición (anti-replay)
    await this.authRepository.updateMfaLastUsedStep(user.id, verification.step);

    // Migración automática al vuelo: si el secreto en BD estaba en texto plano, cifrarlo ahora
    if (!user.mfa_secret.includes(':')) {
      const encrypted = encryptSecret(plainSecret);
      await this.authRepository.updateMfaPendingSecret(user.id, null);
      await this.authRepository.confirmMfaSetup(user.id, encrypted, verification.step);
    }

    const userRole = user.role || 'USER';
    const token = signToken({
      id: user.id,
      email: user.email,
      role: userRole,
      tv: user.token_version ?? 0,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: userRole,
        mfa_enabled: true,
      },
    };
  }

  /**
   * Desactivar 2FA: Exige obligatoriamente la contraseña actual + código TOTP (SEC-04).
   */
  async disableMfa(userId: string, dto: DisableMfaDto): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.mfa_secret || !user.mfa_enabled) {
      throw new ValidationError('2FA no está configurado ni activo para este usuario.');
    }

    const isMatch = await comparePassword(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('La contraseña actual es incorrecta.');
    }

    const plainSecret = decryptSecret(user.mfa_secret);
    if (!plainSecret) {
      throw new ValidationError('Error al procesar el secreto 2FA.');
    }

    const verification = verifyTotpTokenWithStep(plainSecret, dto.code, 1, user.mfa_last_used_step);
    if (!verification.valid) {
      throw new ValidationError('Código 2FA incorrecto o ya utilizado.');
    }

    await this.authRepository.disableMfa(userId);

    return {
      message: 'Autenticación de dos factores (2FA) desactivada exitosamente.',
    };
  }

  /**
   * Actualizar nombre de perfil de usuario.
   */
  async updateProfile(userId: string, fullName: string): Promise<{ id: string; email: string; full_name: string; role: UserRole; mfa_enabled: boolean }> {
    const updated = await this.authRepository.updateProfile(userId, fullName.trim());
    return {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      role: updated.role,
      mfa_enabled: Boolean(updated.mfa_enabled),
    };
  }

  /**
   * Cambiar contraseña del usuario autenticado e invalidar todas las sesiones previas (SEC-03).
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new UnauthorizedError('Usuario no encontrado.');

    const isValid = await comparePassword(dto.currentPassword, user.password_hash);
    if (!isValid) throw new UnauthorizedError('La contraseña actual es incorrecta.');

    const newHash = await hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(userId, newHash);

    return { message: 'Contraseña actualizada con éxito. Sus sesiones previas han sido revocadas.' };
  }
}
