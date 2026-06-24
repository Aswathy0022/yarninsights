import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getHomeSummary } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { GradeBadge, StatusBadge } from '../components/ui/Badges';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['home-summary'], queryFn: getHomeSummary });
  const role = user?.role;

  const actions = [
    ...(role !== 'Production Manager'
      ? [
          { icon: '⬡', label: 'Run Prediction', desc: 'Analyze a single yarn sample', color: '#3b82f6', to: '/predict' },
          { icon: '≡', label: 'Batch Management', desc: `${data?.total_batches ?? 0} batches tracked`, color: '#0f172a', to: '/batches' },
          { icon: '⬜', label: 'Certificates', desc: 'Generate quality documents', color: '#6d28d9', to: '/reports' },
        ]
      : []),
    ...(role !== 'Quality Engineer'
      ? [
          { icon: '◫', label: 'Dashboard', desc: 'Production overview & KPIs', color: '#15803d', to: '/dashboard' },
          { icon: '⇪', label: 'Bulk Prediction', desc: 'Process CSV batches at scale', color: '#b45309', to: '/bulk' },
        ]
      : []),
    ...(role === 'Admin' ? [{ icon: '⚙', label: 'Admin Panel', desc: 'Users, audit logs & data ops', color: '#64748b', to: '/admin' }] : []),
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', borderRadius: 12, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div>
          <p style={{ color: '#93c5fd', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Welcome back</p>
          <h2 style={{ color: 'white', margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px' }}>{user?.name}</h2>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 13 }}>{user?.role} · YarnInsight Quality Platform</p>
        </div>
      </div>

      <h3 style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 14px' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
        {actions.map((act) => (
          <button
            key={act.label}
            onClick={() => navigate(act.to)}
            style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 18, textAlign: 'left', cursor: 'pointer', width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div style={{ width: 36, height: 36, background: `${act.color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: act.color }}>{act.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '12px 0 4px' }}>{act.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{act.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Inventory Overview</h3>
          {isLoading ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{data?.total_batches}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Total Batches</div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{data?.total_predictions}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Predictions Logged</div>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Recent Batches</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.recent_batches.map((batch) => (
              <div key={batch.batch_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: "'IBM Plex Mono',monospace" }}>{batch.batch_id}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{batch.supplier_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GradeBadge grade={batch.predicted_grade} />
                  <StatusBadge status={batch.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
