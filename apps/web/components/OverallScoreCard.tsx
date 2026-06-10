import React from 'react';

interface OverallScoreCardProps {
  score: number;
  title?: string;
  primary?: boolean;
}

function scoreband(score: number) {
  if (score >= 90) return { color: '#3E9A87', label: 'Good' };
  if (score >= 50) return { color: '#D79A3C', label: 'Fair' };
  return { color: '#D9655E', label: 'Poor' };
}

export default function OverallScoreCard({ score, title = 'Performance', primary = false }: OverallScoreCardProps) {
  const radius = primary ? 58 : 44;
  const stroke = primary ? 9 : 7;
  const size = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const { color, label } = scoreband(score);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-ink/10 bg-paper-pure px-5 py-7 text-center shadow-card transition-all ${
        primary ? 'gap-4' : 'gap-3'
      }`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">{title}</span>

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(22,39,59,0.08)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-display font-semibold tracking-tight text-ink ${primary ? 'text-5xl' : 'text-3xl'}`}
          >
            {score}
          </span>
        </div>
      </div>

      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
