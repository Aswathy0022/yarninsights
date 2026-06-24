import { gradeShort, gradeStyle, riskStyle, roleBadgeStyle, statusStyle } from '../../utils/presentation';

export function GradeBadge({ grade }: { grade: string }) {
  return <span style={gradeStyle(grade)}>{gradeShort(grade)}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span style={statusStyle(status)}>{status}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  return <span style={riskStyle(risk)}>{risk}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  return <span style={roleBadgeStyle(role)}>{role}</span>;
}
