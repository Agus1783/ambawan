// Halaman Project (Tahap 2 langkah 3): project dari API, bukan mock.
//
// - Daftar project di workspace aktif (GET /projects?workspace_id=...),
//   progres dari taskCount/completedTaskCount yang dibawa list.
// - Buat project (POST /projects): nama, deskripsi, deadline. Project
//   selalu dibuat kosong tanpa template — pemilihan template dihapus,
//   diganti saklar "Rekomendasi Template" On/Off: saat On, nanti
//   rekomendasi template akan diisi AI (belum tersedia — project tetap
//   dibuat kosong untuk sekarang). Bidang usaha project ikut workspace
//   bila tidak diisi (backend, §13.2).
// - Detail project (GET /projects/:id) + daftar tugasnya di modal.
// - Hapus project (DELETE /projects/:id).
// - Tombol buat/hapus hanya untuk OWNER/MANAGER (project.create dan
//   project.delete hanya dimiliki dua role itu di seed backend).
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type Project,
  type ProjectDetail,
  type Workspace,
} from '../utils/api';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  btnBlueClass,
  btnClass,
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
} from '../components/ui/UiClasses';

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'Dikerjakan',
  IN_REVIEW: 'Direview',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

function labelStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** Ubah tanggal input date (YYYY-MM-DD) jadi ISO datetime untuk backend. */
function toIsoDatetime(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function ProjectsPage({
  activeWorkspace,
  canManageProjects,
}: {
  activeWorkspace: Workspace | null;
  canManageProjects: boolean;
}) {
  const workspaceId = activeWorkspace?.id ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  // Id workspace yang daftarnya sedang tampil; dipakai menurunkan status
  // loading (tanpa setState sinkron di dalam effect).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const loading = workspaceId !== null && loadedFor !== workspaceId;

  const [notice, setNotice] = useState<string | null>(null);

  // Detail project (modal).
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailLoading =
    detailId !== null && (detail === null || detail.id !== detailId);

  // Form buat project.
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  // Saklar rekomendasi template: On berarti rekomendasi template
  // (nanti dari AI) dipakai saat buat project; Off berarti project
  // dibuat kosong. AI belum tersedia, jadi On pun project tetap
  // dibuat kosong untuk sekarang — saklar ini penanda niatnya.
  const [recommendTemplate, setRecommendTemplate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Hapus project.
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    let cancelled = false;
    api
      .listProjects(workspaceId)
      .then((items) => {
        if (!cancelled) {
          setProjects(items);
          setLoadError(null);
          setLoadedFor(workspaceId);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(pesanErrorApi(err));
          setLoadedFor(workspaceId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadCount]);

  useEffect(() => {
    if (!detailId) {
      return;
    }
    let cancelled = false;
    api
      .getProject(detailId)
      .then((result) => {
        if (!cancelled) {
          setDetail(result);
          setDetailError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDetailError(pesanErrorApi(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const openForm = () => {
    setName('');
    setDescription('');
    setDeadline('');
    setRecommendTemplate(false);
    setCreateError(null);
    setShowForm(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !name.trim() || creating) {
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // Project selalu dibuat kosong tanpa template
      // (project_template_id tidak dikirim); saklar rekomendasi hanya
      // penanda untuk AI nanti, belum mengubah request ini.
      const created = await api.createProject({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? toIsoDatetime(deadline) : undefined,
      });
      setProjects((prev) => [
        {
          ...created,
          taskCount: created.createdTasks,
          completedTaskCount: 0,
        },
        ...prev,
      ]);
      setNotice('Project dibuat.');
      setShowForm(false);
    } catch (err: unknown) {
      setCreateError(pesanErrorApi(err));
    } finally {
      setCreating(false);
    }
  };

  const openDetail = (id: string) => {
    setDetail(null);
    setDetailError(null);
    setDetailId(id);
  };

  const confirmDelete = async () => {
    if (!deleting || deleteBusy) {
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.deleteProject(deleting.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleting.id));
      setNotice(`Project "${deleting.name}" dihapus.`);
      setDeleting(null);
    } catch (err: unknown) {
      setDeleteError(pesanErrorApi(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className={stackClass}>
      <div className={rowClass}>
        {canManageProjects && workspaceId && (
          <button type="button" className={btnYellowClass} onClick={openForm}>
            + Buat Project
          </button>
        )}
      </div>

      {notice && (
        <p className={mutedClass} role="status">
          {notice}
        </p>
      )}

      {workspaceId === null ? (
        <p className={mutedClass}>
          Pilih workspace aktif dulu di halaman Workspace untuk melihat
          project-projectnya.
        </p>
      ) : loading ? (
        <p className={mutedClass}>Memuat project...</p>
      ) : loadError ? (
        <div className={cardClass}>
          <p className="text-mk-red font-bold">{loadError}</p>
          <span>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                setLoadedFor(null);
                setReloadCount((c) => c + 1);
              }}
            >
              Coba lagi
            </button>
          </span>
        </div>
      ) : projects.length === 0 ? (
        <p className={mutedClass}>
          Belum ada project di workspace ini.
          {canManageProjects
            ? ' Buat project pertamamu dengan tombol di atas.'
            : ''}
        </p>
      ) : (
        <div className={grid2Class}>
          {projects.map((p) => {
            const pct =
              p.taskCount === 0
                ? 0
                : Math.round((p.completedTaskCount / p.taskCount) * 100);
            return (
              <div className={cardClass} key={p.id}>
                <div className={`${rowClass} justify-between`}>
                  <h3 className={`${sectionTitleClass} m-0`}>{p.name}</h3>
                  {canManageProjects && (
                    <button
                      type="button"
                      className={btnRedClass}
                      onClick={() => setDeleting(p)}
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className={mutedClass}>{p.description ?? 'Tanpa deskripsi'}</p>
                <p className={mutedClass}>
                  Deadline: {p.deadline ? p.deadline.slice(0, 10) : 'Tanpa deadline'} ·{' '}
                  {p.completedTaskCount}/{p.taskCount} task selesai
                </p>
                <ProgressBar percent={pct} barClass="bg-mk-green" />
                <span>
                  <button
                    type="button"
                    className={btnBlueClass}
                    onClick={() => openDetail(p.id)}
                  >
                    Lihat Detail
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Buat Project Baru" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Nama Project</span>
              <input
                className={inputClass}
                value={name}
                maxLength={150}
                placeholder="Contoh: Sistem Perpustakaan"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </label>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Deskripsi</span>
              <textarea
                className={inputClass}
                value={description}
                rows={3}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />
            </label>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Deadline (opsional)</span>
              <input
                className={inputClass}
                type="date"
                value={deadline}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDeadline(e.target.value)
                }
              />
            </label>
            <div className={fieldClass}>
              <span className={fieldLabelClass}>Rekomendasi Template</span>
              <button
                type="button"
                role="switch"
                aria-checked={recommendTemplate}
                aria-label="Rekomendasi Template"
                className={`${recommendTemplate ? btnYellowClass : btnClass} self-start`}
                onClick={() => setRecommendTemplate((v) => !v)}
              >
                {recommendTemplate ? 'On' : 'Off'}
              </button>
              {recommendTemplate ? (
                <p className={mutedClass}>
                  Rekomendasi template AI belum tersedia — project dibuat
                  kosong untuk sekarang.
                </p>
              ) : (
                <p className={mutedClass}>
                  Project dibuat kosong tanpa template.
                </p>
              )}
            </div>
            {createError && (
              <p className="text-mk-red font-bold">{createError}</p>
            )}
            <button
              type="submit"
              className={btnYellowClass}
              disabled={creating || !name.trim()}
            >
              {creating ? 'Menyimpan...' : 'Simpan Project'}
            </button>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus Project" onClose={() => setDeleting(null)}>
          <p>
            Hapus project <strong>{deleting.name}</strong>? Semua task di
            dalam project ini juga akan ikut terhapus. Tindakan ini tidak bisa
            dibatalkan.
          </p>
          {deleteError && (
            <p className="text-mk-red font-bold">{deleteError}</p>
          )}
          <span className="flex gap-2 flex-wrap mt-4">
            <button
              type="button"
              className={btnRedClass}
              disabled={deleteBusy}
              onClick={confirmDelete}
            >
              {deleteBusy ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => setDeleting(null)}
            >
              Batal
            </button>
          </span>
        </Modal>
      )}

      {detailId !== null && (
        <Modal
          title={detail?.name ?? 'Detail Project'}
          onClose={() => setDetailId(null)}
        >
          {detailLoading ? (
            <p className={mutedClass}>Memuat detail project...</p>
          ) : detailError ? (
            <p className="text-mk-red font-bold">{detailError}</p>
          ) : detail ? (
            <div className="flex flex-col gap-3">
              <p className={mutedClass}>
                {detail.description ?? 'Tanpa deskripsi'}
              </p>
              <p className={mutedClass}>
                Deadline:{' '}
                {detail.deadline
                  ? detail.deadline.slice(0, 10)
                  : 'Tanpa deadline'}
              </p>
              {detail.tasks.length === 0 ? (
                <p className={mutedClass}>
                  Belum ada tugas di project ini.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {detail.tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex gap-2 justify-between flex-wrap"
                    >
                      <span>
                        {t.parent_task_id ? '↳ ' : ''}
                        {t.title}
                      </span>
                      <span className={mutedClass}>
                        {labelStatus(t.status)} · {t.priority}
                        {t.deadline ? ` · ${t.deadline.slice(0, 10)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
