// Halaman Organisasi (Tahap 2 langkah 6): divisi, anggota, dan
// undangan dari API untuk workspace aktif.
//
// - Divisi (GET /divisions?workspace_id=..., limit 100): kartu
//   nama + ketua + jumlah anggota; buat divisi (POST /divisions)
//   dan tetapkan ketua (PUT /divisions/:id/leader) — hanya OWNER
//   (izin `workspace.manage_divisions` di seed backend).
// - Anggota (GET /workspaces/:id/members): ubah role
//   (PUT /workspaces/:id/members/:userId/role) dan hapus anggota
//   (DELETE /workspaces/:id/members/:userId) — hanya OWNER
//   (izin `member.manage`). Role OWNER tidak bisa diubah atau
//   dikeluarkan (aturan server).
// - Undangan (GET/POST /workspaces/:id/invitations, POST
//   /invitations/:id/resend): kirim + daftar + kirim ulang —
//   OWNER dan DIVISION_LEADER (izin `member.invite`). Undangan
//   berlaku 7 hari; kirim ulang membuat baris baru, baris lama
//   jadi EXPIRED (spec §11.5).
// - Daftar role (GET /workspaces/:id/roles) dipakai pilihan role
//   di form undang + edit anggota; OWNER tidak bisa diundang atau
//   diberikan lewat ubah-role, jadi disaring dari pilihan.
// - Keanggotaan divisi di API dinyatakan lewat penugasan task,
//   bukan kolom anggota — jadi tabel anggota tidak lagi punya
//   kolom Divisi seperti versi mock. Form undang di sini mengundang
//   ke workspace; undangan khusus proyek (project_id) belum
//   didukung form ini.
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { RoleName } from '../interfaces/types';
import api, {
  pesanErrorApi,
  type Division,
  type Invitation,
  type InvitationStatus,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRoleDetail,
} from '../utils/api';
import { labelRoleApi } from '../utils/workspace';
import { Chip } from '../components/ui/Chip';
import { Modal } from '../components/ui/Modal';
import {
  btnBlueClass,
  btnClass,
  btnRedClass,
  btnYellowClass,
  cardBaseClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  grid3Class,
  inputClass,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
  tableTdClass,
  tableThClass,
} from '../components/ui/UiClasses';

const CAN_MANAGE_DIVISIONS: RoleName[] = ['ADMIN', 'OWNER'];
const CAN_INVITE: RoleName[] = ['ADMIN', 'OWNER', 'DIVISION_LEADER'];
const CAN_MANAGE_MEMBERS: RoleName[] = ['ADMIN', 'OWNER'];

const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'Menunggu',
  ACCEPTED: 'Diterima',
  EXPIRED: 'Kedaluwarsa',
  DECLINED: 'Ditolak',
};

const INVITATION_STATUS_CHIP: Record<InvitationStatus, string> = {
  PENDING: 'bg-mk-yellow-soft',
  ACCEPTED: 'bg-mk-green-soft',
  EXPIRED: 'bg-mk-red-soft',
  DECLINED: '',
};

function roleChipClass(roleName: string): string {
  if (roleName === 'OWNER') return 'bg-mk-red-soft';
  if (roleName === 'MANAGER') return 'bg-mk-yellow-soft';
  if (roleName === 'DIVISION_LEADER') return 'bg-mk-blue-soft';
  return '';
}

