// Halaman Project mockup: daftar kartu project + form buat project (modal).
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Project, Task } from '../data/mockData';
import { Modal } from '../components/mockup/Modal';
import { ProgressBar } from '../components/mockup/ProgressBar';
import {
  btnRedClass,
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  grid2Class,
  inputClass,
  mutedClass,
  rowClass,
  sectionTitleClass,
  stackClass,
} from '../components/mockup/UiClasses';

export function ProjectsPage({
  projects,
  tasks,
  onAddProject,
  onDeleteProject,
}: {
  projects: Project[];
  tasks: Task[];
  onAddProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline) return;
    onAddProject({ id: `prj_${Date.now()}`, name: name.trim(), description: description.trim(), deadline });
    setName('');
    setDescription('');
    setDeadline('');
    setShowForm(false);
  };

  return (
    <div className={stackClass}>
      <div className={rowClass}>
        <button type="button" className={btnYellowClass} onClick={() => setShowForm(true)}>+ Buat Project</button>
      </div>

      {showForm && (
        <Modal title="Buat Project Baru" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Nama Project</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Sistem Perpustakaan" />
            </label>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Deskripsi</span>
              <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </label>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Deadline</span>
              <input className={inputClass} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>
            <button type="submit" className={btnYellowClass}>Simpan Project</button>
          </form>
        </Modal>
      )}

      <div className={grid2Class}>
        {projects.map((p) => {
          const pTasks = tasks.filter((t) => t.projectId === p.id);
          const pDone = pTasks.filter((t) => t.status === 'COMPLETED').length;
          const pct = pTasks.length === 0 ? 0 : Math.round((pDone / pTasks.length) * 100);
          return (
            <div className={cardClass} key={p.id}>
              <div className={`${rowClass} justify-between`}>
                <h3 className={`${sectionTitleClass} m-0`}>{p.name}</h3>
                <button type="button" className={btnRedClass} onClick={() => onDeleteProject(p.id)}>Hapus</button>
              </div>
              <p className={mutedClass}>{p.description}</p>
              <p className={mutedClass}>Deadline: {p.deadline} · {pDone}/{pTasks.length} task selesai</p>
              <ProgressBar percent={pct} barClass="bg-mk-green" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
