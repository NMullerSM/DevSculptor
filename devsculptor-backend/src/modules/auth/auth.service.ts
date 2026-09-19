import { AuthRepository, User } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { signToken } from '../../shared/utils/jwt';

import { UserRole } from '../../shared/types/express';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
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
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      // Mensaje genérico por seguridad
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Esta cuenta se encuentra temporalmente inactiva o suspendida.');
    }

    const isMatch = await comparePassword(dto.password, user.password_hash);
    if (!isMatch) {
      // Mensaje genérico por seguridad
      throw new UnauthorizedError('Credenciales inválidas.');
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
      },
    };
  }
}
