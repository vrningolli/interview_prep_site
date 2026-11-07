/** Small SVG progress ring used across the prep tab. */
export default function Ring({
  pct,
  size = 78,
  label,
  accent = "var(--primary)",
}: {
  pct: number;
  size?: number;
  label?: string;
  accent?: string;
}) {
  const stroke = size < 50 ? 5 : 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)} percent complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * clamped) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .45s ease" }}
      />
      <text x="50%" y="50%" className="ring-value" textAnchor="middle" dominantBaseline="central">
        {Math.round(clamped)}%
      </text>
      {label && (
        <text x="50%" y="72%" className="ring-label" textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      )}
    </svg>
  );
}
