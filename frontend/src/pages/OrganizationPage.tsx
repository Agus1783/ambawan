// Halaman Organisasi (Tahap 2 langkah 6 + 8): divisi, anggota,
// dan undangan dari API untuk workspace aktif.
//
// Halaman ini hanya memuat data + menampilkan pesan; tiap bagian
// hidup di komponennya sendiri:
// - `components/organization/DivisionSection` — kartu divisi,
//   buat divisi, tetapkan ketua (hanya OWNER).
// - `components/organization/MemberSection` — tabel anggota, edit
//   role, hapus anggota (hanya OWNER), detail user
//   (GET /users/:id).
// - `components/organization/InvitationSection` — form undang +
//   daftar + kirim ulang (OWNER dan DIVISION_LEADER).
// Keanggotaan divisi di API dinyatakan lewat penugasan task,
// bukan kolom anggota — jadi tabel anggota tidak punya kolom
// Divisi seperti versi mock. Form undang mengundang ke workspace;
// undangan khusus proyek (project_id) belum didukung form ini.
import { useEffect, useState } from 'react';
import type { RoleName } from '../interfaces/types';
import api, {
  pesanErrorApi,
  type Division,
  type Invitation,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRoleDetail,
} from '../utils/api';
import { DivisionSection } from '../components/organization/DivisionSection';
import { InvitationSection } from '../components/organization/InvitationSection';
import { MemberSection } from '../components/organization/MemberSection';
import {
  btnClass,
  cardClass,
  mutedClass,
  stackClass,
} from '../components/ui/UiClasses';

const CAN_MANAGE_DIVISIONS: RoleName[] = ['ADMIN', 'OWNER'];
const CAN_INVITE: RoleName[] = ['ADMIN', 'OWNER', 'DIVISION_LEADER'];
const CAN_MANAGE_MEMBERS: RoleName[] = ['ADMIN', 'OWNER'];

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
          <DivisionSection
            workspaceId={activeWorkspace.id}
            divisions={divisions}
            members={members}
            canManageDivisions={CAN_MANAGE_DIVISIONS.includes(role)}
            onChanged={reload}
            onNotice={setNotice}
          />
          <MemberSection
            workspaceId={activeWorkspace.id}
            members={members}
            roles={roles}
            currentUserId={currentUserId}
            canManageMembers={CAN_MANAGE_MEMBERS.includes(role)}
            onChanged={reload}
            onNotice={setNotice}
          />
          <InvitationSection
            workspaceId={activeWorkspace.id}
            invitations={invitations}
            roles={roles}
            canInvite={CAN_INVITE.includes(role)}
            onChanged={reload}
            onNotice={setNotice}
          />
        </>
      )}
    </div>
  );
}
