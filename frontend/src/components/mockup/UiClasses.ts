// Kumpulan class Tailwind bersama untuk mockup (bukan CSS manual:
// ini hanya string utility yang dipakai ulang antar halaman).
export const cardClass = 'bg-white border-[3px] border-black rounded-[10px] shadow-brutal p-[18px]';
export const btnClass =
  'border-2 border-black rounded-lg px-4 py-2 font-extrabold bg-white shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-45 disabled:cursor-not-allowed';
export const btnYellowClass = `${btnClass} bg-mk-yellow`;
export const btnBlueClass = `${btnClass} bg-mk-blue text-white`;
export const btnRedClass = `${btnClass} bg-mk-red text-white`;
export const inputClass = 'w-full border-2 border-black rounded-lg px-3 py-2 bg-white';
export const fieldClass = 'flex flex-col gap-1.5 flex-1 min-w-[180px]';
export const fieldLabelClass = 'font-mk-mono text-[10px] tracking-[0.18em] uppercase text-mk-muted';
export const sectionTitleClass = 'font-black text-base uppercase';
export const sectionLabelClass = 'font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted uppercase mb-3';
export const rowClass = 'flex gap-3 items-center flex-wrap';
export const stackClass = 'flex flex-col gap-5';
export const grid2Class = 'grid grid-cols-1 lg:grid-cols-2 gap-5';
export const grid3Class = 'grid grid-cols-1 md:grid-cols-3 gap-5';
export const mutedClass = 'text-mk-muted';
export const tableThClass =
  'font-mk-mono text-[11px] tracking-[0.14em] uppercase text-left text-mk-muted px-2.5 py-2 border-b-[3px] border-black';
export const tableTdClass = 'px-2.5 py-2.5 border-b-2 border-[#e5e5e0] align-top';
export const timelineItemClass = 'flex gap-3 py-2.5 border-b-2 border-dashed border-[#e5e5e0] last:border-b-0';
export const timelineDateClass = 'font-mk-mono text-[11px] text-mk-muted whitespace-nowrap';
