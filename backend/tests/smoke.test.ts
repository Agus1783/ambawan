import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';

/**
 * Smoke test HTTP end-to-end (langkah 12).
 *
 * Mem-boot aplikasi Express asli di port scratch (ephemeral) lalu
 * mengassert status code kunci per keluarga endpoint.
 *
 * Dua tingkat:
 * - Tier A (selalu jalan, tanpa database): health, envelope 404,
 *   auth 401/422, katalog izin (statis, tanpa DB), dan perilaku
 *   endpoint yang butuh DB saat DB tidak terjangkau (500 envelope).
 * - Tier B (isolasi workspace, butuh database): hanya jalan bila
 *   `DATABASE_URL` terjangkau DAN `SMOKE_TEST_WITH_DB=1`.
 *   Sengaja opt-in supaya `pnpm test` di laptop dev tidak pernah
 *   menulis ke database dev tanpa diminta. Di CI, Tier B jalan
 *   bila job backend menyediakan Postgres + skema v2.1.
 *
 * Env yang dipakai (diisi default uji bila kosong):
 * - ACCESS_TOKEN_KEY / REFRESH_TOKEN_KEY — untuk mencetak JWT uji.
 * - DATABASE_URL — bila kosong dan tidak ada `.env`, diarahkan ke
 *   port 1 (connection refused instan) supaya kegagalan DB cepat
 *   dan deterministik, bukan menggantung.
 */

const REQUEST_TIMEOUT_MS = 10_000;

let baseUrl = '';
let server: { close: (cb?: () => void) => void } | null = null;
let dbAvailable = false;
let withDb = false;

// Diisi di before() lewat dynamic import (env harus sudah final
// sebelum modul backend diimpor — `prisma/db.ts` membaca
// DATABASE_URL saat diimpor).
let TokenManager: typeof import('../src/utils/token-manager').TokenManager;
let seedSystemData: typeof import('../src/utils/seed').seedSystemData;
let pgClientCtor: typeof import('pg').Client;

interface Envelope {
  success: boolean;
  message: string;
  data: unknown;
  error?: { code: string; details: unknown };
}

async function req(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: Envelope }> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  // DELETE mengembalikan 204 tanpa body — jangan panggil .json()
  // pada body kosong.
  const text = await res.text();
  const body = text
    ? (JSON.parse(text) as Envelope)
    : { success: true, message: '', data: null };
  return { status: res.status, body };
}

