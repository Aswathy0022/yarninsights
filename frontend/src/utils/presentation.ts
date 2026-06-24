import type { CSSProperties } from 'react';

// Ported 1:1 from the design prototype's Component class — presentation-only,
// computed client-side, never part of API payloads.

const GRADE_STYLES: Record<string, CSSProperties> = {
  'Grade A+ (Premium)': { background: '#dcfce7', color: '#15803d' },
  'Grade A': { background: '#d1fae5', color: '#059669' },
  'Grade B': { background: '#fef3c7', color: '#b45309' },
  'Grade C': { background: '#ffedd5', color: '#c2410c' },
  Reject: { background: '#fee2e2', color: '#b91c1c' },
};

export function gradeStyle(grade: string): CSSProperties {
  return {
    ...(GRADE_STYLES[grade] ?? { background: '#f1f5f9', color: '#64748b' }),
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: '"IBM Plex Mono",monospace',
    display: 'inline-block',
  };
}

export function gradeShort(grade: string): string {
  if (grade === 'Grade A+ (Premium)') return 'A+';
  if (grade === 'Reject') return 'Reject';
  return grade.replace('Grade ', '');
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    'Grade A+ (Premium)': '#16a34a',
    'Grade A': '#65a30d',
    'Grade B': '#d97706',
    'Grade C': '#ea580c',
    Reject: '#dc2626',
  };
  return map[grade] ?? '#64748b';
}

const STATUS_STYLES: Record<string, CSSProperties> = {
  Release: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  Review: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
  Hold: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
};

export function statusStyle(status: string): CSSProperties {
  return {
    ...(STATUS_STYLES[status] ?? {}),
    padding: '2px 9px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    display: 'inline-block',
  };
}

const RISK_COLORS: Record<string, string> = {
  'Low Risk': '#15803d',
  'Medium Risk': '#b45309',
  'High Risk': '#b91c1c',
};

export function riskStyle(risk: string): CSSProperties {
  return { color: RISK_COLORS[risk] ?? '#64748b', fontSize: '12px', fontWeight: 600 };
}

const ROLE_BADGE_STYLES: Record<string, CSSProperties> = {
  Admin: { background: '#ede9fe', color: '#6d28d9' },
  'Quality Engineer': { background: '#e0f2fe', color: '#0369a1' },
  'Production Manager': { background: '#f0fdf4', color: '#15803d' },
};

export function roleBadgeStyle(role: string): CSSProperties {
  return {
    ...(ROLE_BADGE_STYLES[role] ?? {}),
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    display: 'inline-block',
  };
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#0369a1', LOGOUT: '#64748b', PREDICT: '#6d28d9', BATCH_CREATE: '#15803d',
  BATCH_EDIT: '#b45309', BATCH_DELETE: '#b91c1c', BULK_PREDICT: '#b45309', CERT_GEN: '#6d28d9',
  EXPORT_EXCEL: '#15803d', USER_SIGNUP: '#0369a1', USER_DELETE: '#b91c1c', USER_CREATE: '#15803d',
  USER_ROLE_CHANGE: '#b45309',
};

export function auditActionStyle(action: string): CSSProperties {
  const color = ACTION_COLORS[action] ?? '#64748b';
  return {
    background: `${color}18`,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: '"IBM Plex Mono",monospace',
    display: 'inline-block',
  };
}
