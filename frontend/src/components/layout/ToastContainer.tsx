import { useToast } from '../../context/ToastContext';

export function ToastContainer() {
  const { toast } = useToast();
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 16, right: 20, background: '#0f172a', color: 'white',
        padding: '12px 18px', borderRadius: 8, fontSize: 13, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'toastIn 0.25s ease', border: '1px solid #1e293b',
      }}
    >
      <span style={{ color: '#4ade80', fontSize: 15 }}>{toast.icon}</span>
      <span>{toast.msg}</span>
    </div>
  );
}
