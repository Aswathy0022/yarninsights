import { useRef, useState } from 'react';
import { downloadTemplate, uploadBulkCsv } from '../api/bulk';
import { GradeBadge, RiskBadge } from '../components/ui/Badges';
import { gradeStyle } from '../utils/presentation';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import type { BulkPredictionResponse } from '../types';

const REQUIRED_COLUMNS = [
  'supplier_name', 'cellulose', 'hemicellulose', 'lignin', 'pectin', 'moisture_content', 'ph_level',
  'fineness', 'tenacity', 'elongation', 'moisture_regain', 'water_swelling', 'density', 'porosity', 'dye_type',
];

export function BulkPredictionPage() {
  const [result, setResult] = useState<BulkPredictionResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadBulkCsv(file);
      setResult(res);
      showToast(`${res.total_rows} rows processed successfully`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Upload failed', '⚠');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadResults = () => {
    if (!result) return;
    const headers = [...REQUIRED_COLUMNS, 'predicted_strength', 'predicted_grade', 'confidence', 'risk_level', 'best_fabric'];
    const rows = result.rows.map((row) =>
      headers.map((h) => (row as unknown as Record<string, unknown>)[h] ?? '').join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_prediction_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div style={{ animation: 'fadeUp 0.3s ease' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 28, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Upload Batch CSV</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>Upload a CSV with material property columns. Each row becomes a prediction.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: '48px 24px', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', background: '#fafbfc' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>⇪</div>
              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#374151' }}>{uploading ? 'Processing…' : 'Click to select CSV file'}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>CSV format · max 10,000 rows</p>
            </div>
            <button onClick={() => downloadTemplate()} style={{ marginTop: 16, padding: '9px 16px', background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
              ↓ Download CSV Template
            </button>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Required CSV Columns</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {REQUIRED_COLUMNS.map((col) => (
                <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Prediction Results</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{result.total_rows} rows processed · {result.total_high_risk} high risk</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setResult(null)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Upload New File</button>
          <button onClick={handleDownloadResults} style={{ padding: '9px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↓ Download CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(result.summary).length || 1},1fr)`, gap: 12, marginBottom: 16 }}>
        {Object.entries(result.summary).map(([gradeKey, count]) => (
          <div key={gradeKey} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: '#0f172a' }}>{count}</div>
            <div style={{ fontSize: 11, marginTop: 3 }}><span style={gradeStyle(gradeKey)}>{gradeKey.replace('Grade ', '')}</span></div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Row', 'Supplier', 'Grade', 'Strength', 'Confidence', 'Risk', 'Top Fabric'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.row_id}>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#64748b' }}>{row.row_id}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc', fontSize: 12, color: '#374151' }}>{row.supplier_name ?? '—'}</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc' }}><GradeBadge grade={row.predicted_grade} /></td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{row.predicted_strength.toFixed(0)} MPa</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{row.confidence.toFixed(0)}%</td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc' }}><RiskBadge risk={row.risk_level} /></td>
                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f8fafc', fontSize: 12, color: '#374151' }}>{row.best_fabric}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
