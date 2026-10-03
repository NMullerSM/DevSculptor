import { apiRequest } from './apiClient';
import {
  User,
  AuthResponse,
  LoginResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  MfaVerifyPayload,
  MfaSetupResponse,
} from '@/types/auth.types';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('post', '/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>('post', '/auth/login', payload);
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string; resetUrl?: string }> {
    const res = await apiRequest<{ message: string; resetToken?: string; resetUrl?: string }>(
      'post',
      '/auth/forgot-password',
      { email }
    );
    return res.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const res = await apiRequest<{ message: string }>('post', '/auth/reset-password', payload);
    return res.data;
  },

  async setupMfa(): Promise<MfaSetupResponse> {
    const res = await apiRequest<MfaSetupResponse>('post', '/auth/mfa/setup');
    return res.data;
  },

  async enableMfa(code: string): Promise<{ message: string; mfaEnabled: boolean }> {
    const res = await apiRequest<{ message: string; mfaEnabled: boolean }>('post', '/auth/mfa/enable', { code });
    return res.data;
  },

  async verifyMfaLogin(payload: MfaVerifyPayload): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('post', '/auth/mfa/verify', payload);
    return res.data;
  },

  async disableMfa(code: string): Promise<{ message: string }> {
    const res = await apiRequest<{ message: string }>('post', '/auth/mfa/disable', { code });
    return res.data;
  },

  async updateProfile(fullName: string): Promise<User> {
    const res = await apiRequest<User>('put', '/auth/profile', { full_name: fullName });
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const res = await apiRequest<{ message: string }>('put', '/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('devsculptor_token');
    localStorage.removeItem('devsculptor_user');
  },
};
