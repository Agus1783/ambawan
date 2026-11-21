/**
 * Seed manual data sistem: `pnpm seed`
 * (Juga dijalankan otomatis saat server boot — lihat src/server.ts.)
 * Idempotent: baris yang sudah ada dilewati.
 */
import { seedSystemData } from '../src/utils/seed';

seedSystemData()
  .then((result) => {
    globalThis.console.log(
      `Seed selesai: ${result.industries} industri, ${result.roles} role, ${result.permissions} izin ditambahkan`,
    );
    process.exit(0);
  })
  .catch((error: unknown) => {
    globalThis.console.error('Seed gagal:', error);
    process.exit(1);
  });
