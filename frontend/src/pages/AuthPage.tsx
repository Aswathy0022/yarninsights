import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demoMode } from '../api/auth';
import { ApiError } from '../api/client';

const DEMO_ACCOUNTS = [
  { email: 'admin@yarninsight.com', password: 'admin123', roleLabel: 'Admin', bg: '#ede9fe', color: '#6d28d9' },
  { email: 'engineer@yarninsight.com', password: 'engineer123', roleLabel: 'Quality Eng', bg: '#e0f2fe', color: '#0369a1' },
  { email: 'manager@yarninsight.com', password: 'manager123', roleLabel: 'Prod Manager', bg: '#f0fdf4', color: '#15803d' },
];

export function AuthPage() {
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Quality Engineer');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);

  useEffect(() => {
    demoMode().then((res) => setDemoEnabled(res.allow_demo_users)).catch(() => undefined);
  }, []);

  if (user) return <Navigate to="/home" replace />;

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Login failed.');
    }
  };

  const handleSignup = async () => {
    setSignupError('');
    setSignupSuccess(false);
    if (!signupName || !signupEmail || !signupPassword) {
      setSignupError('All fields are required.');
      return;
    }
    if (signupPassword.length < 12) {
      setSignupError('Password must be at least 12 characters (FR-3).');
      return;
    }
    try {
      await signup(signupName, signupEmail, signupPassword, signupRole);
      setSignupSuccess(true);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } catch (err) {
      setSignupError(err instanceof ApiError ? err.message : 'Signup failed.');
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: 10, border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'transparent', color: active ? '#3b82f6' : '#94a3b8', fontWeight: active ? 600 : 400,
    cursor: 'pointer', fontSize: 14,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 14, color: '#0f172a',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,#0f172a 0%,#1e293b 60%,#0f2744 100%)' }}>
      <div style={{ width: 440, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 17, fontFamily: "'IBM Plex Mono',monospace" }}>Y</span>
            </div>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px' }}>YarnInsight</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 12, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Quality Prediction Platform · v2.0</p>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.45)' }}>
          <div style={{ display: 'flex', marginBottom: 20 }}>
            <button onClick={() => setMode('login')} style={tabStyle(mode === 'login')}>Sign In</button>
            <button onClick={() => setMode('signup')} style={tabStyle(mode === 'signup')}>Create Account</button>
          </div>

          {mode === 'login' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••••••" style={inputStyle} />
              </div>
              {loginError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '10px 12px', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚠</span><span>{loginError}</span>
                </div>
              )}
              <button onClick={handleLogin} style={{ background: '#3b82f6', color: 'white', padding: 11, border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                Sign In
              </button>

              {demoEnabled && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo Access — click to prefill</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {DEMO_ACCOUNTS.map((demo) => (
                      <button
                        key={demo.email}
                        onClick={() => { setLoginEmail(demo.email); setLoginPassword(demo.password); }}
                        style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span style={{ fontSize: 12, color: '#374151', fontFamily: "'IBM Plex Mono',monospace" }}>{demo.email}</span>
                        <span style={{ background: demo.bg, color: demo.color, padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 600 }}>{demo.roleLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full name</label>
                <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Dr. Sarah Chen" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
                <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password <span style={{ color: '#94a3b8' }}>(min 12 characters)</span></label>
                <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Role</label>
                <select value={signupRole} onChange={(e) => setSignupRole(e.target.value)} style={inputStyle}>
                  <option value="Quality Engineer">Quality Engineer</option>
                  <option value="Production Manager">Production Manager</option>
                </select>
              </div>
              {signupError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '10px 12px', color: '#dc2626', fontSize: 13 }}>{signupError}</div>
              )}
              {signupSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '10px 12px', color: '#15803d', fontSize: 13 }}>
                  ✓ Account created — switch to Sign In to log in.
                </div>
              )}
              <button onClick={handleSignup} style={{ background: '#0f172a', color: 'white', padding: 11, border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                Create Account
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 20, opacity: 0.6 }}>YarnInsight · Yarn Quality Prediction Platform</p>
      </div>
    </div>
  );
}
