import { User, type User as UserDto } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { UserModel } from '@/features/auth/models/UserModel';

const dto: UserDto = {
  id: '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b',
  email: 'lan@school.vn',
  role: 'TEACHER',
  status: 'ACTIVE',
  provider: 'LOCAL',
  displayName: 'Cô Lan',
  avatarKey: 'panda',
  class: null,
  createdAt: '2026-10-01T08:30:00.000Z',
};

describe('UserModel', () => {
  it('giữ nguyên field của DTO và có getter theo role', () => {
    const user = new UserModel(dto);
    expect(user.displayName).toBe('Cô Lan');
    expect(user.isAdmin).toBe(false);
    expect(user.isStudent).toBe(false);
    expect(new UserModel({ ...dto, role: 'ADMIN' }).isAdmin).toBe(true);
    expect(new UserModel({ ...dto, role: 'STUDENT' }).isStudent).toBe(true);
  });

  it('toJSON → localStorage → parse schema → model: không mất dữ liệu, không lẫn getter', () => {
    const stored = JSON.parse(JSON.stringify({ user: new UserModel(dto) })) as { user: unknown };
    expect(stored.user).toEqual(dto);
    const restored = new UserModel(User.parse(stored.user));
    expect(restored.toJSON()).toEqual(dto);
  });
});
