import type { StudentDetail } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import { t } from '@/shared/i18n';

const dto: StudentDetail = {
  id: 's1',
  email: 'bin@school.vn',
  displayName: 'Bin',
  avatarKey: 'tiger',
  status: 'ACTIVE',
  class: {
    id: 'c1',
    name: 'K2A',
    grade: 'Lớp 2',
    schoolYear: '2026-2027',
    joinedAt: '2026-09-01T00:00:00.000Z',
  },
  points: 42,
  rank: 3,
  lastLoginAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  parent: { name: 'Mẹ Bin', phone: '0901 234 567' },
  notes: null,
  pointsByKind: { GAME: 40, BONUS: 2 },
  gamesPlayed: 7,
};

describe('StudentModel', () => {
  it('classLabel: null khi chưa vào lớp', () => {
    expect(new StudentModel(dto).classLabel).toBe('K2A · Lớp 2 · 2026-2027');
    expect(new StudentModel({ ...dto, class: null }).classLabel).toBeNull();
  });

  it('lastLoginText: chưa đăng nhập thì là "chưa bao giờ" theo ngôn ngữ hiện tại', () => {
    expect(new StudentModel(dto).lastLoginText).toBe(t.common.never);
  });

  it('isActive theo status', () => {
    expect(new StudentModel(dto).isActive).toBe(true);
    expect(new StudentModel({ ...dto, status: 'DISABLED' }).isActive).toBe(false);
  });
});

describe('StudentDetailModel', () => {
  it('kế thừa getter của StudentModel', () => {
    const detail = new StudentDetailModel(dto);
    expect(detail).toBeInstanceOf(StudentModel);
    expect(detail.classLabel).toBe('K2A · Lớp 2 · 2026-2027');
  });

  it('parentContactText bỏ phần trống; không có phụ huynh → chuỗi rỗng', () => {
    expect(new StudentDetailModel(dto).parentContactText).toBe('Mẹ Bin · 0901 234 567');
    expect(new StudentDetailModel({ ...dto, parent: null }).parentContactText).toBe('');
  });
});
