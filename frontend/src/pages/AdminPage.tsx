import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '../api/admin';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import { auditActionStyle, roleBadgeStyle } from '../utils/presentation';

type Tab = 'users' | 'audit' | 'data';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 18px', border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'transparent', color: active ? '#3b82f6' : '#64748b', fontWeight: active ? 600 : 400,
    cursor: 'pointer', fontSize: 13,
  });

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24, background: 'white', borderRadius: '10px 10px 0 0', border: '1px solid #e2e8f0', borderBottomWidth: 0, padding: '0 20px' }}>
        <button onClick={() => setTab('users')} style={tabStyle(tab === 'users')}>Users</button>
        <button onClick={() => setTab('audit')} style={tabStyle(tab === 'audit')}>Audit Log</button>
        <button onClick={() => setTab('data')} style={tabStyle(tab === 'data')}>Data Management</button>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'data' && <DataTab />}
    </div>
  );
}

function UsersTab() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Quality Engineer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.listUsers });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, password, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setName(''); setEmail(''); setPassword(''); setError(''); setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to create user.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userEmail: string) => adminApi.deleteUser(userEmail),
    onSuccess: (_data, userEmail) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('User removed');
      void userEmail;
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Delete failed', '⚠'),
  });

  const handleCreate = () => {
    setError('');
    if (!name || !email || !password) return setError('All fields are required.');
    if (password.length < 12) return setError('Password must be at least 12 characters (FR-3).');
    createMutation.mutate();
  };

  return (
    <>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '18px 20px', borderBottom: 'none' }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Create New Account</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Full Name"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Sarah Chen" style={inputStyle} /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" style={inputStyle} /></Field>
          <Field label="Password (min 12)"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" style={inputStyle} /></Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="Quality Engineer">Quality Engineer</option>
              <option value="Production Manager">Production Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </Field>
          <button onClick={handleCreate} style={{ padding: '8px 14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add User</button>
        </div>
        {error && <div style={{ marginTop: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, padding: '7px 10px', color: '#dc2626', fontSize: 12 }}>{error}</div>}
        {success && <div style={{ marginTop: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5, padding: '7px 10px', color: '#15803d', fontSize: 12 }}>✓ Account created — user can now sign in with these credentials</div>}
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', overflow: 'hidden', borderTop: 'none' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Name', 'Email', 'Role', '', ''].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 3 ? 'right' : 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{u.name}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', fontSize: 12, color: '#374151', fontFamily: "'IBM Plex Mono',monospace" }}>{u.email}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc' }}><span style={roleBadgeStyle(u.role)}>{u.role}</span></td>
                <td colSpan={2} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                  {u.role !== 'Admin' ? (
                    <button onClick={() => deleteMutation.mutate(u.email)} style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>Remove</button>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AuditTab() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: logs = [] } = useQuery({ queryKey: ['audit-logs'], queryFn: () => adminApi.getAuditLog(150) });

  const clearMutation = useMutation({
    mutationFn: adminApi.clearAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      showToast('Audit logs cleared');
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => clearMutation.mutate()} style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Clear All Logs</button>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px', overflow: 'hidden', maxHeight: 520, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
            <tr>
              {['Timestamp', 'User', 'Action', 'Detail'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid #f8fafc', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#94a3b8', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid #f8fafc', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: '#374151' }}>{log.user_email}</td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid #f8fafc' }}><span style={auditActionStyle(log.action)}>{log.action}</span></td>
                <td style={{ padding: '8px 14px', borderBottom: '1px solid #f8fafc', fontSize: 12, color: '#374151' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataTab() {
  const { showToast } = useToast();
  const { data: config } = useQuery({ queryKey: ['admin-config'], queryFn: adminApi.getConfig });

  const clearPredictions = useMutation({
    mutationFn: adminApi.clearPredictionHistory,
    onSuccess: () => showToast('Prediction history cleared'),
  });
  const clearAudit = useMutation({
    mutationFn: adminApi.clearAuditLog,
    onSuccess: () => showToast('Audit logs cleared'),
  });

  const sysConfig = config
    ? [
        { key: 'YARNINSIGHT_CSV_PATH', value: config.csv_path },
        { key: 'YARNINSIGHT_DB_PATH', value: config.db_path },
        { key: 'PBKDF2_ITERATIONS', value: String(config.password_iterations) },
        { key: 'ALLOW_DEMO_USERS', value: String(config.allow_demo_users) },
        { key: 'MODEL_R2', value: config.model_r2?.toFixed(3) ?? '—' },
        { key: 'MODEL_ACCURACY', value: config.model_accuracy?.toFixed(3) ?? '—' },
      ]
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720 }}>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Prediction History</h4>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>Clear all stored individual prediction records. Batch records are unaffected.</p>
        <button onClick={() => clearPredictions.mutate()} style={{ padding: '9px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Clear Prediction History</button>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Audit Log Retention</h4>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>Current retention: unlimited. Configure purge policy in environment settings.</p>
        <button onClick={() => clearAudit.mutate()} style={{ padding: '9px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Purge Audit Logs</button>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22, gridColumn: '1/-1' }}>
        <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>System Configuration</h4>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>Environment parameters — edit via server environment variables.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {sysConfig.map((cfg) => (
            <div key={cfg.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: '#374151', fontFamily: "'IBM Plex Mono',monospace" }}>{cfg.key}</span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: '#0f172a' }}>{cfg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
