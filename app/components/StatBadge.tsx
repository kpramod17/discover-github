interface StatBadgeProps {
  icon: string;
  value: string | number;
  label?: string;
}

export function StatBadge({ icon, value, label }: StatBadgeProps) {
  return (
    <span className="stat-badge">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      {label && <span className="stat-label">{label}</span>}
    </span>
  );
}
