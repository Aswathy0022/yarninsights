import { apiPostForm, downloadFile } from './client';
import type { BulkPredictionResponse } from '../types';

export const uploadBulkCsv = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiPostForm<BulkPredictionResponse>('/bulk-predictions', form);
};

export const downloadTemplate = () => downloadFile('/bulk-predictions/template', 'bulk_prediction_template.csv');
