import type { StudentDetail } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import { t } from '@/shared/i18n';

const dto: StudentDetail = {
  id: 's1',
  displayName: 'Bin',
  vietnameseName: 'Nguyễn Văn Bình',
  englishName: 'Bin',
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
  guardians: null,
  notes: null,
  pointsByKind: { GAME: 40, BONUS: 2 },
  gamesPlayed: 7,
};

describe('StudentModel', () => {
  it('fullName: tên tiếng Việt + tên tiếng Anh trong ngoặc khi có', () => {
    expect(new StudentModel(dto).fullName).toBe('Nguyễn Văn Bình (Bin)');
    expect(new StudentModel({ ...dto, englishName: null }).fullName).toBe('Nguyễn Văn Bình');
  });

  it('classLabel: null khi chưa vào lớp', () => {
    expect(new StudentModel(dto).classLabel).toBe('K2A · Lớp 2 · 2026-2027');
    expect(new StudentModel({ ...dto, class: null }).classLabel).toBeNull();
  });

  it('lastLoginText: hồ sơ chưa được mở lần nào thì là "chưa bao giờ" theo ngôn ngữ hiện tại', () => {
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

  it('guardians: null khi không có quyền xem, có thì thành StudentGuardianModel', () => {
    expect(new StudentDetailModel(dto).guardians).toBeNull();
    const detail = new StudentDetailModel({
      ...dto,
      guardians: [
        {
          relation: 'MOTHER',
          isBillingContact: true,
          receivesReports: true,
          canAccess: false,
          guardian: {
            id: 'g1',
            fullName: 'Trần Thị Mai',
            email: 'mai@example.vn',
            phone: '+84901234567',
            note: null,
            account: null,
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: '2026-09-01T00:00:00.000Z',
          },
        },
      ],
    });
    expect(detail.guardians?.[0]?.guardian.fullName).toBe('Trần Thị Mai');
    expect(detail.guardians?.[0]?.flagLabels).toEqual([t.guardians.billing, t.guardians.receivesReports]);
  });
});
