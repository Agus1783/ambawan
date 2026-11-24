// Bagian anggota di halaman Organisasi (Tahap 2 langkah 8:
// pecahan OrganizationPage).
//
// - Tabel anggota (GET /workspaces/:id/members): klik nama untuk
//   melihat detail user (GET /users/:id — nama, email, cara daftar,
//   status onboarding, workspace bersama + role di sana).
// - Edit role (PUT /workspaces/:id/members/:userId/role) dan hapus
//   anggota (DELETE ...) — hanya OWNER. Role OWNER tidak bisa
//   diubah atau dikeluarkan (aturan server).
// Data anggota + role datang dari halaman induk; setelah aksi
// berhasil, induk memuat ulang lewat `onChanged`.
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type ApiUserDetail,
  type WorkspaceMember,
  type WorkspaceRoleDetail,
} from '../../utils/api';
import { labelRoleApi } from '../../utils/workspace';
import { Chip } from '../ui/Chip';
import { Modal } from '../ui/Modal';
import {
  btnBlueClass,
  btnClass,
  btnRedClass,
  btnYellowClass,
  cardBaseClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  mutedClass,
  tableTdClass,
  tableThClass,
} from '../ui/UiClasses';

function roleChipClass(roleName: string): string {
  if (roleName === 'OWNER') return 'bg-mk-red-soft';
  if (roleName === 'MANAGER') return 'bg-mk-yellow-soft';
  if (roleName === 'DIVISION_LEADER') return 'bg-mk-blue-soft';
  return '';
}

export function MemberSection({
  workspaceId,
  members,
  roles,
  currentUserId,
  canManageMembers,
  onChanged,
  onNotice,
}: {
  workspaceId: string;
  members: WorkspaceMember[];
  roles: WorkspaceRoleDetail[];
  currentUserId: string;
  canManageMembers: boolean;
  onChanged: () => void;
  onNotice: (message: string) => void;
}) {
  // Edit role + hapus anggota.
  const [editing, setEditing] = useState<WorkspaceMember | null>(null);
  const [editRoleId, setEditRoleId] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceMember | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Detail user (GET /users/:id).
  const [detailMember, setDetailMember] = useState<WorkspaceMember | null>(
    null,
  );
  const [detail, setDetail] = useState<ApiUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Role yang boleh dipilih di edit anggota: OWNER disaring
  // (server menolak OWNER untuk ubah-role).
  const invitableRoles = roles.filter((r) => r.name !== 'OWNER');

  const openEdit = (member: WorkspaceMember) => {
    setEditing(member);
    setEditRoleId(member.role.id);
    setEditError(null);
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !editRoleId || editBusy) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await api.updateMemberRole(workspaceId, editing.id, editRoleId);
      setEditing(null);
      onNotice('Role anggota diubah.');
      onChanged();
    } catch (err) {
      setEditError(pesanErrorApi(err));
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.removeMember(workspaceId, deleting.id);
      setDeleting(null);
      onNotice('Anggota dikeluarkan dari workspace.');
      onChanged();
    } catch (err) {
      setDeleteError(pesanErrorApi(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const openDetail = (member: WorkspaceMember) => {
    setDetailMember(member);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    api
      .getUserDetail(member.id)
      .then((user) => {
        setDetail(user);
      })
      .catch((err: unknown) => {
        setDetailError(pesanErrorApi(err));
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

  return (
    <>
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
                  <button
                    type="button"
                    className="font-bold underline underline-offset-2"
                    title="Lihat detail user"
                    onClick={() => openDetail(m)}
                  >
                    {m.name}
                  </button>
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
                        !canManageMembers || m.role.name === 'OWNER'
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
                        !canManageMembers ||
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

      {detailMember && (
        <Modal
          title="Detail Anggota"
          onClose={() => setDetailMember(null)}
        >
          <p className={mutedClass}>
            {detailMember.name} · {detailMember.email}
          </p>
          {detailLoading && (
            <p className={`${mutedClass} mt-3`}>Memuat detail...</p>
          )}
          {detailError && (
            <p role="alert" className="mt-3">
              {detailError}
            </p>
          )}
          {detail && (
            <div className="flex flex-col gap-2 mt-3">
              <p>
                <strong>Cara daftar:</strong>{' '}
                {detail.auth_provider === 'GOOGLE' ? 'Google' : 'Email'}
              </p>
              <p>
                <strong>Onboarding:</strong>{' '}
                {detail.onboarding_completed ? 'Selesai' : 'Belum selesai'}
              </p>
              <p>
                <strong>Workspace bersama:</strong>
              </p>
              <ul className="list-disc pl-5">
                {detail.workspaces.map((w) => (
                  <li key={w.id}>
                    {w.name} · {labelRoleApi(w.role.name)}
                  </li>
                ))}
                {detail.workspaces.length === 0 && (
                  <li>Tidak ada workspace bersama.</li>
                )}
              </ul>
            </div>
          )}
          <span className="flex gap-2 flex-wrap mt-4">
            <button
              type="button"
              className={btnClass}
              onClick={() => setDetailMember(null)}
            >
              Tutup
            </button>
          </span>
        </Modal>
      )}
    </>
  );
}
