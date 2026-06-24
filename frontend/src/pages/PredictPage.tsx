import { useState } from 'react';
import { predict } from '../api/predictions';
import { createBatch } from '../api/batches';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import { gradeColor, gradeShort, gradeStyle, riskStyle } from '../utils/presentation';
import type { PredictionInput, PredictionResult } from '../types';

// Field defs use the REAL trained-model feature columns (remapped from the
// design prototype's fictional crystallinity/fiberLength/uniformity/impurity).
const FIELD_DEFS: { key: keyof PredictionInput; label: string; unit: string; min: number; max: number; step: number }[] = [
  { key: 'cellulose', label: 'Cellulose Content', unit: '%', min: 60, max: 99, step: 0.5 },
  { key: 'hemicellulose', label: 'Hemicellulose Content', unit: '%', min: 0, max: 25, step: 0.5 },
  { key: 'lignin', label: 'Lignin Content', unit: '%', min: 0, max: 15, step: 0.5 },
  { key: 'pectin', label: 'Pectin Content', unit: '%', min: 0, max: 5, step: 0.1 },
  { key: 'moisture_content', label: 'Moisture Content', unit: '%', min: 5, max: 16, step: 0.1 },
  { key: 'ph_level', label: 'pH Level', unit: '', min: 3.5, max: 9, step: 0.1 },
  { key: 'fineness', label: 'Fineness (Yarn Count)', unit: ' tex', min: 0.8, max: 4.0, step: 0.1 },
  { key: 'tenacity', label: 'Fiber Tenacity', unit: ' gm/tex', min: 10, max: 55, step: 0.5 },
  { key: 'elongation', label: 'Elongation', unit: '%', min: 4, max: 22, step: 0.5 },
  { key: 'moisture_regain', label: 'Moisture Regain', unit: '%', min: 4, max: 18, step: 0.1 },
  { key: 'water_swelling', label: 'Water Swelling', unit: '%', min: 40, max: 110, step: 1 },
  { key: 'density', label: 'True Density', unit: ' gms/cc', min: 1.30, max: 1.70, step: 0.01 },
  { key: 'porosity', label: 'Porosity', unit: '%', min: 1, max: 25, step: 0.5 },
];

const DEFAULT_INPUT: PredictionInput = {
  cellulose: 88.5, hemicellulose: 6, lignin: 2, pectin: 1, moisture_content: 10.5,
  ph_level: 6.5, fineness: 1.8, tenacity: 38, elongation: 13, moisture_regain: 10,
  water_swelling: 80, density: 1.5, porosity: 7, dye_type: 'Reactive',
};

export function PredictPage() {
  const [inputs, setInputs] = useState<PredictionInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const { showToast } = useToast();

  const updateField = (key: keyof PredictionInput, value: number | string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setSaved(false);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await predict(inputs);
      setResult(res);
      setSaved(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatch = async () => {
    if (!result) return;
    try {
      const batch = await createBatch({ ...inputs, supplier_name: supplierName || 'New Supplier' });
      setSaved(true);
      showToast(`Batch ${batch.batch_id} saved to inventory`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save batch', '⚠');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, animation: 'fadeUp 0.3s ease' }}>
      <div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Material Properties</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Adjust physio-chemical inputs for prediction</p>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'IBM Plex Mono',monospace", background: '#f8fafc', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>13 numeric · 1 categorical</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {FIELD_DEFS.map((field) => {
              const value = inputs[field.key] as number;
              return (
                <div key={field.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{field.label}</label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{value}{field.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(e) => updateField(field.key, parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#cbd5e1' }}>{field.min}{field.unit}</span>
                    <span style={{ fontSize: 10, color: '#cbd5e1' }}>{field.max}{field.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              Dye Type <span style={{ color: '#94a3b8' }}>(categorical feature)</span>
            </label>
            <select
              value={inputs.dye_type}
              onChange={(e) => updateField('dye_type', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 14, background: 'white', color: '#0f172a' }}
            >
              <option value="Reactive">Reactive</option>
              <option value="Vat">Vat</option>
              <option value="Disperse">Disperse</option>
              <option value="Direct">Direct</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '10px 12px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handlePredict}
          disabled={loading}
          style={{ width: '100%', background: '#0f172a', color: 'white', padding: 13, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.2px' }}
        >
          {loading ? 'Running model…' : 'Run Prediction Model →'}
        </button>
      </div>

      <div>
        {!result && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '40px 24px', textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ width: 52, height: 52, background: '#f1f5f9', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⬡</div>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Set material properties<br />and run the prediction model</p>
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prediction Result</span>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'IBM Plex Mono',monospace" }}>{result.confidence.toFixed(1)}% confidence</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ ...gradeStyle(result.predicted_grade), fontSize: 28, padding: '8px 18px', borderRadius: 8 }}>
                  {gradeShort(result.predicted_grade)}
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '-1px' }}>
                    {result.predicted_strength.toFixed(0)}<span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}> MPa</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Tensile strength</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Risk Assessment</span>
                <span style={riskStyle(result.risk_level)}>{result.risk_level}</span>
              </div>
              <p style={{ fontSize: 12, color: '#374151', background: '#f8fafc', padding: '10px 12px', borderRadius: 7, margin: 0 }}>{result.risk_reasons}</p>
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
              <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Fabric Suitability</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {result.fabric_suitability.map((fabric) => (
                  <div key={fabric.fabric}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#374151' }}>{fabric.fabric}</span>
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#64748b' }}>{fabric.score}%</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${fabric.score}%`, height: '100%', background: gradeColor(result.predicted_grade), borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.optimizer_suggestions.length > 0 && result.optimizer_suggestions[0].parameter !== 'Parameters Optimized' && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Optimizer Suggestions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.optimizer_suggestions.map((s) => (
                    <div key={s.parameter} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{s.parameter}: {s.current} → {s.target}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saved ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#15803d', fontWeight: 500 }}>
                ✓ Batch saved to inventory
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Supplier name"
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                />
                <button onClick={handleSaveBatch} style={{ background: '#f8fafc', color: '#374151', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  + Save as New Batch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
