import api from './api';
import { User, UserRole } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyName: string;
  industry: string;
  city?: string;
  state?: string;
  address?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    if (data.token) {
      localStorage.setItem('recarbo_token', data.token);
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    if (data.token) {
      localStorage.setItem('recarbo_token', data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },

  logout(): void {
    localStorage.removeItem('recarbo_token');
  },
};
