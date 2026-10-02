import type { UserPermissionsResponse } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { UserPermissionsModel } from '@/features/permissions/models/UserPermissionsModel';

const dto: UserPermissionsResponse = {
  userId: 'u1',
  role: 'TEACHER',
  defaults: ['points.award'],
  groups: [{ id: 'g1', name: 'Chủ nhiệm', permissions: ['games.unlock'] }],
  fromGroups: ['games.unlock'],
  overrides: [
    {
      permission: 'points.award',
      effect: 'REVOKE',
      grantedById: null,
      grantedByName: null,
      note: null,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ],
  effective: ['games.unlock'],
};

describe('UserPermissionsModel', () => {
  const perms = new UserPermissionsModel(dto);

  it('tra cứu quyền hiệu lực, ghi đè và nhóm', () => {
    expect(perms.has('games.unlock')).toBe(true);
    expect(perms.has('points.award')).toBe(false);
    expect(perms.overrideOf('points.award')?.effect).toBe('REVOKE');
    expect(perms.overrideOf('games.unlock')).toBeUndefined();
    expect(perms.groupIds).toEqual(['g1']);
  });

  it('sourceOf: ghi đè > mặc định > nhóm > không có', () => {
    expect(perms.sourceOf('points.award')).toEqual({ kind: 'revoked' });
    expect(perms.sourceOf('games.unlock')).toEqual({ kind: 'group', names: ['Chủ nhiệm'] });
    expect(perms.sourceOf('stats.view')).toEqual({ kind: 'none' });
  });
});
