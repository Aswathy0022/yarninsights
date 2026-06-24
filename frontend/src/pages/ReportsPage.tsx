import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { downloadCertificate, downloadExcelExport, getCertificatePreview, listReportableBatches } from '../api/reports';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import { riskStyle, statusStyle } from '../utils/presentation';

export function ReportsPage() {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const { data: batches = [] } = useQuery({ queryKey: ['batches-for-reports'], queryFn: listReportableBatches });
  const { data: preview } = useQuery({
    queryKey: ['cert-preview', selectedBatchId],
    queryFn: () => getCertificatePreview(selectedBatchId),
    enabled: !!selectedBatchId,
  });

  const handleGenerate = async () => {
    if (!selectedBatchId) return;
    setGenerating(true);
    try {
      await downloadCertificate(selectedBatchId);
      showToast('Certificate generated');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Certificate generation failed', '⚠');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await downloadExcelExport();
      showToast('Excel export ready');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Export failed', '⚠');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Select Batch</h3>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: 'white', color: '#374151', marginBottom: 16 }}
          >
            <option value="">— Choose a batch —</option>
            {batches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>{b.batch_id} — {b.supplier_name} (Grade {b.predicted_grade.replace('Grade ', '')})</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedBatchId || generating}
            style={{ width: '100%', padding: 10, background: selectedBatchId ? '#0f172a' : '#f1f5f9', color: selectedBatchId ? 'white' : '#94a3b8', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: selectedBatchId ? 'pointer' : 'not-allowed' }}
          >
            ⬜ Generate PDF Certificate
          </button>
          <button onClick={handleExportExcel} style={{ width: '100%', padding: 10, background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
            ⬡ Export All Batches to Excel
          </button>
        </div>
      </div>

      {!preview ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>⬜</div>
          <p style={{ margin: 0, fontSize: 14 }}>Select a batch to preview its quality certificate</p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: 10, padding: 36, animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 24, borderBottom: '2px solid #f1f5f9' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}>Y</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>YarnInsight</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Quality Certificate of Analysis</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '6px 14px', border: `2px solid ${preview.grade_color}`, borderRadius: 6, color: preview.grade_color, fontSize: 12, fontWeight: 700 }}>
                {preview.predicted_grade.replace('Grade ', '')}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 10, color: '#94a3b8', fontFamily: "'IBM Plex Mono',monospace" }}>CERT-{preview.batch_id}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Field label="Batch ID" value={preview.batch_id} mono />
            <Field label="Supplier" value={preview.supplier_name} />
            <Field label="Date" value={preview.creation_time.slice(0, 10)} mono />
            <Field label="Tensile Strength" value={`${preview.predicted_strength.toFixed(1)} MPa`} mono />
            <Field label="Confidence" value={`${preview.confidence.toFixed(1)}%`} mono />
            <Field label="Status" value={<span style={statusStyle('Release')}>{preview.predicted_grade}</span>} />
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Risk Profile</p>
            <span style={{ ...riskStyle(preview.risk_level), fontSize: 13 }}>● {preview.risk_level}</span>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>{preview.risk_reasons}</p>
          </div>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Top Fabric Matches</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {preview.top_fabrics.map((f) => (
                <span key={f.fabric} style={{ fontSize: 12, background: '#f1f5f9', padding: '4px 10px', borderRadius: 999 }}>{f.fabric} ({f.score}%)</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: mono ? "'IBM Plex Mono',monospace" : undefined }}>{value}</p>
    </div>
  );
}
