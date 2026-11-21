import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Pengiriman email undangan (spec v2 §11; PRD §9.1).
 *
 * Konfigurasi lewat env (lihat `.env.example`):
 * - SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
 *   SMTP_FROM — bila SMTP_HOST tidak diisi, email TIDAK dikirim
 *   dan token undangan dicatat di log server seperti sebelumnya.
 * - FRONTEND_URL (atau APP_URL) — basis tautan accept undangan,
 *   default http://localhost:3000.
 *
 * Pengiriman selalu best-effort: kegagalan SMTP tidak pernah
 * menggagalkan request undangan (lihat
 * `sendInvitationEmailBestEffort`).
 */

export interface InvitationEmailInput {
  to: string;
  workspaceName: string;
  roleName: string;
  projectName: string | null;
  token: string;
  expiresAt: string;
}

interface MailConfig {
  host: string;
  port: number;
  user: string | undefined;
  pass: string | undefined;
  from: string;
}

function getMailConfig(): MailConfig | null {
  const host = process.env['SMTP_HOST'];
  if (!host) {
    return null;
  }
  const port = Number(process.env['SMTP_PORT'] ?? '587') || 587;
  const user = process.env['SMTP_USER'] || undefined;
  const pass = process.env['SMTP_PASS'] || undefined;
  return {
    host,
    port,
    user,
    pass,
    from:
      process.env['SMTP_FROM'] ??
      user ??
      'AmbaDo <no-reply@ambado.local>',
  };
}

/** True bila SMTP sudah dikonfigurasi (SMTP_HOST terisi). */
export function isMailConfigured(): boolean {
  return getMailConfig() !== null;
}

function appBaseUrl(): string {
  const base =
    process.env['FRONTEND_URL'] ??
    process.env['APP_URL'] ??
    'http://localhost:3000';
  return base.replace(/\/+$/, '');
}

/**
 * Tautan accept undangan yang dikirim ke penerima. Frontend
 * (belum ada) nantinya memakai halaman ini untuk memanggil
 * POST /invitations/:token/accept.
 */
export function buildInvitationAcceptUrl(token: string): string {
  return `${appBaseUrl()}/invitations/accept?token=${encodeURIComponent(token)}`;
}

let transporter: Transporter | null = null;

function getTransporter(config: MailConfig): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });
  }
  return transporter;
}

function invitationText(input: InvitationEmailInput): string {
  const acceptUrl = buildInvitationAcceptUrl(input.token);
  const projectLine = input.projectName
    ? `Proyek: ${input.projectName}\n`
    : '';
  return (
    `Halo,\n\n` +
    `Anda diundang untuk bergabung ke workspace "${input.workspaceName}" di AmbaDo sebagai ${input.roleName}.\n` +
    projectLine +
    `\nTerima undangan ini lewat tautan berikut:\n${acceptUrl}\n\n` +
    `Tautan berlaku sampai ${input.expiresAt}. ` +
    `Setelah itu undangan kedaluwarsa dan perlu dikirim ulang.\n\n` +
    `Abaikan email ini bila Anda tidak mengenal pengirimnya.\n`
  );
}

function invitationHtml(input: InvitationEmailInput): string {
  const acceptUrl = buildInvitationAcceptUrl(input.token);
  const projectLine = input.projectName
    ? `<p>Proyek: <strong>${input.projectName}</strong></p>`
    : '';
  return (
    `<p>Halo,</p>` +
    `<p>Anda diundang untuk bergabung ke workspace ` +
    `<strong>${input.workspaceName}</strong> di AmbaDo sebagai ` +
    `<strong>${input.roleName}</strong>.</p>` +
    projectLine +
    `<p><a href="${acceptUrl}">Terima undangan</a></p>` +
    `<p>Tautan berlaku sampai ${input.expiresAt}. Setelah itu ` +
    `undangan kedaluwarsa dan perlu dikirim ulang.</p>` +
    `<p>Abaikan email ini bila Anda tidak mengenal pengirimnya.</p>`
  );
}

/**
 * Kirim email undangan. Mengembalikan false (tanpa mengirim)
 * bila SMTP belum dikonfigurasi; melempar error bila pengiriman
 * gagal. Pemanggil yang butuh best-effort memakai
 * `sendInvitationEmailBestEffort`.
 */
export async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<boolean> {
  const config = getMailConfig();
  if (!config) {
    return false;
  }
  const transport = getTransporter(config);
  await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: `Undangan bergabung ke workspace ${input.workspaceName} di AmbaDo`,
    text: invitationText(input),
    html: invitationHtml(input),
  });
  return true;
}

/**
 * Kirim email undangan secara best-effort — tidak pernah melempar.
 * Bila SMTP belum dikonfigurasi, token dicatat di log server
 * (perilaku lama sebelum ada layanan email). Bila pengiriman
 * gagal, kegagalan dicatat di log dan request tetap berhasil.
 */
export async function sendInvitationEmailBestEffort(
  input: InvitationEmailInput,
): Promise<boolean> {
  const sent = await sendInvitationEmail(input).catch((error: unknown) => {
    globalThis.console.error(
      `Gagal mengirim email undangan ke ${input.to}:`,
      error,
    );
    return false;
  });
  if (!sent && !isMailConfigured()) {
    globalThis.console.log(
      `Undangan workspace ${input.workspaceName} untuk ${input.to}: token ${input.token}`,
    );
  }
  return sent;
}
