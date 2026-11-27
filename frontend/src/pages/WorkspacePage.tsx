import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type Industry,
  type ProjectSuggestion,
  type Workspace,
} from '../utils/api';
import { labelRoleApi } from '../utils/workspace';
import { Chip } from '../components/ui/Chip';
import {
  btnBlueClass,
  btnClass,
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  grid2Class,
  inputClass,
  mutedClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
} from '../components/ui/UiClasses';

/**
 * Halaman Workspace (Tahap 2 langkah 2): workspace dari API.
 *
 * - Daftar workspace yang diikuti user (GET /workspaces) + pilih aktif.
 * - Buat workspace (POST /workspaces): nama + bidang usaha dari
 *   GET /industries. Backend membatasi satu workspace yang dimiliki
 *   per akun — jadi card BUAT WORKSPACE hanya muncul bila user belum
 *   memiliki workspace, dibuka lewat tombol "+ Buat Workspace", dan
 *   hilang lagi setelah workspace berhasil dibuat (sama seperti form
 *   Tambah Tugas). Saran proyek di bawahnya ikut tampil hanya saat
 *   form pembuatan sedang terbuka.
 * - Bidang usaha baru bisa ditambahkan inline (POST /industries).
 * - Saran proyek sistem untuk bidang usaha yang dipilih
 *   (GET /industries/:id/project-suggestions) — dipakai saat membuat
 *   proyek (langkah 3).
 */
