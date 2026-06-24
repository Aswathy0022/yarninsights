import { RoleBadge } from '../ui/Badges';
import { useAuth } from '../../context/AuthContext';

export function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth();
  return (
    <div
      style={{
        background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 100,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.2px' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{user && <RoleBadge role={user.role} />}</div>
    </div>
  );
}
