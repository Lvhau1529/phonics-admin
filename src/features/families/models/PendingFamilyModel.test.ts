import type { DuplicateMatch, PendingFamily } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { PendingFamilyModel } from '@/features/families/models/PendingFamilyModel';
import { t } from '@/shared/i18n';

const match = (over: Partial<DuplicateMatch>): DuplicateMatch => ({
  kind: 'GUARDIAN_EMAIL',
  childId: null,
  inScope: true,
  guardianId: 'g-old',
  guardianName: 'Trần Thị Mai',
  studentId: null,
  studentName: null,
  className: null,
  ...over,
});

const dto: PendingFamily = {
  id: 'u1',
  parent: {
    userId: 'u1',
    guardianId: 'g-new',
    fullName: 'Trần Mai',
    email: 'mai@example.vn',
    phone: null,
    status: 'PENDING',
  },
  children: [
    {
      studentId: 's1',
      displayName: 'Andy',
      vietnameseName: 'Nguyễn Văn An',
      englishName: 'Andy',
      avatarKey: 'tiger',
      requestedClass: { id: 'c1', name: 'K2A', grade: 'Lớp 2', schoolYear: '2026-2027' },
      createdAt: '2026-11-01T00:00:00.000Z',
    },
  ],
  otherChildren: 0,
  duplicates: [],
  createdAt: '2026-11-01T00:00:00.000Z',
};

describe('PendingFamilyModel', () => {
  it('title / contactText theo phụ huynh', () => {
    const f = new PendingFamilyModel(dto);
    expect(f.title).toBe('Trần Mai');
    expect(f.contactText).toBe('mai@example.vn');
  });

  it('requestedClassText của bé', () => {
    const [child] = new PendingFamilyModel(dto).children;
    expect(child?.requestedClassText).toBe('K2A · Lớp 2 · 2026-2027');
    expect(child?.fullName).toBe('Nguyễn Văn An (Andy)');
  });

  it('mergeTargets: chỉ phụ huynh khác trong phạm vi, mỗi người một lần', () => {
    const f = new PendingFamilyModel({
      ...dto,
      duplicates: [
        match({}),
        match({ kind: 'GUARDIAN_PHONE' }),
        match({ inScope: false, guardianId: null, guardianName: null }),
        match({ guardianId: 'g-new' }),
      ],
    });
    expect(f.mergeTargets).toEqual([{ guardianId: 'g-old', guardianName: 'Trần Thị Mai' }]);
  });

  it('duplicateText: ngoài phạm vi không lộ tên gia đình kia', () => {
    const f = new PendingFamilyModel(dto);
    expect(f.duplicateText(match({ inScope: false, guardianName: null }))).toBe(
      `${t.families.duplicateKind.GUARDIAN_EMAIL}: ${t.families.duplicateOutOfScope}`,
    );
    expect(
      f.duplicateText(
        match({ kind: 'STUDENT_NAME', childId: 's1', studentName: 'Nguyễn Văn An', className: 'K1B' }),
      ),
    ).toBe(`${t.families.duplicateKind.STUDENT_NAME}: Nguyễn Văn An (Andy) ↔ Nguyễn Văn An (K1B)`);
  });
});