export function OrganizationPage({
  activeWorkspace,
  role,
  currentUserId,
}: {
  activeWorkspace: Workspace | null;
  role: RoleName;
  currentUserId: string;
}) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<WorkspaceRoleDetail[]>([]);
  // Workspace yang datanya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = activeWorkspace !== null && loadedFor !== activeWorkspace.id;
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Buat divisi.
  const [divisionNameInput, setDivisionNameInput] = useState('');
  const [divisionBusy, setDivisionBusy] = useState(false);
  const [divisionError, setDivisionError] = useState<string | null>(null);

  // Tetapkan ketua divisi: draf pilihan per divisi.
  const [leaderDraft, setLeaderDraft] = useState<Record<string, string>>({});
  const [leaderBusyId, setLeaderBusyId] = useState<string | null>(null);
  const [leaderError, setLeaderError] = useState<string | null>(null);

  // Undang anggota.
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [resendBusyId, setResendBusyId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // Edit role + hapus anggota.
  const [editing, setEditing] = useState<WorkspaceMember | null>(null);
  const [editRoleId, setEditRoleId] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceMember | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Role yang boleh dipilih di form undang / edit: OWNER disaring
  // (server menolak OWNER untuk undangan maupun ubah-role).
  const invitableRoles = roles.filter((r) => r.name !== 'OWNER');
  const inviteRoleValue =
    inviteRoleId || invitableRoles[0]?.id || '';

  const fetchOrganizationData = (
    workspaceId: string,
    isCancelled?: () => boolean,
  ) => {
    return Promise.all([
      api.listDivisions(workspaceId),
      api.listWorkspaceMembers(workspaceId),
      api.listInvitations(workspaceId),
      api.listWorkspaceRoles(workspaceId),
    ])
      .then(([apiDivisions, apiMembers, apiInvitations, apiRoles]) => {
        if (isCancelled?.()) return;
        setDivisions(apiDivisions);
        setMembers(apiMembers);
        setInvitations(apiInvitations);
        setRoles(apiRoles);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setError(pesanErrorApi(err));
        setDivisions([]);
        setMembers([]);
        setInvitations([]);
        setRoles([]);
      })
      .finally(() => {
        if (!isCancelled?.()) setLoadedFor(workspaceId);
      });
  };

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    let cancelled = false;
    void fetchOrganizationData(activeWorkspace.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  const reload = () => {
    if (!activeWorkspace) return;
    setLoadedFor(null);
    void fetchOrganizationData(activeWorkspace.id);
  };

  const submitDivision = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !divisionNameInput.trim() || divisionBusy) return;
    setDivisionBusy(true);
    setDivisionError(null);
    try {
      await api.createDivision({
        workspace_id: activeWorkspace.id,
        name: divisionNameInput.trim(),
      });
      setDivisionNameInput('');
      setNotice('Divisi dibuat.');
      reload();
    } catch (err) {
      setDivisionError(pesanErrorApi(err));
    } finally {
      setDivisionBusy(false);
    }
  };

  const submitLeader = async (divisionId: string) => {
    const division = divisions.find((d) => d.id === divisionId);
    const userId =
      leaderDraft[divisionId] ?? division?.leader?.id ?? '';
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
      setNotice('Ketua divisi ditetapkan.');
      reload();
    } catch (err) {
      setLeaderError(pesanErrorApi(err));
    } finally {
      setLeaderBusyId(null);
    }
  };

  const submitInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim() || !inviteRoleValue || inviteBusy) return;
    setInviteBusy(true);
    setInviteError(null);
    try {
      await api.createInvitation(activeWorkspace.id, {
        email: inviteEmail.trim(),
        role_id: inviteRoleValue,
      });
      setInviteEmail('');
      setNotice('Undangan dikirim.');
      reload();
    } catch (err) {
      setInviteError(pesanErrorApi(err));
    } finally {
      setInviteBusy(false);
    }
  };

  const submitResend = async (invitationId: string) => {
    if (resendBusyId) return;
    setResendBusyId(invitationId);
    setResendError(null);
    try {
      await api.resendInvitation(invitationId);
      setNotice('Undangan dikirim ulang.');
      reload();
    } catch (err) {
      setResendError(pesanErrorApi(err));
    } finally {
      setResendBusyId(null);
    }
  };

  const openEdit = (member: WorkspaceMember) => {
    setEditing(member);
    setEditRoleId(member.role.id);
    setEditError(null);
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !editing || !editRoleId || editBusy) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await api.updateMemberRole(activeWorkspace.id, editing.id, editRoleId);
      setEditing(null);
      setNotice('Role anggota diubah.');
      reload();
    } catch (err) {
      setEditError(pesanErrorApi(err));
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!activeWorkspace || !deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.removeMember(activeWorkspace.id, deleting.id);
      setDeleting(null);
      setNotice('Anggota dikeluarkan dari workspace.');
      reload();
    } catch (err) {
      setDeleteError(pesanErrorApi(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className={stackClass}>
        <div className={cardClass}>
          <p className={mutedClass}>
            Pilih workspace aktif dulu di menu Workspace untuk melihat
            divisi, anggota, dan undangan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={stackClass}>
      {notice && (
        <p className={mutedClass} role="status">
          {notice}
        </p>
      )}

      {loading && <p className={mutedClass}>Memuat data organisasi...</p>}

      {error && (
        <div className={cardClass}>
          <p role="alert">{error}</p>
          <button type="button" className={btnClass} onClick={reload}>
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={grid3Class}>
            {divisions.map((d) => {
              const leaderValue =
                leaderDraft[d.id] ?? d.leader?.id ?? '';
              return (
                <div className={cardClass} key={d.id}>
                  <h3 className={`${sectionTitleClass} m-0`}>Divisi {d.name}</h3>
                  <p className={mutedClass}>
                    Ketua: {d.leader?.name ?? 'Belum ditentukan'}
                  </p>
                  <p className={mutedClass}>{d.memberCount} anggota</p>
                  {CAN_MANAGE_DIVISIONS.includes(role) && (
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

          {CAN_MANAGE_DIVISIONS.includes(role) && (
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

          <div
            className={`${cardBaseClass} bg-white dark:bg-[#262626] shadow-brutal dark:shadow-brutal-light p-0 overflow-hidden`}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableThClass}>Nama</th>
                  <th className={tableThClass}>Email</th>
                  <th className={tableThClass}>Role</th>
                  <th className={tableThClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className={tableTdClass}>
                      <strong>{m.name}</strong>
                    </td>
                    <td className={tableTdClass}>{m.email}</td>
                    <td className={tableTdClass}>
                      <Chip className={roleChipClass(m.role.name)}>
                        {labelRoleApi(m.role.name)}
                      </Chip>
                    </td>
                    <td className={tableTdClass}>
                      <span className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={btnBlueClass}
                          disabled={
                            !CAN_MANAGE_MEMBERS.includes(role) ||
                            m.role.name === 'OWNER'
                          }
                          title={
                            m.role.name === 'OWNER'
                              ? 'Role OWNER tidak bisa diubah'
                              : undefined
                          }
                          onClick={() => openEdit(m)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={btnRedClass}
                          disabled={
                            !CAN_MANAGE_MEMBERS.includes(role) ||
                            m.id === currentUserId ||
                            m.role.name === 'OWNER'
                          }
                          title={
                            m.id === currentUserId
                              ? 'Akun yang sedang login tidak bisa dihapus'
                              : m.role.name === 'OWNER'
                                ? 'OWNER workspace tidak bisa dikeluarkan'
                                : undefined
                          }
                          onClick={() => setDeleting(m)}
                        >
                          Hapus
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`${tableTdClass} ${mutedClass}`}>
                      Belum ada anggota.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {CAN_INVITE.includes(role) && (
            <div className={cardClass}>
              <h3 className={sectionTitleClass}>Undang Anggota</h3>
              <p className={sectionLabelClass}>
                Undangan berlaku 7 hari. Penerima yang belum punya akun
                mendaftar dengan email yang sama, lalu otomatis menjadi
                anggota.
              </p>
              <form onSubmit={submitInvite} className={rowClass}>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Email</span>
                  <input
                    className={inputClass}
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />
                </label>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Role</span>
                  <select
                    className={inputClass}
                    value={inviteRoleValue}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setInviteRoleId(e.target.value)
                    }
                  >
                    {invitableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {labelRoleApi(r.name)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className={`${btnYellowClass} self-end`}
                  disabled={
                    inviteBusy || !inviteEmail.trim() || !inviteRoleValue
                  }
                >
                  {inviteBusy ? 'Mengirim...' : 'Kirim Undangan'}
                </button>
              </form>
              {inviteError && <p role="alert">{inviteError}</p>}
            </div>
          )}

          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Daftar Undangan</h3>
            <p className={sectionLabelClass}>
              {invitations.length} undangan
            </p>
            {resendError && <p role="alert">{resendError}</p>}
            {invitations.length === 0 && (
              <p className={mutedClass}>Belum ada undangan.</p>
            )}
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className={`${rowClass} justify-between mb-2`}
              >
                <span>
                  <strong>{inv.email}</strong>{' '}
                  <span className={mutedClass}>
                    · {labelRoleApi(inv.role.name)} · diundang oleh{' '}
                    {inv.invited_by.name} · berlaku sampai{' '}
                    {inv.expires_at.slice(0, 10)}
                  </span>
                </span>
                <span className={rowClass}>
                  <Chip className={INVITATION_STATUS_CHIP[inv.status]}>
                    {INVITATION_STATUS_LABELS[inv.status]}
                  </Chip>
                  {inv.status === 'PENDING' &&
                    CAN_INVITE.includes(role) && (
                      <button
                        type="button"
                        className={btnBlueClass}
                        disabled={resendBusyId === inv.id}
                        onClick={() => void submitResend(inv.id)}
                      >
                        {resendBusyId === inv.id
                          ? 'Mengirim...'
                          : 'Kirim Ulang'}
                      </button>
                    )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <Modal title="Edit Anggota" onClose={() => setEditing(null)}>
          <p className={mutedClass}>
            {editing.name} · {editing.email}
          </p>
          <form onSubmit={submitEdit} className="flex flex-col gap-3 mt-3">
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Role</span>
              <select
                className={inputClass}
                value={editRoleId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setEditRoleId(e.target.value)
                }
              >
                {invitableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {labelRoleApi(r.name)}
                  </option>
                ))}
              </select>
            </label>
            {editError && <p role="alert">{editError}</p>}
            <span className="flex gap-2 flex-wrap">
              <button
                type="submit"
                className={btnYellowClass}
                disabled={editBusy || !editRoleId}
              >
                {editBusy ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button
                type="button"
                className={btnClass}
                onClick={() => setEditing(null)}
              >
                Batal
              </button>
            </span>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus Anggota" onClose={() => setDeleting(null)}>
          <p>
            Hapus <strong>{deleting.name}</strong> ({deleting.email}) dari
            organisasi? Tindakan ini tidak bisa dibatalkan.
          </p>
          {deleteError && <p role="alert">{deleteError}</p>}
          <span className="flex gap-2 flex-wrap mt-4">
            <button
              type="button"
              className={btnRedClass}
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
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
    </div>
  );
}
