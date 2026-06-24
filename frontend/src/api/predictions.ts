import { apiGet, apiPost } from './client';
import type { PredictionInput, PredictionResult } from '../types';

export const predict = (input: PredictionInput) =>
  apiPost<PredictionResult>('/predictions/predict', input);

export const getHistory = (limit = 50) =>
  apiGet<Record<string, unknown>[]>(`/predictions/history?limit=${limit}`);
