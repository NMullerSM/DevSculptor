import { apiRequest } from './apiClient';
import { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth.types';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('post', '/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('post', '/auth/login', payload);
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('devsculptor_token');
    localStorage.removeItem('devsculptor_user');
  },
};
