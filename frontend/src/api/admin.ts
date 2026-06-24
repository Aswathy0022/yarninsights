import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { AuditLog, SystemConfig, User } from '../types';

export const listUsers = () => apiGet<User[]>('/admin/users');

export const createUser = (data: { name: string; email: string; password: string; role: string }) =>
  apiPost<User>('/admin/users', data);

export const updateUserRole = (email: string, role: string) =>
  apiPatch<User>(`/admin/users/${encodeURIComponent(email)}`, { role });

export const deleteUser = (email: string) =>
  apiDelete<{ message: string }>(`/admin/users/${encodeURIComponent(email)}`);

export const getAuditLog = (limit = 150) => apiGet<AuditLog[]>(`/admin/audit-log?limit=${limit}`);

export const clearAuditLog = () => apiDelete<{ message: string }>('/admin/audit-log');

export const clearPredictionHistory = () => apiDelete<{ message: string }>('/admin/prediction-history');

export const getConfig = () => apiGet<SystemConfig>('/admin/config');
