import crypto from 'crypto';
import { AuthRepository, User } from './auth.repository';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MfaEnableDto,
  MfaVerifyDto,
} from './auth.dto';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../shared/exceptions/ValidationError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { signToken, verifyToken } from '../../shared/utils/jwt';
import {
  generateTotpSecret,
  generateOtpauthUri,
  verifyTotpToken,
} from '../../shared/utils/totp';
import { UserRole } from '../../shared/types/express';
import { logger } from '../../config/logger';

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
      mfa_enabled: false,
    });

    const userRole = newUser.role || 'USER';
    const token = signToken({ id: newUser.id, email: newUser.email, role: userRole });

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
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Esta cuenta se encuentra temporalmente inactiva o suspendida.');
    }

    const isMatch = await comparePassword(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    const userRole = user.role || 'USER';

    // Si tiene 2FA / MFA activado, emitir token temporal de verificación
    if (user.mfa_enabled && user.mfa_secret) {
      const tempToken = signToken(
        { id: user.id, email: user.email, role: userRole },
        '5m'
      );
      return {
        mfaRequired: true,
        tempToken,
      };
    }

    const token = signToken({ id: user.id, email: user.email, role: userRole });

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
   * Flujo de Recuperación de Contraseña: Valida existencia en BD y emite token único
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string; resetUrl?: string }> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('No se encontró ninguna cuenta asociada a este correo electrónico en la base de datos.');
    }

    // Generar token criptográfico único
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de vigencia

    await this.authRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    logger.info(`[AUTH] Token de recuperación generado para el usuario: ${user.email}`);

    // Para fines de testing y entornos locales sin SMTP, retornamos el token y link
    return {
      message: 'Se ha generado la solicitud de restablecimiento de contraseña. El token tiene 1 hora de validez.',
      resetToken: rawToken,
      resetUrl: `http://localhost:5173/?resetToken=${rawToken}`,
    };
  }

  /**
   * Restablecimiento seguro de contraseña mediante token de un solo uso
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

    logger.info(`[AUTH] Contraseña restablecida exitosamente para el usuario ID: ${resetRecord.user_id}`);

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.',
    };
  }

  /**
   * Inicia configuración de 2FA generando un secreto Base32 y URI otpauth
   */
  async setupMfa(userId: string): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.');
    }

    const secret = generateTotpSecret();
    await this.authRepository.updateMfaSecret(userId, secret);

    const otpauthUri = generateOtpauthUri(user.email, secret, 'DevSculptor');

    return {
      secret,
      otpauthUri,
    };
  }

  /**
   * Activa formalmente 2FA tras verificar el primer código de 6 dígitos
   */
  async enableMfa(userId: string, dto: MfaEnableDto): Promise<{ message: string; mfaEnabled: boolean }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.mfa_secret) {
      throw new ValidationError('No se ha iniciado la configuración de 2FA para este usuario.');
    }

    const isValid = verifyTotpToken(user.mfa_secret, dto.code);
    if (!isValid) {
      throw new ValidationError('Código 2FA incorrecto o expirado. Por favor verifica la hora en tu dispositivo.');
    }

    await this.authRepository.setMfaEnabled(userId, true);
    logger.info(`[AUTH] 2FA activado formalmente para el usuario: ${user.email}`);

    return {
      message: 'Autenticación de dos factores (2FA) activada satisfactoriamente.',
      mfaEnabled: true,
    };
  }

  /**
   * Verificación de código 2FA durante el login con tempToken
   */
  async verifyMfaLogin(dto: MfaVerifyDto): Promise<AuthResponse> {
    let payload;
    try {
      payload = verifyToken(dto.temp_token);
    } catch {
      throw new UnauthorizedError('La sesión temporal de verificación 2FA ha expirado. Inicia sesión nuevamente.');
    }

    const user = await this.authRepository.findById(payload.id);
    if (!user || !user.mfa_secret || !user.mfa_enabled) {
      throw new UnauthorizedError('El usuario no tiene una configuración 2FA activa válida.');
    }

    const isValid = verifyTotpToken(user.mfa_secret, dto.code);
    if (!isValid) {
      throw new UnauthorizedError('Código de autenticación 2FA incorrecto.');
    }

    const userRole = user.role || 'USER';
    const token = signToken({ id: user.id, email: user.email, role: userRole });

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
   * Desactivar 2FA
   */
  async disableMfa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.mfa_secret) {
      throw new ValidationError('2FA no está configurado para este usuario.');
    }

    const isValid = verifyTotpToken(user.mfa_secret, code);
    if (!isValid) {
      throw new ValidationError('Código 2FA incorrecto.');
    }

    await this.authRepository.setMfaEnabled(userId, false);
    await this.authRepository.updateMfaSecret(userId, null);

    return {
      message: 'Autenticación de dos factores (2FA) desactivada.',
    };
  }

  /**
   * Actualizar nombre de perfil de usuario
   */
  async updateProfile(userId: string, fullName: string): Promise<{ id: string; email: string; full_name: string; role: UserRole; mfa_enabled: boolean }> {
    if (!fullName || fullName.trim().length < 2) {
      throw new ValidationError('El nombre debe tener al menos 2 caracteres.');
    }
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
   * Cambiar contraseña del usuario autenticado
   */
  async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    const isValid = await comparePassword(currentPass, user.password_hash);
    if (!isValid) throw new UnauthorizedError('La contraseña actual es incorrecta.');
    if (newPass.length < 8) throw new ValidationError('La nueva contraseña debe tener al menos 8 caracteres.');
    const newHash = await hashPassword(newPass);
    await this.authRepository.updatePassword(userId, newHash);
    return { message: 'Contraseña actualizada con éxito.' };
  }
}
