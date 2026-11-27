/**
 * Google Identity Services (GIS) untuk login dengan Google (spec v2 §6.5).
 *
 * Hanya aktif bila `VITE_GOOGLE_CLIENT_ID` diisi — isinya sama dengan
 * `GOOGLE_CLIENT_ID` di `backend/.env`. Bila dikosongkan, halaman login
 * menampilkan catatan bahwa login Google belum dikonfigurasi, dan langkah
 * ini tidak diblokir karenanya.
 */

export function getGoogleClientId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  return id && id.trim() !== '' ? id : null;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      width?: number;
      text?: string;
    },
  ): void;
}

export interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<GoogleAccounts> | null = null;

/** Muat script GIS sekali, lalu kembalikan `window.google.accounts`. */
export function loadGoogleIdentity(): Promise<GoogleAccounts> {
  if (typeof window !== 'undefined' && window.google?.accounts) {
    return Promise.resolve(window.google.accounts);
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise<GoogleAccounts>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) {
        resolve(window.google.accounts);
      } else {
        reject(new Error('Google Identity Services tidak tersedia.'));
      }
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Gagal memuat Google Identity Services.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
