import type { AuditLogView } from '@phonics/contracts';
import { describe, expect, it } from 'vitest';
import { AuditLogModel } from '@/features/audit/models/AuditLogModel';
import { t } from '@/shared/i18n';

const dto: AuditLogView = {
  id: 'a1',
  actorId: null,
  actorName: null,
  action: 'student.update',
  targetType: 'User',
  targetId: '1a2b3c4d-0000-4000-8000-000000000000',
  before: null,
  after: { displayName: 'Bin' },
  createdAt: '2026-10-01T00:00:00.000Z',
};

describe('AuditLogModel', () => {
  it('đối tượng user / class / game có trang chi tiết; loại khác thì không', () => {
    expect(new AuditLogModel(dto).targetKind).toBe('student');
    expect(new AuditLogModel({ ...dto, targetType: 'class' }).targetKind).toBe('class');
    expect(new AuditLogModel({ ...dto, targetType: 'permissionGroup' }).targetKind).toBeNull();
    expect(new AuditLogModel({ ...dto, targetId: null }).targetKind).toBeNull();
  });

  it('targetLabel rút gọn id 8 ký tự', () => {
    expect(new AuditLogModel(dto).targetLabel).toBe('User · 1a2b3c4d');
    expect(new AuditLogModel({ ...dto, targetId: null }).targetLabel).toBe('User');
  });

  it('không có người thao tác → "Hệ thống" theo ngôn ngữ hiện tại', () => {
    expect(new AuditLogModel(dto).actorText).toBe(t.points.system);
    expect(new AuditLogModel({ ...dto, actorName: 'Cô Lan' }).actorText).toBe('Cô Lan');
  });
});
