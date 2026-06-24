import { apiGet } from './client';
import type { DashboardKPIs, HomeSummary } from '../types';

export const getKpis = () => apiGet<DashboardKPIs>('/dashboard/kpis');
export const getHomeSummary = () => apiGet<HomeSummary>('/home/summary');
