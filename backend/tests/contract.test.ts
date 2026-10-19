import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED_MODELS = [
  'Roles',
  'Users',
  'Divisions',
  'Projects',
  'Tasks',
  'TaskHistory',
  'TaskAttachments',
];

describe('artefak prisma contract', () => {
  it('contract.prisma mendeklarasikan ke-7 model', () => {
    const path = join(backendDir, 'prisma', 'contract.prisma');
    assert.ok(existsSync(path), 'prisma/contract.prisma tidak ditemukan');
    const content = readFileSync(path, 'utf8');
    for (const model of EXPECTED_MODELS) {
      assert.ok(
          content.includes(`model ${model} `),
          `model ${model} tidak dideklarasikan di contract.prisma`,
      );
    }
  });

  it('contract.json valid dan memuat ke-7 model yang sama', () => {
    const path = join(backendDir, 'prisma', 'contract.json');
    assert.ok(existsSync(path), 'prisma/contract.json tidak ditemukan');
    const contract = JSON.parse(readFileSync(path, 'utf8'));
    const models = contract?.domain?.namespaces?.public?.models;
    assert.ok(models, 'struktur domain.namespaces.public.models tidak ada');
    assert.deepEqual(Object.keys(models).sort(), [...EXPECTED_MODELS].sort());
  });

  it('contract.d.ts ada dan tidak kosong', () => {
    const path = join(backendDir, 'prisma', 'contract.d.ts');
    assert.ok(existsSync(path), 'prisma/contract.d.ts tidak ditemukan');
    assert.ok(statSync(path).size > 0, 'prisma/contract.d.ts kosong');
  });

  it('prisma.config.ts menunjuk ke contract yang benar', () => {
    const path = join(backendDir, 'prisma.config.ts');
    assert.ok(existsSync(path), 'prisma.config.ts tidak ditemukan');
    const content = readFileSync(path, 'utf8');
    assert.ok(
        content.includes('prisma/contract.prisma'),
        'prisma.config.ts tidak mereferensikan prisma/contract.prisma',
    );
  });

  it('prisma/db.ts (database client) tersedia', () => {
    const path = join(backendDir, 'prisma', 'db.ts');
    assert.ok(existsSync(path), 'prisma/db.ts tidak ditemukan');
  });
});

describe('dokumentasi environment', () => {
  it('.env.example mendokumentasikan DATABASE_URL', () => {
    const path = join(backendDir, '.env.example');
    assert.ok(existsSync(path), '.env.example tidak ditemukan');
    const content = readFileSync(path, 'utf8');
    assert.ok(
        content.includes('DATABASE_URL'),
        '.env.example tidak mendokumentasikan DATABASE_URL',
    );
  });
});
