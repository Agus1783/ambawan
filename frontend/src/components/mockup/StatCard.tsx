// Kartu statistik dashboard (angka besar + label monospace).
export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white border-[3px] border-black rounded-[10px] shadow-brutal p-4.5">
      <p className="font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted uppercase mb-3">{label}</p>
      <p className="font-black text-[40px] leading-tight">{value}</p>
      <p className="text-mk-muted m-0">{detail}</p>
    </div>
  );
}
