// Bagian divisi di halaman Organisasi (Tahap 2 langkah 8:
// pecahan OrganizationPage).
//
// - Kartu divisi (nama + ketua + jumlah anggota) + tetapkan ketua
//   (PUT /divisions/:id/leader) — hanya OWNER.
// - Buat divisi (POST /divisions) — hanya OWNER.
// Data divisi + anggota datang dari halaman induk; setelah aksi
// berhasil, induk memuat ulang lewat `onChanged`.
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type Division,
  type WorkspaceMember,
} from '../../utils/api';
import {
  btnBlueClass,
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  grid3Class,
  inputClass,
  mutedClass,
  rowClass,
  sectionTitleClass,
} from '../ui/UiClasses';

export function DivisionSection({
  workspaceId,
  divisions,
  members,
  canManageDivisions,
  onChanged,
  onNotice,
}: {
  workspaceId: string;
  divisions: Division[];
  members: WorkspaceMember[];
  canManageDivisions: boolean;
  onChanged: () => void;
  onNotice: (message: string) => void;
}) {
  // Buat divisi.
  const [divisionNameInput, setDivisionNameInput] = useState('');
  const [divisionBusy, setDivisionBusy] = useState(false);
  const [divisionError, setDivisionError] = useState<string | null>(null);

  // Tetapkan ketua divisi: draf pilihan per divisi.
  const [leaderDraft, setLeaderDraft] = useState<Record<string, string>>({});
  const [leaderBusyId, setLeaderBusyId] = useState<string | null>(null);
  const [leaderError, setLeaderError] = useState<string | null>(null);

  const submitDivision = async (e: FormEvent) => {
    e.preventDefault();
    if (!divisionNameInput.trim() || divisionBusy) return;
    setDivisionBusy(true);
    setDivisionError(null);
    try {
      await api.createDivision({
        workspace_id: workspaceId,
        name: divisionNameInput.trim(),
      });
      setDivisionNameInput('');
      onNotice('Divisi dibuat.');
      onChanged();
    } catch (err) {
      setDivisionError(pesanErrorApi(err));
    } finally {
      setDivisionBusy(false);
    }
  };

  const submitLeader = async (divisionId: string) => {
    const division = divisions.find((d) => d.id === divisionId);
    const userId = leaderDraft[divisionId] ?? division?.leader?.id ?? '';
    if (!userId || leaderBusyId) return;
    setLeaderBusyId(divisionId);
    setLeaderError(null);
    try {
      await api.setDivisionLeader(divisionId, userId);
      setLeaderDraft((prev) => {
        const next = { ...prev };
        delete next[divisionId];
        return next;
      });
      onNotice('Ketua divisi ditetapkan.');
      onChanged();
    } catch (err) {
      setLeaderError(pesanErrorApi(err));
    } finally {
      setLeaderBusyId(null);
    }
  };

  return (
    <>
      <div className={grid3Class}>
        {divisions.map((d) => {
          const leaderValue = leaderDraft[d.id] ?? d.leader?.id ?? '';
          return (
            <div className={cardClass} key={d.id}>
              <h3 className={`${sectionTitleClass} m-0`}>
                Divisi {d.name}
              </h3>
              <p className={mutedClass}>
                Ketua: {d.leader?.name ?? 'Belum ditentukan'}
              </p>
              <p className={mutedClass}>{d.memberCount} anggota</p>
              {canManageDivisions && (
                <span className={`${rowClass} mt-3`}>
                  <select
                    className={inputClass}
                    value={leaderValue}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setLeaderDraft((prev) => ({
                        ...prev,
                        [d.id]: e.target.value,
                      }))
                    }
                    aria-label={`Ketua divisi ${d.name}`}
                  >
                    <option value="">Pilih ketua...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={btnBlueClass}
                    disabled={
                      !leaderValue ||
                      leaderValue === d.leader?.id ||
                      leaderBusyId === d.id
                    }
                    onClick={() => void submitLeader(d.id)}
                  >
                    {leaderBusyId === d.id
                      ? 'Menyimpan...'
                      : 'Tetapkan Ketua'}
                  </button>
                </span>
              )}
            </div>
          );
        })}
        {divisions.length === 0 && (
          <div className={cardClass}>
            <p className={mutedClass}>Belum ada divisi.</p>
          </div>
        )}
      </div>
      {leaderError && <p role="alert">{leaderError}</p>}

      {canManageDivisions && (
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Buat Divisi</h3>
          <form onSubmit={submitDivision} className={`${rowClass} mt-3`}>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Nama Divisi</span>
              <input
                className={inputClass}
                value={divisionNameInput}
                onChange={(e) => setDivisionNameInput(e.target.value)}
                placeholder="Contoh: IT"
              />
            </label>
            <button
              type="submit"
              className={`${btnYellowClass} self-end`}
              disabled={divisionBusy || !divisionNameInput.trim()}
            >
              {divisionBusy ? 'Menyimpan...' : 'Buat Divisi'}
            </button>
          </form>
          {divisionError && <p role="alert">{divisionError}</p>}
        </div>
      )}
    </>
  );
}
