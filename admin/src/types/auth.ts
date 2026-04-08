export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  name?: string;
  email?: string;
  role: 'ADMIN';
}

export interface LoginResponse {
  message: string;
  token: string;
  admin: AuthenticatedUser;
}
