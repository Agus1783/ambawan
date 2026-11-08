// Bilah progres neo-brutalist (dashboard, project, divisi).
export function ProgressBar({ percent, barClass = 'bg-mk-yellow' }: { percent: number; barClass?: string }) {
  return (
    <div className="h-3 border-2 border-black dark:border-mk-bg rounded-full overflow-hidden bg-white dark:bg-[#2d2d2d]">
      <div className={`h-full ${barClass}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}