export function WorkspacePage({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onWorkspaceCreated,
}: {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (id: string) => void;
  onWorkspaceCreated: (workspace: Workspace) => void;
}) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [industryId, setIndustryId] = useState(
    () => activeWorkspace?.industry?.id ?? '',
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showNewIndustry, setShowNewIndustry] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustryDescription, setNewIndustryDescription] = useState('');
  const [creatingIndustry, setCreatingIndustry] = useState(false);
  const [industryError, setIndustryError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>([]);
  // Industri yang menjadi asal daftar saran saat ini; dipakai untuk
  // menurunkan status loading (tanpa setState sinkron di dalam effect).
  const [suggestionsIndustryId, setSuggestionsIndustryId] = useState('');
  const suggestionsLoading =
    industryId !== '' && suggestionsIndustryId !== industryId;

  const alreadyOwns = workspaces.some((w) => w.is_owner);
  const selectedIndustry = industries.find((i) => i.id === industryId) ?? null;

  // Form buat workspace hanya dibuka lewat tombol, dan hanya bila
  // user belum memiliki workspace (batas backend: satu per akun).
  const [showForm, setShowForm] = useState(false);
  const canCreate = !alreadyOwns;

  useEffect(() => {
    let cancelled = false;
    api
      .listIndustries()
      .then((items) => {
        if (!cancelled) {
          setIndustries(items);
          setIndustriesError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setIndustriesError(pesanErrorApi(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIndustriesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!industryId) {
      return;
    }
    let cancelled = false;
    api
      .getProjectSuggestions(industryId)
      .then((items) => {
        if (!cancelled) {
          setSuggestions(items);
          setSuggestionsIndustryId(industryId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestionsIndustryId(industryId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [industryId]);

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !industryId || creating || alreadyOwns) {
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createWorkspace({
        name: name.trim(),
        industry_id: industryId,
      });
      onWorkspaceCreated(created);
      setName('');
      // Workspace berhasil dibuat: daftar tampil, form pembuatan
      // (dan saran proyek di bawahnya) hilang.
      setShowForm(false);
    } catch (err: unknown) {
      setCreateError(pesanErrorApi(err));
    } finally {
      setCreating(false);
    }
  };

  const submitNewIndustry = async (e: FormEvent) => {
    e.preventDefault();
    if (!newIndustryName.trim() || creatingIndustry) {
      return;
    }
    setCreatingIndustry(true);
    setIndustryError(null);
    try {
      const created = await api.createIndustry({
        name: newIndustryName.trim(),
        description: newIndustryDescription.trim() || undefined,
      });
      setIndustries((prev) => [...prev, created]);
      setIndustryId(created.id);
      setNewIndustryName('');
      setNewIndustryDescription('');
      setShowNewIndustry(false);
    } catch (err: unknown) {
      setIndustryError(pesanErrorApi(err));
    } finally {
      setCreatingIndustry(false);
    }
  };

  return (
    <div className={stackClass}>
      <section>
        <h2 className={`${sectionTitleClass} text-center`}>Workspace Saya</h2>
        {workspaces.length === 0 ? (
          <p className={`${mutedClass} text-center`}>Belum ada workspace.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-5">
            {workspaces.map((w) => {
              const isActive = activeWorkspace?.id === w.id;
              return (
                <div className={`${cardClass} w-full max-w-md`} key={w.id}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className={`${sectionTitleClass} m-0`}>{w.name}</h3>
                    {isActive && <Chip className="bg-mk-yellow">Aktif</Chip>}
                  </div>
                  <p className={mutedClass}>
                    Bidang usaha: {w.industry?.name ?? 'Belum ditentukan'}
                  </p>
                  <p className={mutedClass}>
                    Role kamu: {labelRoleApi(w.role.name)}
                    {w.is_owner ? ' · Pemilik workspace' : ''}
                  </p>
                  {!isActive && (
                    <button
                      type="button"
                      className={btnBlueClass}
                      onClick={() => onSelectWorkspace(w.id)}
                    >
                      Pilih sebagai aktif
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {canCreate && !showForm && (
          <span className="mt-3 flex justify-center">
            <button
              type="button"
              className={btnYellowClass}
              onClick={() => setShowForm(true)}
            >
              + Buat Workspace
            </button>
          </span>
        )}
      </section>

      {canCreate && showForm && (
        <section className={cardClass}>
          <h2 className={sectionTitleClass}>Buat Workspace</h2>
          <p className={mutedClass}>
            Satu akun hanya bisa memiliki satu workspace. Setelah dibuat, kamu
            menjadi Owner workspace tersebut.
          </p>
        <form onSubmit={submitCreate} className="flex flex-col gap-3 mt-3">
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Nama workspace</span>
            <input
              className={inputClass}
              value={name}
              disabled={alreadyOwns}
              maxLength={150}
              placeholder="cth. PT Maju Bersama"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
          </label>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Bidang usaha</span>
            <select
              className={inputClass}
              value={industryId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const next = e.target.value;
                setIndustryId(next);
                if (!next) {
                  setSuggestions([]);
                }
              }}
            >
              <option value="">
                {industriesLoading
                  ? 'Memuat bidang usaha...'
                  : 'Pilih bidang usaha'}
              </option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </label>
          {industriesError && (
            <p className="text-mk-red font-bold">{industriesError}</p>
          )}
          {!showNewIndustry ? (
            <span>
              <button
                type="button"
                className={btnClass}
                onClick={() => setShowNewIndustry(true)}
              >
                + Bidang usaha baru
              </button>
            </span>
          ) : (
            <span className="flex gap-3 items-end flex-wrap">
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Nama bidang usaha baru</span>
                <input
                  className={inputClass}
                  value={newIndustryName}
                  maxLength={100}
                  placeholder="cth. Rumah Makan"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewIndustryName(e.target.value)
                  }
                />
              </label>
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Deskripsi (opsional)</span>
                <input
                  className={inputClass}
                  value={newIndustryDescription}
                  maxLength={500}
                  placeholder="Deskripsi singkat"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewIndustryDescription(e.target.value)
                  }
                />
              </label>
              <button
                type="button"
                className={btnBlueClass}
                disabled={creatingIndustry || !newIndustryName.trim()}
                onClick={submitNewIndustry}
              >
                {creatingIndustry ? 'Menyimpan...' : 'Simpan bidang usaha'}
              </button>
              <button
                type="button"
                className={btnClass}
                onClick={() => setShowNewIndustry(false)}
              >
                Batal
              </button>
            </span>
          )}
          {industryError && (
            <p className="text-mk-red font-bold">{industryError}</p>
          )}
          <span className="flex gap-2 flex-wrap">
            <button
              type="submit"
              className={btnYellowClass}
              disabled={
                creating || alreadyOwns || !name.trim() || !industryId
              }
            >
              {creating ? 'Membuat...' : 'Buat Workspace'}
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
          </span>
          {createError && (
            <p className="text-mk-red font-bold">{createError}</p>
          )}
        </form>
        </section>
      )}

      {canCreate && showForm && (
        <section>
          <h2 className={sectionTitleClass}>Saran Proyek</h2>
          {!selectedIndustry ? (
            <p className={mutedClass}>
              Pilih bidang usaha di atas untuk melihat saran proyek dari AmbaDo.
            </p>
          ) : suggestionsLoading ? (
            <p className={mutedClass}>Memuat saran proyek...</p>
          ) : suggestions.length === 0 ? (
            <p className={mutedClass}>
              Belum ada saran proyek untuk bidang usaha{' '}
              {selectedIndustry.name}.
            </p>
          ) : (
            <>
              <p className={sectionLabelClass}>
                Saran proyek untuk bidang usaha {selectedIndustry.name} — bisa
                dipilih saat membuat proyek:
              </p>
              <div className={grid2Class}>
                {suggestions.map((s) => (
                  <div className={cardClass} key={s.id}>
                    <h3 className={`${sectionTitleClass} m-0`}>{s.name}</h3>
                    {s.description && (
                      <p className={mutedClass}>{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          </section>
      )}
    </div>
  );
}
