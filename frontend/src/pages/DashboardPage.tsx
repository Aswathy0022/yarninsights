import { useQuery } from '@tanstack/react-query';
import { getKpis } from '../api/dashboard';
import { Card } from '../components/ui/Card';
import { GradeBadge, StatusBadge } from '../components/ui/Badges';

const GRADE_COLORS: Record<string, string> = {
  'Grade A+ (Premium)': '#16a34a',
  'Grade A': '#65a30d',
  'Grade B': '#d97706',
  'Grade C': '#ea580c',
  Reject: '#dc2626',
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-kpis'], queryFn: getKpis });

  if (isLoading || !data) return <p style={{ color: '#94a3b8' }}>Loading dashboard…</p>;

  const kpis = [
    { label: 'Total Batches', value: data.total_batches, sub: `${data.status_breakdown.Release ?? 0} released`, icon: '≡', bg: '#f1f5f9', color: '#0f172a' },
    { label: 'Release Rate', value: `${data.release_rate_pct}%`, sub: `${data.status_breakdown.Release ?? 0} of ${data.total_batches} batches`, icon: '✓', bg: '#f0fdf4', color: '#16a34a' },
    { label: 'Avg Strength', value: `${data.avg_predicted_strength}`, sub: 'MPa tensile', icon: '⬡', bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Held Batches', value: data.held_batches_count, sub: `${data.status_breakdown.Review ?? 0} under review`, icon: '⚑', bg: '#fef2f2', color: '#dc2626' },
  ];

  const maxGradeCount = Math.max(1, ...Object.values(data.grade_distribution));
  const totalGraded = Object.values(data.grade_distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
              <span style={{ background: kpi.bg, color: kpi.color, padding: 6, borderRadius: 6, fontSize: 16 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px', fontFamily: "'IBM Plex Mono',monospace" }}>{kpi.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: '#64748b' }}>{kpi.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Grade Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(data.grade_distribution).map(([grade, count]) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 56, fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: '#374151', flexShrink: 0 }}>
                  {grade.replace('Grade ', '').replace(' (Premium)', '')}
                </span>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 3, height: 18, overflow: 'hidden' }}>
                  <div style={{ width: `${(count / maxGradeCount) * 100}%`, height: '100%', background: GRADE_COLORS[grade] ?? '#94a3b8', borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>{count}</span>
                <span style={{ width: 40, textAlign: 'right', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{Math.round((count / totalGraded) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Monthly Intake</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Last {data.intake_trend.length} months</span>
          </div>
          <TrendSparkline points={data.intake_trend} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Batch Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(data.status_breakdown).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 7, background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'Release' ? '#16a34a' : status === 'Review' ? '#d97706' : '#dc2626' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{status}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: '#0f172a' }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Latest Batches</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Batch ID', 'Supplier', 'Grade', 'Strength', 'Status'].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Strength' ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '0 12px 10px 0', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.latest_batches.map((b) => (
                <tr key={b.batch_id}>
                  <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #f8fafc', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#0f172a', fontWeight: 500 }}>{b.batch_id}</td>
                  <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #f8fafc', fontSize: 12, color: '#374151' }}>{b.supplier_name}</td>
                  <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #f8fafc' }}><GradeBadge grade={b.predicted_grade} /></td>
                  <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #f8fafc', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: '#374151', textAlign: 'right' }}>{b.predicted_strength.toFixed(0)} MPa</td>
                  <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #f8fafc' }}><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function TrendSparkline({ points }: { points: { month: string; count: number }[] }) {
  if (points.length === 0) return <p style={{ color: '#94a3b8', fontSize: 13 }}>Not enough data yet.</p>;
  const W = 280, H = 72, pad = 8;
  const values = points.map((p) => p.count);
  const maxV = Math.max(...values);
  const minV = Math.min(...values) - 2;
  const toX = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (W - 2 * pad);
  const toY = (v: number) => pad + (1 - (v - minV) / (maxV - minV || 1)) * (H - 2 * pad);
  const pts = points.map((p, i) => `${toX(i)},${toY(p.count)}`).join(' ');
  const areaPath = `M${toX(0)},${toY(points[0].count)} ${points.map((p, i) => `L${toX(i)},${toY(p.count)}`).join(' ')} L${toX(points.length - 1)},${H - pad} L${toX(0)},${H - pad} Z`;

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#tg)" />
        <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.month} cx={toX(i)} cy={toY(p.count)} r={3} fill="white" stroke="#3b82f6" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {points.map((p) => (
          <span key={p.month} style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'IBM Plex Mono',monospace" }}>{p.month}</span>
        ))}
      </div>
    </>
  );
}
