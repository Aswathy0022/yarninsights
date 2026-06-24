export type Role = 'Admin' | 'Quality Engineer' | 'Production Manager';

export interface User {
  email: string;
  name: string;
  role: Role;
}

// Field names match the real trained model's columns — the design prototype's
// fictional crystallinity/fiberLength/uniformity/impurity fields were dropped
// and remapped to hemicellulose/lignin/pectin/moisture_regain.
export interface PredictionInput {
  cellulose: number;
  hemicellulose: number;
  lignin: number;
  pectin: number;
  moisture_content: number;
  ph_level: number;
  fineness: number;
  tenacity: number;
  elongation: number;
  moisture_regain: number;
  water_swelling: number;
  density: number;
  porosity: number;
  dye_type: string;
}

export interface FabricScore {
  fabric: string;
  score: number;
}

export interface OptimizerSuggestion {
  parameter: string;
  current: string;
  target: string;
  impact: string;
  action: string;
}

export interface PredictionResult {
  predicted_strength: number;
  predicted_grade: string;
  confidence: number;
  risk_level: string;
  risk_reasons: string;
  fabric_suitability: FabricScore[];
  optimizer_suggestions: OptimizerSuggestion[];
}

export interface Batch extends PredictionInput {
  batch_id: string;
  creation_time: string;
  supplier_name: string;
  actual_strength: number | null;
  predicted_strength: number;
  predicted_grade: string;
  confidence: number;
  risk_level: string;
  risk_reasons: string;
  status: 'Release' | 'Review' | 'Hold';
}

export interface BatchCreate extends PredictionInput {
  supplier_name: string;
  actual_strength?: number | null;
}

export interface BulkResultRow extends PredictionInput {
  row_id: string;
  supplier_name?: string | null;
  predicted_strength: number;
  predicted_grade: string;
  confidence: number;
  risk_level: string;
  best_fabric: string;
}

export interface BulkPredictionResponse {
  rows: BulkResultRow[];
  summary: Record<string, number>;
  total_rows: number;
  total_high_risk: number;
}

export interface TrendPoint {
  month: string;
  count: number;
}

export interface DashboardKPIs {
  total_batches: number;
  release_rate_pct: number;
  avg_predicted_strength: number;
  held_batches_count: number;
  grade_distribution: Record<string, number>;
  status_breakdown: Record<string, number>;
  intake_trend: TrendPoint[];
  latest_batches: Batch[];
}

export interface HomeSummary {
  total_batches: number;
  total_predictions: number;
  recent_batches: Batch[];
}

export interface CertificatePreview {
  batch_id: string;
  supplier_name: string;
  creation_time: string;
  dye_type: string;
  predicted_grade: string;
  grade_color: string;
  confidence: number;
  predicted_strength: number;
  risk_level: string;
  risk_reasons: string;
  top_fabrics: FabricScore[];
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_email: string;
  action: string;
  details: string;
}

export interface SystemConfig {
  db_path: string;
  csv_path: string;
  password_iterations: number;
  allow_demo_users: boolean;
  model_r2: number | null;
  model_accuracy: number | null;
}
