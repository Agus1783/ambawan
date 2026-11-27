// Modal form buat task (Tahap 2 langkah 4: pecahan TasksPage).
// Field dan validasi sama seperti sebelum dipecah: judul, project,
// dan deadline wajib diisi.
//
// Pilihan divisi dan penanggung jawab dari API (Tahap 2 langkah 6):
// TasksPage memuatnya untuk workspace aktif dan menurunkannya
// sebagai props, jadi id yang dipilih selalu ada di workspace dan
// tidak lagi ditolak backend.
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Priority } from '../../interfaces/types';
import type {
  Division,
  Project,
  WorkspaceMember,
} from '../../utils/api';
import { Modal } from '../ui/Modal';
import {
  btnClass,
  btnYellowClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  mutedClass,
} from '../ui/UiClasses';

export interface TaskFormValues {
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  divisionId: string;
  assigneeId: string;
}

export function TaskFormModal({
  projects,
  divisions,
  members,
  initialProjectId,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  projects: Project[];
  divisions: Division[];
  members: WorkspaceMember[];
  initialProjectId: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId);
  const [divisionId, setDivisionId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<Priority>('P3');
  const [deadline, setDeadline] = useState('');

  const submitTask = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !deadline) return;
    onSubmit({
      projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline,
      divisionId,
      assigneeId,
    });
  };

  return (
    <Modal title="Tambah Tugas Baru" onClose={onClose}>
      <form onSubmit={submitTask} className="flex flex-col gap-3">
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Judul Task</span>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Membuat API absensi"
          />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Deskripsi</span>
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Project</span>
          <select
            className={inputClass}
            value={projectId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setProjectId(e.target.value)
            }
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {projects.length === 0 && (
          <p className={mutedClass}>
            Belum ada project di workspace ini — buat project dulu di menu
            Projects.
          </p>
        )}
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Divisi (opsional)</span>
          <select
            className={inputClass}
            value={divisionId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setDivisionId(e.target.value)
            }
          >
            <option value="">Tanpa divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Penanggung Jawab (opsional)</span>
          <select
            className={inputClass}
            value={assigneeId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setAssigneeId(e.target.value)
            }
          >
            <option value="">Belum ditentukan</option>
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Prioritas</span>
          <select
            className={inputClass}
            value={priority}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setPriority(e.target.value as Priority)
            }
          >
            <option value="P1">P1 - Mendesak</option>
            <option value="P2">P2 - Penting</option>
            <option value="P3">P3 - Normal</option>
          </select>
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Deadline</span>
          <input
            className={inputClass}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <span className="flex gap-2 flex-wrap">
          <button
            type="submit"
            className={btnYellowClass}
            disabled={submitting || projects.length === 0}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Task'}
          </button>
          <button type="button" className={btnClass} onClick={onClose}>
            Batal
          </button>
        </span>
      </form>
    </Modal>
  );
}
