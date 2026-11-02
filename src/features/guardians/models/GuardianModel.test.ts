import type { GuardianSummary } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { GuardianModel } from '@/features/guardians/models/GuardianModel';
import { t } from '@/shared/i18n';

const dto: GuardianSummary = {
  id: 'g1',
  fullName: 'Trần Thị Mai',
  email: 'mai@example.vn',
  phone: '+84901234567',
  note: null,
  account: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  children: [
    {
      studentId: 's1',
      displayName: 'Andy',
      vietnameseName: 'Nguyễn Văn An',
      englishName: 'Andy',
      avatarKey: 'tiger',
      status: 'ACTIVE',
      loginMode: 'OWN',
      class: null,
      relation: 'MOTHER',
      isBillingContact: true,
      receivesReports: false,
      canAccess: true,
    },
    {
      studentId: 's2',
      displayName: 'Nguyễn Thị Bình',
      vietnameseName: 'Nguyễn Thị Bình',
      englishName: null,
      avatarKey: 'cat',
      status: 'PENDING',
      loginMode: 'MANAGED',
      class: null,
      relation: 'MOTHER',
      isBillingContact: true,
      receivesReports: true,
      canAccess: true,
    },
  ],
};

const account = {
  userId: 'u1',
  status: 'ACTIVE' as const,
  provider: 'LOCAL' as const,
  hasCredentials: true,
  lastLoginAt: null,
};

describe('GuardianModel', () => {
  it('accountState: chưa có / đã mời / trạng thái tài khoản', () => {
    expect(new GuardianModel(dto).accountState).toBe('NONE');
    expect(new GuardianModel({ ...dto, account: { ...account, hasCredentials: false } }).accountState).toBe(
      'INVITED',
    );
    expect(new GuardianModel({ ...dto, account: { ...account, status: 'PENDING' } }).accountState).toBe(
      'PENDING',
    );
  });

  it('canCreateAccount: cần email và chưa có tài khoản', () => {
    expect(new GuardianModel(dto).canCreateAccount).toBe(true);
    expect(new GuardianModel({ ...dto, email: null }).canCreateAccount).toBe(false);
    expect(new GuardianModel({ ...dto, account }).canCreateAccount).toBe(false);
  });

  it('label bỏ phần trống; ownLoginChildren chỉ các bé tự đăng nhập', () => {
    const g = new GuardianModel({ ...dto, phone: null });
    expect(g.label).toBe('Trần Thị Mai · mai@example.vn');
    expect(g.ownLoginChildren.map((c) => c.studentId)).toEqual(['s1']);
  });

  it('con: fullName + nhãn cờ liên kết đang bật', () => {
    const [an] = new GuardianModel(dto).children;
    expect(an?.fullName).toBe('Nguyễn Văn An (Andy)');
    expect(an?.flagLabels).toEqual([t.guardians.billing, t.guardians.canAccess]);
  });

  it('dựng từ Guardian không kèm danh sách con', () => {
    const { children: _children, ...guardian } = dto;
    expect(new GuardianModel(guardian).children).toEqual([]);
  });
});
