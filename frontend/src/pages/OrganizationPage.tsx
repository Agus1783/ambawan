// Halaman Organisasi mockup: kartu divisi + tabel anggota dengan role (RBAC).
// Aksi ADMIN: edit role/divisi anggota (modal) dan hapus anggota
// (modal konfirmasi). Semua masih state lokal; nanti disambungkan ke
// API spec §7.4 PUT /users/:id dan §7.5 DELETE /users/:id (ADMIN only).
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { RoleName, User } from '../data/mockData';
import { CURRENT_USER_ID, ROLE_LABELS, divisionName, divisions, users } from '../data/mockData';
import { Chip } from '../components/mockup/Chip';
import { Modal } from '../components/mockup/Modal';
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
  sectionTitleClass,
  stackClass,
  tableTdClass,
  tableThClass,
} from '../components/mockup/UiClasses';

export function OrganizationPage() {
  const [memberList, setMemberList] = useState<User[]>(users);
  const [editing, setEditing] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<RoleName>('MEMBER');
  const [editDivisionId, setEditDivisionId] = useState('');
  const [deleting, setDeleting] = useState<User | null>(null);

  const openEdit = (u: User) => {
    setEditing(u);
    setEditRole(u.role);
    setEditDivisionId(u.divisionId);
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setMemberList((prev) =>
      prev.map((u) => (u.id === editing.id ? { ...u, role: editRole, divisionId: editDivisionId } : u)),
    );
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setMemberList((prev) => prev.filter((u) => u.id !== deleting.id));
    setDeleting(null);
  };

  const leaderName = (leaderId: string) =>
    memberList.find((u) => u.id === leaderId)?.name ?? 'Belum ditentukan';

  return (
    <div className={stackClass}>
      <div className={grid3Class}>
        {divisions.map((d) => (
          <div className={cardClass} key={d.id}>
            <h3 className={`${sectionTitleClass} m-0`}>Divisi {d.name}</h3>
            <p className={mutedClass}>Ketua: {leaderName(d.leaderId)}</p>
            <p className={mutedClass}>{memberList.filter((u) => u.divisionId === d.id).length} anggota</p>
          </div>
        ))}
      </div>

      <div className={`${cardBaseClass} bg-white shadow-brutal p-0 overflow-hidden`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableThClass}>Nama</th>
              <th className={tableThClass}>Email</th>
              <th className={tableThClass}>Role</th>
              <th className={tableThClass}>Divisi</th>
              <th className={tableThClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {memberList.map((u) => (
              <tr key={u.id}>
                <td className={tableTdClass}><strong>{u.name}</strong></td>
                <td className={tableTdClass}>{u.email}</td>
                <td className={tableTdClass}>
                  <Chip className={u.role === 'ADMIN' ? 'bg-mk-red-soft' : u.role === 'MANAGER' ? 'bg-mk-yellow-soft' : u.role === 'DIVISION_LEADER' ? 'bg-mk-blue-soft' : ''}>
                    {ROLE_LABELS[u.role]}
                  </Chip>
                </td>
                <td className={tableTdClass}>{divisionName(u.divisionId)}</td>
                <td className={tableTdClass}>
                  <span className="flex gap-2 flex-wrap">
                    <button type="button" className={btnBlueClass} onClick={() => openEdit(u)}>Edit</button>
                    <button
                      type="button"
                      className={btnRedClass}
                      disabled={u.id === CURRENT_USER_ID}
                      title={u.id === CURRENT_USER_ID ? 'Akun yang sedang login tidak bisa dihapus' : undefined}
                      onClick={() => setDeleting(u)}
                    >
                      Hapus
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {memberList.length === 0 && (
              <tr><td colSpan={5} className={`${tableTdClass} ${mutedClass}`}>Belum ada anggota.</td></tr>
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
                value={editRole}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditRole(e.target.value as RoleName)}
              >
                {(Object.keys(ROLE_LABELS) as RoleName[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Divisi</span>
              <select
                className={inputClass}
                value={editDivisionId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditDivisionId(e.target.value)}
              >
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <span className="flex gap-2 flex-wrap">
              <button type="submit" className={btnYellowClass}>Simpan Perubahan</button>
              <button type="button" className={btnClass} onClick={() => setEditing(null)}>Batal</button>
            </span>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus Anggota" onClose={() => setDeleting(null)}>
          <p>
            Hapus <strong>{deleting.name}</strong> ({deleting.email}) dari organisasi? Tindakan ini tidak bisa
            dibatalkan.
          </p>
          <span className="flex gap-2 flex-wrap mt-4">
            <button type="button" className={btnRedClass} onClick={confirmDelete}>Ya, Hapus</button>
            <button type="button" className={btnClass} onClick={() => setDeleting(null)}>Batal</button>
          </span>
        </Modal>
      )}
    </div>
  );
}
