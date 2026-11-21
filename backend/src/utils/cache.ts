import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/**
 * Cache Redis read-through (langkah 11; Redis ditunda sampai akhir
 * per keputusan 2026-11-14).
 *
 * Bila `REDIS_URL` tidak diisi, semua operasi cache menjadi no-op
 * pass-through: `getOrSet` langsung memanggil loader dan
 * `invalidateCache` tidak melakukan apa-apa, sehingga perilaku
 * sekarang tidak berubah.
 *
 * Bila Redis tidak dapat dihubungi atau gagal di tengah jalan,
 * cache bersifat fail-open: error dicatat di log dan request
 * tetap dilayani dari sumber data — kegagalan cache tidak pernah
 * menggagalkan request.
 *
 * Kunci memakai prefix `ambado:` dan TTL singkat, supaya data
 * yang berubah di luar jalur invalidasi (mis. seed saat boot)
 * tetap kedaluwarsa dengan sendirinya.
 */

const CACHE_PREFIX = 'ambado:';

/** TTL singkat (detik) per keluarga data yang di-cache. */
export const CACHE_TTL = {
  /** Daftar industri berubah jarang; 5 menit. */
  industries: 300,
  /** Katalog izin; 5 menit. */
  permissions: 300,
  /** Ringkasan dashboard berubah tiap ada perubahan task; 1 menit. */
  dashboardSummary: 60,
} as const;

/** True bila Redis dikonfigurasi lewat `REDIS_URL`. */
export function isCacheEnabled(): boolean {
  const url = process.env['REDIS_URL'];
  return url !== undefined && url !== '';
}

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

/**
 * Klien Redis lazy singleton. Koneksi pertama dibuat saat cache
 * pertama kali dipakai; bila koneksi gagal, hasilnya `null` dan
 * cache tetap nonaktif sampai proses di-restart (fail-open).
 */
async function getClient(): Promise<RedisClientType | null> {
  if (!isCacheEnabled()) {
    return null;
  }
  if (client !== null) {
    return client;
  }
  if (connectPromise === null) {
    connectPromise = (async () => {
      const redisUrl = process.env['REDIS_URL'];
      if (!redisUrl) {
        return null;
      }
      // `reconnectStrategy: false` disengaja: bila Redis mati,
      // connect() langsung reject (bukan retry tanpa henti yang
      // menggantung request pertama) dan cache fail-open; cache
      // aktif lagi setelah proses di-restart saat Redis tersedia.
      const created = createClient({
        url: redisUrl,
        socket: { connectTimeout: 2000, reconnectStrategy: false },
      });
      created.on('error', (error: unknown) => {
        globalThis.console.error('[cache] Redis error:', error);
      });
      try {
        await created.connect();
      } catch (error) {
        globalThis.console.error(
          '[cache] Redis tidak dapat terhubung, cache dinonaktifkan:',
          error,
        );
        return null;
      }
      client = created as RedisClientType;
      return client;
    })();
  }
  return connectPromise;
}

/**
 * Read-through cache: kembalikan nilai dari Redis bila ada;
 * bila tidak ada (atau Redis tidak aktif / gagal), panggil
 * `loader`, simpan hasilnya dengan TTL, lalu kembalikan.
 * Error dari loader tidak pernah di-cache.
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const redis = await getClient();
  const fullKey = `${CACHE_PREFIX}${key}`;
  if (redis !== null) {
    try {
      const raw = await redis.get(fullKey);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch (error) {
      globalThis.console.error(
        '[cache] Gagal membaca cache, lanjut ke sumber data:',
        error,
      );
    }
  }

  const value = await loader();

  if (redis !== null) {
    try {
      await redis.setEx(fullKey, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      globalThis.console.error('[cache] Gagal menulis cache:', error);
    }
  }
  return value;
}

/**
 * Hapus semua kunci cache yang kuncinya diawali `prefix`
 * (tanpa prefix `ambado:`, mis. `industries:list:` atau
 * `dashboard:summary:<workspaceId>:`). Best-effort: tidak
 * pernah throw. Tanpa Redis, tidak melakukan apa-apa.
 */
export async function invalidateCache(prefix: string): Promise<void> {
  const redis = await getClient();
  if (redis === null) {
    return;
  }
  try {
    const pattern = `${CACHE_PREFIX}${prefix}*`;
    for await (const key of redis.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      await redis.del(key);
    }
  } catch (error) {
    globalThis.console.error('[cache] Gagal invalidasi cache:', error);
  }
}
