// Bagian undangan di halaman Organisasi (Tahap 2 langkah 8:
// pecahan OrganizationPage).
//
// - Form undang (POST /workspaces/:id/invitations) — OWNER dan
//   DIVISION_LEADER. Undangan berlaku 7 hari.
// - Daftar undangan + kirim ulang (POST /invitations/:id/resend):
//   kirim ulang membuat baris baru, baris lama jadi EXPIRED.
// Data undangan + role datang dari halaman induk; setelah aksi
// berhasil, induk memuat ulang lewat `onChanged`.
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, {
  pesanErrorApi,
  type Invitation,
  type InvitationStatus,
  type WorkspaceRoleDetail,
} from '../../utils/api';
import { labelRoleApi } from '../../utils/workspace';
import { Chip } from '../ui/Chip';
import {
  btnBlueClass,
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
} from '../ui/UiClasses';

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

export function InvitationSection({
  workspaceId,
  invitations,
  roles,
  canInvite,
  onChanged,
  onNotice,
}: {
  workspaceId: string;
  invitations: Invitation[];
  roles: WorkspaceRoleDetail[];
  canInvite: boolean;
  onChanged: () => void;
  onNotice: (message: string) => void;
}) {
  // Undang anggota.
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [resendBusyId, setResendBusyId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  // Role yang boleh dipilih di form undang: OWNER disaring
  // (server menolak OWNER untuk undangan).
  const invitableRoles = roles.filter((r) => r.name !== 'OWNER');
  const inviteRoleValue = inviteRoleId || invitableRoles[0]?.id || '';

  const submitInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleValue || inviteBusy) return;
    setInviteBusy(true);
    setInviteError(null);
    try {
      await api.createInvitation(workspaceId, {
        email: inviteEmail.trim(),
        role_id: inviteRoleValue,
      });
      setInviteEmail('');
      onNotice('Undangan dikirim.');
      onChanged();
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
      onNotice('Undangan dikirim ulang.');
      onChanged();
    } catch (err) {
      setResendError(pesanErrorApi(err));
    } finally {
      setResendBusyId(null);
    }
  };

  return (
    <>
      {canInvite && (
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
        <p className={sectionLabelClass}>{invitations.length} undangan</p>
        {resendError && <p role="alert">{resendError}</p>}
        {invitations.length === 0 && (
          <p className={mutedClass}>Belum ada undangan.</p>
        )}
        {invitations.map((inv) => (
          <div key={inv.id} className={`${rowClass} justify-between mb-2`}>
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
              {inv.status === 'PENDING' && canInvite && (
                <button
                  type="button"
                  className={btnBlueClass}
                  disabled={resendBusyId === inv.id}
                  onClick={() => void submitResend(inv.id)}
                >
                  {resendBusyId === inv.id ? 'Mengirim...' : 'Kirim Ulang'}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
