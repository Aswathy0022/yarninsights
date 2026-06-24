import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/home', icon: '⌂', label: 'Home', roles: ['Admin', 'Quality Engineer', 'Production Manager'] },
  { path: '/dashboard', icon: '◫', label: 'Exec Dashboard', roles: ['Admin', 'Production Manager'] },
  { path: '/predict', icon: '⬡', label: 'Predict & Grade', roles: ['Admin', 'Quality Engineer'] },
  { path: '/batches', icon: '≡', label: 'Batch Management', roles: ['Admin', 'Quality Engineer'] },
  { path: '/bulk', icon: '⇪', label: 'Bulk Prediction', roles: ['Admin', 'Production Manager'] },
  { path: '/reports', icon: '⬜', label: 'Reports & Certs', roles: ['Admin', 'Quality Engineer', 'Production Manager'] },
  { path: '/admin', icon: '⚙', label: 'Admin Panel', roles: ['Admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside style={{ width: 224, background: '#0f172a', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', overflow: 'hidden' }}>
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'IBM Plex Mono',monospace" }}>Y</span>
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px', lineHeight: 1 }}>YarnInsight</div>
            <div style={{ color: '#475569', fontSize: 10, marginTop: 1, letterSpacing: '0.3px' }}>QUALITY PLATFORM</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
              borderRadius: 6, background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? '#93c5fd' : '#64748b', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: 2, textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 8, borderRadius: 7, background: '#0a0f1a' }}>
          <div style={{ width: 28, height: 28, background: '#1e3a5f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700 }}>{(user?.name ?? '?')[0]?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>{user?.role}</div>
          </div>
          <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, padding: '2px 0', lineHeight: 1, flexShrink: 0 }}>
            ⟵
          </button>
        </div>
      </div>
    </aside>
  );
}
