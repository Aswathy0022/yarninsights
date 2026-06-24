import { apiGet, apiPost } from './client';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const login = (email: string, password: string) =>
  apiPost<LoginResponse>('/auth/login', { email, password });

export const signup = (name: string, email: string, password: string, role: string) =>
  apiPost<{ message: string }>('/auth/signup', { name, email, password, role });

export const logout = () => apiPost<{ message: string }>('/auth/logout');

export const me = () => apiGet<User>('/auth/me');

export const demoMode = () => apiGet<{ allow_demo_users: boolean; self_signup_roles: string[] }>('/auth/demo-mode');
