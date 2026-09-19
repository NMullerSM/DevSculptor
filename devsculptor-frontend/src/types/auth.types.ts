export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}
