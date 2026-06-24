import { useQuery } from '@tanstack/react-query';
import { getBatch } from '../api/batches';
import { GradeBadge, RiskBadge, StatusBadge } from '../components/ui/Badges';
import type { Batch } from '../types';

export function CompareBatchesModal({
  batchIdA, batchIdB, fields, onClose,
}: {
  batchIdA: string;
  batchIdB: string;
  fields: { key: keyof Batch; label: string; unit: string }[];
  onClose: () => void;
}) {
  const { data: a } = useQuery({ queryKey: ['batch', batchIdA], queryFn: () => getBatch(batchIdA) });
  const { data: b } = useQuery({ queryKey: ['batch', batchIdB], queryFn: () => getBatch(batchIdB) });

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: 28, width: 640, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Compare Batches</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
        </div>

        {!a || !b ? (
          <p style={{ color: '#94a3b8' }}>Loading batches…</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Property</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{a.batch_id}</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{b.batch_id}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>Supplier</td>
                <td style={{ padding: '6px 10px', fontSize: 12 }}>{a.supplier_name}</td>
                <td style={{ padding: '6px 10px', fontSize: 12 }}>{b.supplier_name}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>Grade</td>
                <td style={{ padding: '6px 10px' }}><GradeBadge grade={a.predicted_grade} /></td>
                <td style={{ padding: '6px 10px' }}><GradeBadge grade={b.predicted_grade} /></td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>Status</td>
                <td style={{ padding: '6px 10px' }}><StatusBadge status={a.status} /></td>
                <td style={{ padding: '6px 10px' }}><StatusBadge status={b.status} /></td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>Risk</td>
                <td style={{ padding: '6px 10px' }}><RiskBadge risk={a.risk_level} /></td>
                <td style={{ padding: '6px 10px' }}><RiskBadge risk={b.risk_level} /></td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>Tensile Strength</td>
                <td style={{ padding: '6px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>{a.predicted_strength.toFixed(1)} MPa</td>
                <td style={{ padding: '6px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>{b.predicted_strength.toFixed(1)} MPa</td>
              </tr>
              {fields.map((field) => (
                <tr key={field.key}>
                  <td style={{ padding: '6px 10px', fontSize: 12, color: '#64748b' }}>{field.label}</td>
                  <td style={{ padding: '6px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>{Number(a[field.key]).toFixed(2)}{field.unit}</td>
                  <td style={{ padding: '6px 10px', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>{Number(b[field.key]).toFixed(2)}{field.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
