import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { Batch, BatchCreate } from '../types';

export const listBatches = (params: { search?: string; grade?: string; status_filter?: string } = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return apiGet<Batch[]>(`/batches${query ? `?${query}` : ''}`);
};

export const getBatch = (batchId: string) => apiGet<Batch>(`/batches/${batchId}`);

export const createBatch = (data: BatchCreate) => apiPost<Batch>('/batches', data);

export const updateBatch = (batchId: string, fields: { supplier_name?: string; status?: string }) =>
  apiPatch<Batch>(`/batches/${batchId}`, fields);

export const deleteBatch = (batchId: string) => apiDelete<{ message: string }>(`/batches/${batchId}`);
