import type { PermissionDefView, UserPermissionsResponse } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { groupByArea, permissionArea, permissionSource } from '@/features/permissions/utils';

const catalog: PermissionDefView[] = [
  { code: 'class.changeStudentClass', defaultRoles: ['ADMIN'], description: '' },
  { code: 'points.award', defaultRoles: ['ADMIN', 'TEACHER'], description: '' },
  { code: 'points.revoke', defaultRoles: ['ADMIN'], description: '' },
  { code: 'games.unlock', defaultRoles: ['ADMIN'], description: '' },
];

describe('permissionArea / groupByArea', () => {
  it('gom theo prefix, giữ thứ tự xuất hiện; prefix lạ → other', () => {
    expect(permissionArea('points.award')).toBe('points');
    expect(permissionArea('weird.thing')).toBe('other');
    expect(groupByArea(catalog).map((g) => [g.area, g.items.length])).toEqual([
      ['class', 1],
      ['points', 2],
      ['games', 1],
    ]);
  });
});

describe('permissionSource', () => {
  const base: UserPermissionsResponse = {
    userId: 'u1',
    role: 'TEACHER',
    defaults: ['points.award'],
    groups: [
      { id: 'g1', name: 'Chủ nhiệm', permissions: ['games.unlock', 'class.changeStudentClass'] },
      { id: 'g2', name: 'Game', permissions: ['games.unlock'] },
    ],
    fromGroups: ['games.unlock', 'class.changeStudentClass'],
    overrides: [
      {
        permission: 'points.revoke',
        effect: 'GRANT',
        grantedById: null,
        grantedByName: null,
        note: null,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      {
        permission: 'points.award',
        effect: 'REVOKE',
        grantedById: null,
        grantedByName: null,
        note: null,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    effective: ['points.revoke', 'games.unlock', 'class.changeStudentClass'],
  };

  it('ghi đè thắng mặc định; nhóm liệt kê mọi nhóm chứa quyền; còn lại none', () => {
    expect(permissionSource(base, 'points.revoke')).toEqual({ kind: 'granted' });
    expect(permissionSource(base, 'points.award')).toEqual({ kind: 'revoked' });
    expect(permissionSource(base, 'games.unlock')).toEqual({ kind: 'group', names: ['Chủ nhiệm', 'Game'] });
    expect(permissionSource(base, 'class.changeStudentClass')).toEqual({
      kind: 'group',
      names: ['Chủ nhiệm'],
    });
    expect(permissionSource(base, 'stats.view')).toEqual({ kind: 'none' });
    expect(permissionSource({ ...base, overrides: [] }, 'points.award')).toEqual({ kind: 'default' });
  });
});
