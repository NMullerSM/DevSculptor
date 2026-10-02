export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  is_active?: boolean;
  mfa_enabled?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginResponse {
  mfaRequired?: boolean;
  tempToken?: string;
  token?: string;
  user?: User;
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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface MfaVerifyPayload {
  temp_token: string;
  code: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUri: string;
}
