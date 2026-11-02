// Donat persentase (progres keseluruhan di dashboard).
export function Donut({ percent, label }: { percent: number; label: string }) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative w-30 h-30 mx-auto">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e5e0" strokeWidth="16" />
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="#16a34a"
          strokeWidth="16"
          strokeDasharray={`${(pct / 100) * 301.6} 301.6`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-[22px]">{pct}%</span>
        <span className="font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted dark:text-[#a3a3a3] uppercase">{label}</span>
      </div>
    </div>
  );
}
