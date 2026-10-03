import { create } from 'zustand';
import { User, LoginPayload, RegisterPayload } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<{ mfaRequired?: boolean; tempToken?: string } | void>;
  verifyMfaLogin: (tempToken: string, code: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  initAuth: () => void;
  clearError: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  initAuth: () => {
    try {
      const storedToken = localStorage.getItem('devsculptor_token');
      const storedUser = localStorage.getItem('devsculptor_user');
      if (storedToken && storedUser) {
        set({ token: storedToken, user: JSON.parse(storedUser) });
      }
    } catch {
      localStorage.removeItem('devsculptor_token');
      localStorage.removeItem('devsculptor_user');
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(payload);

      if (res.mfaRequired && res.tempToken) {
        set({ isLoading: false });
        return { mfaRequired: true, tempToken: res.tempToken };
      }

      if (res.user && res.token) {
        localStorage.setItem('devsculptor_token', res.token);
        localStorage.setItem('devsculptor_user', JSON.stringify(res.user));
        set({ user: res.user, token: res.token, isLoading: false, error: null });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  verifyMfaLogin: async (tempToken: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.verifyMfaLogin({ temp_token: tempToken, code });
      localStorage.setItem('devsculptor_token', token);
      localStorage.setItem('devsculptor_user', JSON.stringify(user));
      set({ user, token, isLoading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código 2FA incorrecto o expirado';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.register(payload);
      localStorage.setItem('devsculptor_token', token);
      localStorage.setItem('devsculptor_user', JSON.stringify(user));
      set({ user, token, isLoading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar usuario';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  updateUser: (updatedUser: User) => {
    localStorage.setItem('devsculptor_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
