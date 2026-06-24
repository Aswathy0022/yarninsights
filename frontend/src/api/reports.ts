import { apiGet, downloadFile } from './client';
import type { Batch, CertificatePreview } from '../types';

export const listReportableBatches = () => apiGet<Batch[]>('/reports/batches');

export const getCertificatePreview = (batchId: string) =>
  apiGet<CertificatePreview>(`/reports/certificate/${batchId}/preview`);

export const downloadCertificate = (batchId: string) =>
  downloadFile(`/reports/certificate/${batchId}`, `certificate_${batchId}.pdf`);

export const downloadExcelExport = () =>
  downloadFile('/reports/export/excel', 'yarninsight_batches.xlsx');
