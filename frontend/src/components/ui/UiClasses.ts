// Kumpulan class Tailwind bersama untuk mockup (bukan CSS manual:
// string utility yang dipakai ulang antar halaman).
export const cardBaseClass = 'border-[3px] border-black dark:border-[#f2f2ed] rounded-[10px]';
export const cardClass = `${cardBaseClass} bg-white dark:bg-[#262626] shadow-brutal dark:shadow-brutal-light p-[18px]`;
export const btnBaseClass =
  'border-2 border-black dark:border-[#f2f2ed] rounded-lg px-4 py-2 font-extrabold shadow-brutal-sm dark:shadow-brutal-sm-light active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-45 disabled:cursor-not-allowed';
export const btnClass = `${btnBaseClass} bg-white dark:bg-[#2d2d2d]`;
export const btnYellowClass = `${btnBaseClass} bg-mk-yellow text-black`;
export const btnBlueClass = `${btnBaseClass} bg-mk-blue text-white`;
export const btnRedClass = `${btnBaseClass} bg-mk-red text-white`;
export const inputClass =
  'w-full border-2 border-black dark:border-[#f2f2ed] rounded-lg px-3 py-2 bg-white dark:bg-[#2d2d2d]';
export const fieldClass = 'flex flex-col gap-1.5 flex-1 min-w-[180px]';
export const fieldLabelClass = 'font-mk-mono text-[10px] tracking-[0.18em] uppercase text-mk-muted dark:text-[#a3a3a3]';
export const sectionTitleClass = 'font-black text-base uppercase';
export const sectionLabelClass = 'font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted dark:text-[#a3a3a3] uppercase mb-3';
export const rowClass = 'flex gap-3 items-center flex-wrap';
export const stackClass = 'flex flex-col gap-5';
export const grid2Class = 'grid grid-cols-1 lg:grid-cols-2 gap-5';
export const grid3Class = 'grid grid-cols-1 md:grid-cols-3 gap-5';
export const mutedClass = 'text-mk-muted dark:text-[#a3a3a3]';
export const tableThClass =
  'font-mk-mono text-[11px] tracking-[0.14em] uppercase text-left text-mk-muted dark:text-[#a3a3a3] px-2.5 py-2 border-b-[3px] border-black dark:border-[#f2f2ed]';
export const tableTdClass = 'px-2.5 py-2.5 border-b-2 border-[#e5e5e0] dark:border-[#404040] align-top';
export const timelineItemClass = 'flex gap-3 py-2.5 border-b-2 border-dashed border-[#e5e5e0] dark:border-[#404040] last:border-b-0';
export const timelineDateClass = 'font-mk-mono text-[11px] text-mk-muted dark:text-[#a3a3a3] whitespace-nowrap';
