import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Penyimpanan file lampiran task (spec v2 §16; langkah 10).
 *
 * Bila ketiga env Supabase terisi (SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET), file
 * diunggah ke bucket Supabase Storage dan `fileUrl` berisi URL
 * publiknya. Bila tidak terkonfigurasi, file disimpan lokal di
 * `uploads/` dan disajikan statis di `/uploads` seperti
 * sebelumnya — metadata + respons API tetap sama di kedua mode.
 *
 * Bila `SUPABASE_URL` terisi tapi bukan URL http/https yang valid
 * (mis. placeholder tanpa `https://`, atau key yang salah tempel
 * di kolom URL), konfigurasi dianggap belum terisi dan file
 * disimpan lokal, dengan peringatan di log — supaya salah isi
 * `.env` tidak membuat upload lampiran gagal 500.
 *
 * Hapus file selalu best-effort: kegagalan menghapus file fisik
 * tidak pernah menggagalkan request hapus lampiran.
 */

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

interface StorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

function getStorageConfig(): StorageConfig | null {
  const url = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  const bucket = process.env['SUPABASE_STORAGE_BUCKET'];
  if (!url || !serviceRoleKey || !bucket) {
    return null;
  }
  // createClient() throw bila URL tidak valid — validasi dulu di
  // sini supaya nilai .env yang salah tidak menggagalkan upload
  // (kasus nyata: SUPABASE_URL terisi placeholder/typo).
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('protokol bukan http/https');
    }
  } catch {
    globalThis.console.warn(
      '[storage] SUPABASE_URL tidak valid, pakai penyimpanan lokal:',
      url,
    );
    return null;
  }
  return { url, serviceRoleKey, bucket };
}

/** True bila Supabase Storage sudah dikonfigurasi (ketiga env terisi). */
export function isStorageConfigured(): boolean {
  return getStorageConfig() !== null;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(config: StorageConfig): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.serviceRoleKey);
  }
  return supabaseClient;
}

function makeStoredName(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${nanoid(12)}-${safeName}`;
}

export interface StoreAttachmentInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  taskId: string;
}

/**
 * Simpan satu file lampiran; kembalikan URL yang disimpan ke
 * `fileUrl` (URL publik Supabase, atau `/uploads/<nama>` lokal).
 * Bila Supabase dikonfigurasi tetapi upload gagal, lempar error
 * supaya endpoint gagal secara jujur (file tidak tersimpan).
 */
export async function storeAttachmentFile(
  input: StoreAttachmentInput,
): Promise<{ fileUrl: string }> {
  const config = getStorageConfig();
  const storedName = makeStoredName(input.originalName);

  if (!config) {
    await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_UPLOADS_DIR, storedName), input.buffer);
    return { fileUrl: `/uploads/${storedName}` };
  }

  const storagePath = `tasks/${input.taskId}/${storedName}`;
  const supabase = getSupabaseClient(config);
  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(storagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    });
  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }
  const { data } = supabase.storage
    .from(config.bucket)
    .getPublicUrl(storagePath);
  return { fileUrl: data.publicUrl };
}

/** Awalan URL publik bucket, dipakai untuk mengenali file Supabase. */
function getBucketPublicUrlPrefix(config: StorageConfig): string {
  const { data } = getSupabaseClient(config)
    .storage.from(config.bucket)
    .getPublicUrl('');
  return data.publicUrl;
}

/**
 * Hapus file fisik dari tempatnya disimpan (best-effort).
 * URL lokal `/uploads/<nama>` -> hapus dari `uploads/`;
 * URL publik bucket -> hapus object dari bucket; selain itu no-op.
 */
export async function deleteStoredFile(fileUrl: string): Promise<void> {
  if (fileUrl.startsWith('/uploads/')) {
    const fileName = path.basename(fileUrl);
    await fs
      .unlink(path.join(LOCAL_UPLOADS_DIR, fileName))
      .catch(() => undefined);
    return;
  }

  const config = getStorageConfig();
  if (!config) {
    return;
  }
  const prefix = getBucketPublicUrlPrefix(config);
  if (!fileUrl.startsWith(prefix)) {
    return;
  }
  const storagePath = fileUrl.slice(prefix.length);
  await getSupabaseClient(config)
    .storage.from(config.bucket)
    .remove([storagePath])
    .catch(() => undefined);
}
