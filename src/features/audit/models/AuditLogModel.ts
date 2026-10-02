import type { AuditAction, AuditLogView } from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Loại đối tượng có trang chi tiết trong admin (để dựng link) */
export type AuditTargetKind = 'student' | 'class' | 'game';

/** Một dòng nhật ký thao tác (từ `AuditLogView` của BE) + dữ liệu hiển thị chỉ phía FE */
export class AuditLogModel {
  readonly id: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly action: AuditAction;
  readonly targetType: string;
  readonly targetId: string | null;
  readonly before: unknown;
  readonly after: unknown;
  readonly createdAt: string;

  constructor(data: AuditLogView) {
    this.id = data.id;
    this.actorId = data.actorId;
    this.actorName = data.actorName;
    this.action = data.action;
    this.targetType = data.targetType;
    this.targetId = data.targetId;
    this.before = data.before;
    this.after = data.after;
    this.createdAt = data.createdAt;
  }

  /** Người thao tác; tác vụ tự động thì là "Hệ thống" */
  get actorText(): string {
    return this.actorName ?? t.points.system;
  }

  get actionLabel(): string {
    return t.audit.actions[this.action];
  }

  /** Đối tượng có trang chi tiết không (user cũng là học sinh); null = chỉ hiện nhãn */
  get targetKind(): AuditTargetKind | null {
    if (!this.targetId) return null;
    const type = this.targetType.toLowerCase();
    if (type === 'student' || type === 'user') return 'student';
    if (type === 'class' || type === 'game') return type;
    return null;
  }

  /** "class · 1a2b3c4d" (id rút gọn 8 ký tự); không có id thì chỉ loại đối tượng */
  get targetLabel(): string {
    return this.targetId ? `${this.targetType} · ${this.targetId.slice(0, 8)}` : this.targetType;
  }
}
