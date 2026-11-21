// Halaman Project (Tahap 2 langkah 3): project dari API, bukan mock.
//
// - Daftar project di workspace aktif (GET /projects?workspace_id=...),
//   progres dari taskCount/completedTaskCount yang dibawa list.
// - Buat project (POST /projects): nama, deskripsi, deadline, dan
//   template tugas bila ada — pilihan digabung dari saran proyek sistem
//   untuk bidang usaha workspace (GET /industries/:id/project-suggestions)
//   dan template proyek workspace (GET /workspaces/:id/project-templates);
//   pratinjau tugas template (GET /projects/templates/:id/tasks) tampil
//   saat template dipilih. Bidang usaha project ikut workspace bila
//   tidak diisi (backend, §13.2).
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
  type ProjectSuggestion,
  type ProjectTemplate,
  type TemplateTasksPreview,
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
  sectionLabelClass,
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

/** Satu pilihan template di form buat project. */
interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  origin: 'saran' | 'sistem' | 'workspace';
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
  const industryId = activeWorkspace?.industry?.id ?? null;
  const industryName = activeWorkspace?.industry?.name ?? null;

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
  const [templateId, setTemplateId] = useState('');
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Pratinjau tugas template yang dipilih.
  const [preview, setPreview] = useState<TemplateTasksPreview | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const previewLoading = templateId !== '' && previewTemplateId !== templateId;
  const previewShown =
    preview !== null && previewTemplateId === templateId && templateId !== '';

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

  useEffect(() => {
    if (!templateId) {
      return;
    }
    let cancelled = false;
    api
      .getTemplateTasksPreview(templateId)
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
          setPreviewTemplateId(templateId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewTemplateId(templateId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const openForm = () => {
    setName('');
    setDescription('');
    setDeadline('');
    setTemplateId('');
    setPreview(null);
    setPreviewTemplateId('');
    setCreateError(null);
    setTemplateOptions([]);
    setShowForm(true);
    if (!workspaceId) {
      return;
    }
    // Pilihan template dimuat saat form dibuka (bukan di effect).
    setTemplatesLoading(true);
    const suggestions = industryId
      ? api
          .getProjectSuggestions(industryId)
          .catch((): ProjectSuggestion[] => [])
      : Promise.resolve([] as ProjectSuggestion[]);
    Promise.all([
      suggestions,
      api.listProjectTemplates(workspaceId).catch((): ProjectTemplate[] => []),
    ])
      .then(([suggestionList, templateList]) => {
        const seen = new Set<string>();
        const options: TemplateOption[] = [];
        for (const s of suggestionList) {
          seen.add(s.id);
          options.push({
            id: s.id,
            name: s.name,
            description: s.description,
            origin: 'saran',
          });
        }
        for (const t of templateList) {
          if (seen.has(t.id)) {
            continue;
          }
          seen.add(t.id);
          options.push({
            id: t.id,
            name: t.name,
            description: t.description,
            origin: t.is_system ? 'sistem' : 'workspace',
          });
        }
        setTemplateOptions(options);
      })
      .finally(() => {
        setTemplatesLoading(false);
      });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !name.trim() || creating) {
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createProject({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? toIsoDatetime(deadline) : undefined,
        project_template_id: templateId || undefined,
      });
      setProjects((prev) => [
        {
          ...created,
          taskCount: created.createdTasks,
          completedTaskCount: 0,
        },
        ...prev,
      ]);
      setNotice(
        created.createdTasks > 0
          ? `Project dibuat. ${created.createdTasks} tugas dibuat dari template.`
          : 'Project dibuat.',
      );
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

  const suggestionOptions = templateOptions.filter((o) => o.origin === 'saran');
  const customOptions = templateOptions.filter(
    (o) => o.origin === 'workspace',
  );
  const systemOptions = templateOptions.filter((o) => o.origin === 'sistem');

  const renderTemplateGroup = (
    label: string,
    options: TemplateOption[],
  ) => {
    if (options.length === 0) {
      return null;
    }
    return (
      <optgroup label={label} key={label}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </optgroup>
    );
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
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Template tugas (opsional)</span>
              <select
                className={inputClass}
                value={templateId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setTemplateId(e.target.value)
                }
              >
                <option value="">
                  {templatesLoading
                    ? 'Memuat template...'
                    : 'Tanpa template — project kosong'}
                </option>
                {renderTemplateGroup(
                  industryName
                    ? `Saran untuk ${industryName}`
                    : 'Saran proyek',
                  suggestionOptions,
                )}
                {renderTemplateGroup(
                  'Template workspace',
                  customOptions,
                )}
                {renderTemplateGroup('Template sistem', systemOptions)}
              </select>
            </label>
            {previewLoading ? (
              <p className={mutedClass}>Memuat pratinjau tugas template...</p>
            ) : previewShown ? (
              <div>
                <p className={sectionLabelClass}>
                  Template &ldquo;{preview.name}&rdquo; akan membuat{' '}
                  {preview.tasks.length} tugas:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  {preview.tasks.map((t) => (
                    <li key={t.id}>
                      {t.parent_template_id ? '↳ ' : ''}
                      {t.title} · {t.priority}
                    </li>
                  ))}
                </ul>
              </div>
            ) : templateId !== '' ? (
              <p className={mutedClass}>
                Pratinjau tugas template tidak tersedia.
              </p>
            ) : null}
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
