// Dashboard mockup: statistik, donat progres, milestone roadmap,
// bar chart mingguan, dan progres per divisi.
import type { Task } from '../data/mockData';
import { divisions, isOverdue, weeklyDone } from '../data/mockData';
import { Donut } from '../components/mockup/Donut';
import { ProgressBar } from '../components/mockup/ProgressBar';
import { StatCard } from '../components/mockup/StatCard';
import { WeekChart } from '../components/mockup/WeekChart';
import {
  cardBaseClass,
  cardClass,
  grid2Class,
  grid3Class,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
} from '../components/mockup/UiClasses';
import { Chip } from '../components/mockup/Chip';

export function DashboardPage({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdue = tasks.filter(isOverdue).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const milestones = [
    { name: 'Milestone 1', target: 'Fondasi', color: 'bg-mk-green-soft', done: 4, total: 4, bonus: '+7 Bonus' },
    { name: 'Milestone 2', target: 'Fitur Inti', color: 'bg-mk-yellow-soft', done: 3, total: 4, bonus: '+18 Bonus' },
    { name: 'Milestone 3', target: 'Integrasi', color: 'bg-mk-pink-soft', done: 1, total: 4, bonus: '+29 Bonus' },
    { name: 'Ultimate', target: 'Rilis', color: 'bg-mk-blue-soft', done: 0, total: 4, bonus: '+40 Bonus' },
  ];

  return (
    <div className={stackClass}>
      <div className={grid3Class}>
        <StatCard label="Total Task" value={String(total)} detail={`${done} selesai · ${inProgress} dikerjakan`} />
        <StatCard label="Task Terlambat" value={String(overdue)} detail="Deadline lewat & belum selesai" />
        <div className={`${cardClass} text-center`}>
          <p className={sectionLabelClass}>Progres Keseluruhan</p>
          <Donut percent={pct} label="Selesai" />
        </div>
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Milestone Roadmap</h2>
        <p className={sectionLabelClass}>Target penyelesaian bertahap per project</p>
        <div className={grid2Class}>
          {milestones.map((m) => (
            <div key={m.name} className={`${cardBaseClass} ${m.color} shadow-brutal-sm dark:shadow-brutal-sm-light p-4.5 text-black`}>
              <div className={`${rowClass} justify-between`}>
                <strong className="uppercase">{m.name} — {m.target}</strong>
                <Chip className="bg-mk-green-soft">{m.bonus}</Chip>
              </div>
              <p className={`${mutedClass} my-2`}>{m.done}/{m.total} task selesai</p>
              <ProgressBar percent={m.total === 0 ? 0 : (m.done / m.total) * 100} barClass="bg-mk-green" />
            </div>
          ))}
        </div>
      </div>

      <div className={grid2Class}>
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Task Selesai Per Minggu</h2>
          <p className={sectionLabelClass}>November 2026</p>
          <WeekChart data={weeklyDone} />
        </div>
        <div className={cardClass}>
          <h2 className={sectionTitleClass}>Progres Per Divisi</h2>
          <p className={sectionLabelClass}>Task selesai / total task</p>
          <div className="flex flex-col gap-3.5">
            {divisions.map((d) => {
              const divTasks = tasks.filter((t) => t.divisionId === d.id);
              const divDone = divTasks.filter((t) => t.status === 'COMPLETED').length;
              const p = divTasks.length === 0 ? 0 : Math.round((divDone / divTasks.length) * 100);
              return (
                <div key={d.id}>
                  <div className={`${rowClass} justify-between`}>
                    <strong>{d.name}</strong>
                    <span className={mutedClass}>{divDone}/{divTasks.length} · {p}%</span>
                  </div>
                  <ProgressBar percent={p} barClass="bg-mk-blue" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
