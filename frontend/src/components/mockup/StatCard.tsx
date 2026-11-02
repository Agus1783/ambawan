// Kartu statistik dashboard (angka besar + label monospace).
export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white dark:bg-[#262626] border-[3px] border-black dark:border-mk-bg rounded-[10px] shadow-brutal dark:shadow-brutal-light p-4.5">
      <p className="font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted dark:text-[#a3a3a3] uppercase mb-3">{label}</p>
      <p className="font-black text-[40px] leading-tight">{value}</p>
      <p className="text-mk-muted dark:text-[#a3a3a3] m-0">{detail}</p>
    </div>
  );
}
