import type { ClassSummary } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { ClassModel } from '@/features/classes/models/ClassModel';

const dto: ClassSummary = {
  id: 'c1',
  name: 'K2A',
  grade: 'Lớp 2',
  schoolYear: '2026-2027',
  joinVisible: true,
  archivedAt: null,
  studentCount: 24,
  teachers: [
    { id: 't1', displayName: 'Cô Lan', email: 'lan@school.vn', avatarKey: 'panda' },
    { id: 't2', displayName: 'Thầy Minh', email: 'minh@school.vn', avatarKey: 'lion' },
  ],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('ClassModel', () => {
  it('nhãn ô chọn ghép tên · khối · năm học', () => {
    expect(new ClassModel(dto).label).toBe('K2A · Lớp 2 · 2026-2027');
  });

  it('lớp lưu trữ không còn hiện ở form đăng ký', () => {
    const active = new ClassModel(dto);
    expect(active.isArchived).toBe(false);
    expect(active.isJoinable).toBe(true);
    const archived = new ClassModel({ ...dto, archivedAt: '2026-10-01T00:00:00.000Z' });
    expect(archived.isArchived).toBe(true);
    expect(archived.isJoinable).toBe(false);
  });

  it('teacherIds lấy từ danh sách giáo viên', () => {
    expect(new ClassModel(dto).teacherIds).toEqual(['t1', 't2']);
  });
});
