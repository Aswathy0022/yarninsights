import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBatch, listBatches, updateBatch } from '../api/batches';
import { GradeBadge, RiskBadge, StatusBadge } from '../components/ui/Badges';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import type { Batch } from '../types';
import { CompareBatchesModal } from './CompareBatchesModal';

const MATERIAL_FIELDS: { key: keyof Batch; label: string; unit: string }[] = [
  { key: 'cellulose', label: 'Cellulose', unit: '%' },
  { key: 'hemicellulose', label: 'Hemicellulose', unit: '%' },
  { key: 'lignin', label: 'Lignin', unit: '%' },
  { key: 'pectin', label: 'Pectin', unit: '%' },
  { key: 'moisture_content', label: 'Moisture', unit: '%' },
  { key: 'ph_level', label: 'pH Level', unit: '' },
  { key: 'fineness', label: 'Fineness', unit: ' tex' },
  { key: 'tenacity', label: 'Tenacity', unit: ' gm/tex' },
  { key: 'elongation', label: 'Elongation', unit: '%' },
  { key: 'moisture_regain', label: 'Moisture Regain', unit: '%' },
  { key: 'water_swelling', label: 'Water Swelling', unit: '%' },
  { key: 'density', label: 'Density', unit: ' gms/cc' },
  { key: 'porosity', label: 'Porosity', unit: '%' },
];

export function BatchManagementPage() {
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('all');
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSupplier, setEditSupplier] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches', search, grade, status],
    queryFn: () =>
      listBatches({
        search: search || undefined,
        grade: grade === 'all' ? undefined : grade,
        status_filter: status === 'all' ? undefined : status,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ batchId, fields }: { batchId: string; fields: { supplier_name?: string } }) => updateBatch(batchId, fields),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast(`Batch ${vars.batchId} updated`);
      setEditingId(null);
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Update failed', '⚠'),
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: string) => deleteBatch(batchId),
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      showToast(`Batch ${batchId} deleted`);
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Delete failed', '⚠'),
  });

  const toggleCompare = (batchId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(batchId)) return prev.filter((id) => id !== batchId);
      if (prev.length >= 2) return [prev[1], batchId];
      return [...prev, batchId];
    });
  };

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by batch ID or supplier…"
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, color: '#0f172a' }}
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: 'white', color: '#374151' }}>
          <option value="all">All Grades</option>
          <option value="Grade A+ (Premium)">A+</option>
          <option value="Grade A">A</option>
          <option value="Grade B">B</option>
          <option value="Grade C">C</option>
          <option value="Reject">Reject</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: 'white', color: '#374151' }}>
          <option value="all">All Statuses</option>
          <option value="Release">Release</option>
          <option value="Review">Review</option>
          <option value="Hold">Hold</option>
        </select>
        <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{batches.length} batches</span>
        {compareIds.length === 2 && (
          <button onClick={() => setCompareIds(compareIds)} style={{ padding: '8px 14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Compare Selected
          </button>
        )}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['', 'Batch ID', 'Supplier', 'Grade', 'Strength', 'Confidence', 'Status', 'Risk', 'Date', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <BatchRow
                key={batch.batch_id}
                batch={batch}
                expanded={expandedId === batch.batch_id}
                onToggleExpand={() => setExpandedId(expandedId === batch.batch_id ? null : batch.batch_id)}
                isEditing={editingId === batch.batch_id}
                editSupplier={editSupplier}
                onEditSupplier={setEditSupplier}
                onStartEdit={() => { setEditingId(batch.batch_id); setEditSupplier(batch.supplier_name); }}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={() => updateMutation.mutate({ batchId: batch.batch_id, fields: { supplier_name: editSupplier } })}
                onDelete={() => deleteMutation.mutate(batch.batch_id)}
                compareChecked={compareIds.includes(batch.batch_id)}
                onToggleCompare={() => toggleCompare(batch.batch_id)}
              />
            ))}
          </tbody>
        </table>
        {!isLoading && batches.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No batches match your filters.</div>
        )}
      </div>

      {compareIds.length === 2 && (
        <CompareBatchesModal
          batchIdA={compareIds[0]}
          batchIdB={compareIds[1]}
          fields={MATERIAL_FIELDS}
          onClose={() => setCompareIds([])}
        />
      )}
    </div>
  );
}

function BatchRow({
  batch, expanded, onToggleExpand, isEditing, editSupplier, onEditSupplier,
  onStartEdit, onCancelEdit, onSaveEdit, onDelete, compareChecked, onToggleCompare,
}: {
  batch: Batch;
  expanded: boolean;
  onToggleExpand: () => void;
  isEditing: boolean;
  editSupplier: string;
  onEditSupplier: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  compareChecked: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <>
      <tr>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}>
          <input type="checkbox" checked={compareChecked} onChange={onToggleCompare} title="Select to compare" />
        </td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}>
          <button onClick={onToggleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', width: 10 }}>{expanded ? '▾' : '▸'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: '#3b82f6' }}>{batch.batch_id}</span>
          </button>
        </td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}>
          {isEditing ? (
            <input type="text" value={editSupplier} onChange={(e) => onEditSupplier(e.target.value)} style={{ padding: '5px 8px', border: '1.5px solid #3b82f6', borderRadius: 5, fontSize: 12, width: '100%', minWidth: 120 }} />
          ) : (
            <span style={{ fontSize: 12, color: '#374151' }}>{batch.supplier_name}</span>
          )}
        </td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', textAlign: 'center' }}><GradeBadge grade={batch.predicted_grade} /></td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', textAlign: 'right', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{batch.predicted_strength.toFixed(0)} MPa</td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', textAlign: 'right', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{batch.confidence.toFixed(0)}%</td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}><StatusBadge status={batch.status} /></td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc' }}><RiskBadge risk={batch.risk_level} /></td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontSize: 11, color: '#64748b', fontFamily: "'IBM Plex Mono',monospace" }}>{batch.creation_time.slice(0, 10)}</td>
        <td style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={onSaveEdit} style={{ padding: '5px 10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Save</button>
              <button onClick={onCancelEdit} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={onStartEdit} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Edit</button>
              <button onClick={onDelete} style={{ padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Delete</button>
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={10} style={{ padding: 0, borderBottom: '2px solid #e2e8f0' }}>
            <div style={{ background: '#f8fafc', padding: '20px 24px', borderTop: '2px solid #3b82f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Material Properties</span>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4 }}>{batch.batch_id}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Model confidence: <strong style={{ color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{batch.confidence.toFixed(1)}%</strong></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 14 }}>
                {MATERIAL_FIELDS.map((field) => (
                  <div key={field.key} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 5 }}>{field.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{Number(batch[field.key]).toFixed(2)}{field.unit}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7 }}>
                <span style={{ fontSize: 11, color: '#374151' }}>{batch.risk_reasons}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
