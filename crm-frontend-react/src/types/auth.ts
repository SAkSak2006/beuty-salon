export type Role = 'owner' | 'admin' | 'master';

export interface User {
  id: number;
  username: string;
  role: Role;
  employeeName?: string;
  employeeId?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
