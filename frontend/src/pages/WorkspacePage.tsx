import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type Industry,
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
  inputClass,
  mutedClass,
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
 *   Tambah Tugas).
 * - Bidang usaha baru bisa ditambahkan inline (POST /industries) —
 *   satu-satunya jalannya lewat memilih "Lainnya" di dropdown,
 *   yang otomatis membuka form bidang usaha baru di bawahnya.
 *   Tombol "Simpan bidang usaha" HANYA mengonfirmasi nama itu
 *   secara lokal (belum menyentuh database); bidang usaha baru
 *   benar-benar dibuat lewat API saat user menekan "Buat
 *   Workspace", tepat sebelum workspace-nya dibuat. Bidang usaha
 *   yang baru dibuat dipakai untuk workspace ini tapi TIDAK
 *   ditambahkan ke pilihan dropdown (dropdown hanya berisi
 *   bidang usaha sistem).
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

  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustryDescription, setNewIndustryDescription] = useState('');
  const [industryError, setIndustryError] = useState<string | null>(null);

  // Bidang usaha baru yang sudah dikonfirmasi lewat tombol "Simpan
  // bidang usaha", tapi BELUM dibuat di database. `id` baru terisi
  // setelah API POST /industries berhasil dipanggil saat submit
  // (disimpan supaya percobaan ulang tidak membuat duplikat).
  // Sengaja tidak dimasukkan ke daftar `industries` supaya tidak
  // muncul sebagai pilihan dropdown.
  const [pendingIndustry, setPendingIndustry] = useState<{
    id?: string;
    name: string;
    description: string;
  } | null>(null);

  const alreadyOwns = workspaces.some((w) => w.is_owner);
  const selectedIndustry = industries.find((i) => i.id === industryId) ?? null;
  // "Lainnya" = pemicu form bidang usaha baru (otomatis terbuka).
  const isOtherIndustry =
    selectedIndustry?.name.trim().toLowerCase() === 'lainnya';
  // Workspace bisa dibuat bila ada bidang usaha baru yang sudah
  // dikonfirmasi, atau ada bidang sistem yang dipilih (bukan
  // "Lainnya" yang masih menunggu nama baru).
  const canSubmitIndustry =
    !!pendingIndustry || (!!industryId && !isOtherIndustry);

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

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating || alreadyOwns || !canSubmitIndustry) {
      return;
    }
    setCreating(true);
    setCreateError(null);
    setIndustryError(null);
    try {
      // Bidang usaha baru baru dibuat di database SEKARANG (bila
      // ada yang dikonfirmasi), tepat sebelum workspace-nya.
      let industryIdToUse = industryId;
      if (pendingIndustry) {
        if (pendingIndustry.id) {
          // Sudah dibuat pada percobaan sebelumnya yang gagal di
          // langkah workspace — pakai lagi, jangan buat duplikat.
          industryIdToUse = pendingIndustry.id;
        } else {
          try {
            const createdIndustry = await api.createIndustry({
              name: pendingIndustry.name,
              description: pendingIndustry.description || undefined,
            });
            industryIdToUse = createdIndustry.id;
            setPendingIndustry({
              ...pendingIndustry,
              id: createdIndustry.id,
            });
          } catch (err: unknown) {
            // Gagal di langkah bidang usaha: tampilkan di dekat
            // form-nya dan buka lagi form itu (nama masih terisi)
            // supaya bisa diperbaiki, tanpa menyentuh workspace.
            setIndustryError(pesanErrorApi(err));
            setPendingIndustry(null);
            return;
          }
        }
      }
      const created = await api.createWorkspace({
        name: name.trim(),
        industry_id: industryIdToUse,
      });
      onWorkspaceCreated(created);
      setName('');
      setPendingIndustry(null);
      setIndustryId('');
      // Workspace berhasil dibuat: daftar tampil, form pembuatan
      // hilang.
      setShowForm(false);
    } catch (err: unknown) {
      setCreateError(pesanErrorApi(err));
    } finally {
      setCreating(false);
    }
  };

  // "Simpan bidang usaha" hanya mengonfirmasi nama secara lokal —
  // TIDAK memanggil API. Pembuatan di database terjadi di
  // submitCreate, saat user menekan "Buat Workspace".
  const confirmNewIndustry = () => {
    if (!newIndustryName.trim()) {
      return;
    }
    setPendingIndustry({
      name: newIndustryName.trim(),
      description: newIndustryDescription.trim(),
    });
    setIndustryError(null);
  };

  return (
    <div className={`${stackClass} flex-1 justify-center`}>
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
          {pendingIndustry ? (
            <div className={fieldClass}>
              <span className={fieldLabelClass}>Bidang usaha</span>
              <span className="flex items-center gap-3 flex-wrap">
                <strong>{pendingIndustry.name}</strong>
                <button
                  type="button"
                  className={btnClass}
                  onClick={() => {
                    setPendingIndustry(null);
                    setIndustryId('');
                  }}
                >
                  Ganti
                </button>
              </span>
            </div>
          ) : (
            <>
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Bidang usaha</span>
                <select
                  className={inputClass}
                  value={industryId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setIndustryId(e.target.value)
                  }
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
              {isOtherIndustry && (
                <span className="flex gap-3 items-end flex-wrap">
                  <label className={fieldClass}>
                    <span className={fieldLabelClass}>
                      Nama bidang usaha baru
                    </span>
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
                    <span className={fieldLabelClass}>
                      Deskripsi (opsional)
                    </span>
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
                    disabled={!newIndustryName.trim()}
                    onClick={confirmNewIndustry}
                  >
                    Simpan bidang usaha
                  </button>
                  <button
                    type="button"
                    className={btnClass}
                    // Batal berarti kembali ke "Pilih bidang usaha".
                    onClick={() => setIndustryId('')}
                  >
                    Batal
                  </button>
                </span>
              )}
              {industryError && (
                <p className="text-mk-red font-bold">{industryError}</p>
              )}
            </>
          )}
          <span className="flex gap-2 flex-wrap">
            <button
              type="submit"
              className={btnYellowClass}
              disabled={
                creating || alreadyOwns || !name.trim() || !canSubmitIndustry
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
    </div>
  );
}