function authHeaders(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

function assertErrorEnvelope(
  body: Envelope,
  code: string,
): void {
  assert.equal(body.success, false);
  assert.equal(typeof body.message, 'string');
  assert.ok(body.error, 'envelope error harus ada');
  assert.equal(body.error.code, code);
}

describe('smoke test HTTP', () => {
  before(async () => {
    // Muat `.env` dulu (bila ada) supaya DATABASE_URL dari file
    // ikut terhitung — dotenv tidak menimpa env yang sudah ada.
    await import('dotenv/config');
    process.env['ACCESS_TOKEN_KEY'] ??= 'smoke-test-access-key';
    process.env['REFRESH_TOKEN_KEY'] ??= 'smoke-test-refresh-key';
    if (!process.env['DATABASE_URL']) {
      process.env['DATABASE_URL'] =
        'postgresql://127.0.0.1:1/ambado_smoke_no_db';
    }

    const pg = await import('pg');
    pgClientCtor = pg.Client;

    // Probe database: SELECT 1 dengan timeout singkat. Gagal
    // (refused/timeout) berarti Tier A memakai jalur tanpa-DB.
    try {
      const probe = new pgClientCtor({
        connectionString: process.env['DATABASE_URL'],
        connectionTimeoutMillis: 3000,
      });
      await probe.connect();
      await probe.query('SELECT 1');
      await probe.end();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }
    withDb = dbAvailable && process.env['SMOKE_TEST_WITH_DB'] === '1';
    globalThis.console.log(
      `[smoke] database ${dbAvailable ? 'terjangkau' : 'tidak terjangkau'}; ` +
        `Tier B (isolasi workspace) ${withDb ? 'JALAN' : 'DILEWATI — set SMOKE_TEST_WITH_DB=1 + DATABASE_URL untuk menjalankannya'}`,
    );

    const serverModule = await import('../src/server/index');
    const tokenModule = await import('../src/utils/token-manager');
    const seedModule = await import('../src/utils/seed');
    TokenManager = tokenModule.TokenManager;
    seedSystemData = seedModule.seedSystemData;

    const app = serverModule.default;
    await new Promise<void>((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => {
        const address = listener.address();
        const port =
          typeof address === 'object' && address !== null
            ? address.port
            : 0;
        baseUrl = `http://127.0.0.1:${port}`;
        server = listener;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  // ---- Tier A: tanpa database ------------------------------------

  it('GET /api/v1/health -> 200 envelope sukses', async () => {
    const { status, body } = await req('/api/v1/health');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    // successResponse(res, 'OK'): 'OK' adalah message, data null.
    assert.equal(body.message, 'OK');
    assert.equal(body.data, null);
  });

  it('route tak dikenal -> 404 NOT_FOUND (envelope spec v2 §4.2)', async () => {
    const { status, body } = await req('/api/v1/route-tidak-ada');
    assert.equal(status, 404);
    assertErrorEnvelope(body, 'NOT_FOUND');
  });

  it('GET /permissions tanpa token -> 401 UNAUTHORIZED', async () => {
    const { status, body } = await req('/api/v1/permissions');
    assert.equal(status, 401);
    assertErrorEnvelope(body, 'UNAUTHORIZED');
  });

  it('GET /permissions token sampah -> 401 UNAUTHORIZED', async () => {
    const { status, body } = await req('/api/v1/permissions', {
      headers: authHeaders('token-sampah'),
    });
    assert.equal(status, 401);
    assertErrorEnvelope(body, 'UNAUTHORIZED');
  });

  it('GET /permissions token valid -> 200, katalog 25 izin (tanpa DB)', async () => {
    const token = TokenManager.generateAccessToken({
      sub: 'smoke-user-tanpa-db',
    });
    const { status, body } = await req('/api/v1/permissions', {
      headers: authHeaders(token),
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data), 'data katalog harus array');
    const catalog = body.data as Array<{ permission: string }>;
    assert.equal(catalog.length, 25);
    const names = catalog.map((p) => p.permission);
    for (const expected of [
      'workspace.view',
      'member.view',
      'dashboard.view',
      'analytics.view',
    ]) {
      assert.ok(names.includes(expected), `katalog harus memuat ${expected}`);
    }
  });

  it('POST /auth/login body kosong -> 422 VALIDATION_ERROR', async () => {
    const { status, body } = await req('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert.equal(status, 422);
    assertErrorEnvelope(body, 'VALIDATION_ERROR');
  });

  it('POST /auth/register email tidak valid -> 422 VALIDATION_ERROR', async () => {
    const { status, body } = await req('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Smoke',
        email: 'bukan-email',
        password: 'password123',
      }),
    });
    assert.equal(status, 422);
    assertErrorEnvelope(body, 'VALIDATION_ERROR');
  });

  it('POST /auth/google tanpa id_token -> 422 VALIDATION_ERROR', async () => {
    const { status, body } = await req('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert.equal(status, 422);
    assertErrorEnvelope(body, 'VALIDATION_ERROR');
  });

  it('GET /industries dengan token valid mengikuti ketersediaan DB', async () => {
    const token = TokenManager.generateAccessToken({
      sub: 'smoke-user-tanpa-db',
    });
    const { status, body } = await req('/api/v1/industries', {
      headers: authHeaders(token),
    });
    if (!dbAvailable) {
      // Tanpa DB, query gagal dan error handler membalas 500
      // dengan envelope — bukan crash, bukan HTML.
      assert.equal(status, 500);
      assertErrorEnvelope(body, 'INTERNAL_SERVER_ERROR');
    } else {
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
    }
  });

  it('GET /auth/me token valid mengikuti ketersediaan DB', async () => {
    const token = TokenManager.generateAccessToken({
      sub: 'smoke-user-tanpa-db',
    });
    const { status, body } = await req('/api/v1/auth/me', {
      headers: authHeaders(token),
    });
    if (!dbAvailable) {
      assert.equal(status, 500);
      assertErrorEnvelope(body, 'INTERNAL_SERVER_ERROR');
    } else {
      // User `smoke-user-tanpa-db` tidak ada di database.
      assert.equal(status, 404);
      assertErrorEnvelope(body, 'USER_NOT_FOUND');
    }
  });

  // ---- Tier B: isolasi workspace (butuh database) ----------------

  describe('isolasi workspace (Tier B)', () => {
    const stamp = Date.now().toString(36);
    const emailA = `smoke-a-${stamp}@example.test`;
    const emailB = `smoke-b-${stamp}@example.test`;
    let userIdA = '';
    let userIdB = '';
    let tokenA = '';
    let tokenB = '';
    let workspaceA = '';
    let workspaceB = '';

    async function registerAndLogin(
      email: string,
    ): Promise<{ userId: string; token: string }> {
      const reg = await req('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: `Smoke ${email}`,
          email,
          password: 'password123',
        }),
      });
      assert.equal(reg.status, 201, `register ${email}: ${JSON.stringify(reg.body)}`);
      const userId = (reg.body.data as { id: string }).id;
      const login = await req('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password123' }),
      });
      assert.equal(login.status, 200, `login ${email}: ${JSON.stringify(login.body)}`);
      const token = (login.body.data as { accessToken: string }).accessToken;
      assert.equal(typeof token, 'string');
      return { userId, token };
    }

    it('seed data sistem idempotent', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const result = await seedSystemData();
      assert.equal(typeof result.industries, 'number');
      assert.equal(typeof result.roles, 'number');
      assert.equal(typeof result.permissions, 'number');
    });

    it('dua user terdaftar, masing-masing login dan dapat token', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      ({ userId: userIdA, token: tokenA } = await registerAndLogin(emailA));
      ({ userId: userIdB, token: tokenB } = await registerAndLogin(emailB));
      assert.notEqual(userIdA, userIdB);
    });

    it('A membuat workspace; workspace kedua ditolak 409 (satu workspace)', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const created = await req('/api/v1/workspaces', {
        method: 'POST',
        headers: authHeaders(tokenA),
        body: JSON.stringify({ name: 'Smoke WS A', industry_id: 'ind_software' }),
      });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      workspaceA = (created.body.data as { id: string }).id;
      assert.ok(workspaceA);

      const second = await req('/api/v1/workspaces', {
        method: 'POST',
        headers: authHeaders(tokenA),
        body: JSON.stringify({ name: 'Smoke WS A 2', industry_id: 'ind_software' }),
      });
      assert.equal(second.status, 409);
      assertErrorEnvelope(second.body, 'WORKSPACE_LIMIT_REACHED');
    });

    it('B bukan anggota workspace A -> GET workspace 403 WORKSPACE_NOT_MEMBER', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const { status, body } = await req(`/api/v1/workspaces/${workspaceA}`, {
        headers: authHeaders(tokenB),
      });
      assert.equal(status, 403);
      assertErrorEnvelope(body, 'WORKSPACE_NOT_MEMBER');
    });

    it('B bukan anggota workspace A -> GET /users/:idA 404 USER_NOT_FOUND', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const { status, body } = await req(`/api/v1/users/${userIdA}`, {
        headers: authHeaders(tokenB),
      });
      assert.equal(status, 404);
      assertErrorEnvelope(body, 'USER_NOT_FOUND');
    });

    it('A pemilik workspace -> GET workspace 200; A melihat B juga 404', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const detail = await req(`/api/v1/workspaces/${workspaceA}`, {
        headers: authHeaders(tokenA),
      });
      assert.equal(detail.status, 200);
      assert.equal((detail.body.data as { id: string }).id, workspaceA);

      const other = await req(`/api/v1/users/${userIdB}`, {
        headers: authHeaders(tokenA),
      });
      assert.equal(other.status, 404);
      assertErrorEnvelope(other.body, 'USER_NOT_FOUND');
    });

    it('B bukan anggota -> GET /dashboard/summary workspace A 403', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const { status, body } = await req(
        `/api/v1/dashboard/summary?workspace_id=${workspaceA}`,
        { headers: authHeaders(tokenB) },
      );
      assert.equal(status, 403);
      assertErrorEnvelope(body, 'WORKSPACE_NOT_MEMBER');
    });

    it('B membuat workspace sendiri; A ke workspace B -> 403', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const created = await req('/api/v1/workspaces', {
        method: 'POST',
        headers: authHeaders(tokenB),
        body: JSON.stringify({ name: 'Smoke WS B', industry_id: 'ind_software' }),
      });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      workspaceB = (created.body.data as { id: string }).id;

      const cross = await req(`/api/v1/workspaces/${workspaceB}`, {
        headers: authHeaders(tokenA),
      });
      assert.equal(cross.status, 403);
      assertErrorEnvelope(cross.body, 'WORKSPACE_NOT_MEMBER');
    });

    it('dengan DB: GET /industries 200 memuat ind_software; GET /auth/me 200', async (t) => {
      if (!withDb) {
        t.skip('Tier B butuh DATABASE_URL terjangkau + SMOKE_TEST_WITH_DB=1');
        return;
      }
      const industries = await req('/api/v1/industries', {
        headers: authHeaders(tokenA),
      });
      assert.equal(industries.status, 200);
      const rows = industries.body.data as Array<{ id: string }>;
      assert.ok(rows.some((row) => row.id === 'ind_software'));

      const me = await req('/api/v1/auth/me', {
        headers: authHeaders(tokenA),
      });
      assert.equal(me.status, 200);
      assert.equal((me.body.data as { id: string }).id, userIdA);
    });

    after(async () => {
      if (!withDb) {
        return;
      }
      // Bersih-bersih best-effort di database scratch: hapus
      // workspace uji lewat API, lalu user uji lewat SQL langsung.
      try {
        if (workspaceA) {
          await req(`/api/v1/workspaces/${workspaceA}`, {
            method: 'DELETE',
            headers: authHeaders(tokenA),
          });
        }
        if (workspaceB) {
          await req(`/api/v1/workspaces/${workspaceB}`, {
            method: 'DELETE',
            headers: authHeaders(tokenB),
          });
        }
        const client = new pgClientCtor({
          connectionString: process.env['DATABASE_URL'],
          connectionTimeoutMillis: 3000,
        });
        await client.connect();
        await client.query('DELETE FROM users WHERE email LIKE $1', [
          `smoke-%-${stamp}@example.test`,
        ]);
        await client.end();
      } catch (error) {
        globalThis.console.log(`[smoke] bersih-bersih Tier B gagal (diabaikan): ${String(error)}`);
      }
    });
  });
});
