import { beforeEach, describe, expect, it } from 'vitest';
import type { Workspace } from '../src/utils/api';
import {
  labelRoleApi,
  readActiveWorkspaceId,
  resolveActiveWorkspaceId,
  roleNameToGateRole,
  saveActiveWorkspaceId,
} from '../src/utils/workspace';

function makeWorkspace(id: string, roleName = 'OWNER'): Workspace {
  return {
    id,
    name: `Workspace ${id}`,
    industry: { id: 'ind_01', name: 'Software House' },
    owner_id: 'usr_01',
    is_owner: true,
    role: { id: `rol_${id}`, name: roleName, is_system: true },
  };
}

describe('workspace aktif (langkah 2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save/read round-trip dan penghapusan pilihan', () => {
    expect(readActiveWorkspaceId()).toBeNull();
    saveActiveWorkspaceId('ws_01');
    expect(readActiveWorkspaceId()).toBe('ws_01');
    saveActiveWorkspaceId(null);
    expect(readActiveWorkspaceId()).toBeNull();
  });

  it('resolve memakai id tersimpan bila masih ada di daftar', () => {
    const list = [makeWorkspace('ws_01'), makeWorkspace('ws_02')];
    expect(resolveActiveWorkspaceId(list, 'ws_02')).toBe('ws_02');
  });

  it('resolve jatuh ke workspace pertama bila id tersimpan sudah tidak ada', () => {
    const list = [makeWorkspace('ws_01'), makeWorkspace('ws_02')];
    expect(resolveActiveWorkspaceId(list, 'ws_hilang')).toBe('ws_01');
  });

  it('resolve null bila belum ada workspace', () => {
    expect(resolveActiveWorkspaceId([], null)).toBeNull();
  });

  it('roleNameToGateRole memetakan role sistem, role kustom jatuh ke MEMBER', () => {
    expect(roleNameToGateRole('OWNER')).toBe('OWNER');
    expect(roleNameToGateRole('MANAGER')).toBe('MANAGER');
    expect(roleNameToGateRole('DIVISION_LEADER')).toBe('DIVISION_LEADER');
    expect(roleNameToGateRole('FINANCE')).toBe('MEMBER');
  });

  it('labelRoleApi memakai label Indonesia untuk role sistem dan nama asli untuk role kustom', () => {
    expect(labelRoleApi('OWNER')).toBe('Owner');
    expect(labelRoleApi('DIVISION_LEADER')).toBe('Ketua Divisi');
    expect(labelRoleApi('FINANCE')).toBe('FINANCE');
  });
});
