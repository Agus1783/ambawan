// Diagram batang kuning per minggu (dashboard).
export function WeekChart({ data }: { data: { week: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-3.5 h-37.5 pt-2.5">
      {data.map((d) => (
        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" key={d.week}>
          <strong>{d.count}</strong>
          <div
            className="w-full max-w-13.5 bg-mk-yellow border-2 border-black rounded-t-md"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="font-mk-mono text-[10px] tracking-wide">{d.week}</span>
          <span className="font-mk-mono text-[10px] tracking-wide text-mk-muted dark:text-[#a3a3a3]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
