import type { AvatarKey, StudentClassRef, StudentSummary, UserStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Học sinh trong danh sách (từ `StudentSummary` của BE) + dữ liệu hiển thị chỉ phía FE */
export class StudentModel {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly class: StudentClassRef | null;
  readonly points: number;
  readonly rank: number | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;

  constructor(data: StudentSummary) {
    this.id = data.id;
    this.email = data.email;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.class = data.class;
    this.points = data.points;
    this.rank = data.rank;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /** "K2A · Lớp 2 · 2026-2027"; null khi chưa vào lớp */
  get classLabel(): string | null {
    return this.class ? `${this.class.name} · ${this.class.grade} · ${this.class.schoolYear}` : null;
  }

  /** Lần đăng nhập cuối theo ngôn ngữ hiện tại, "Chưa bao giờ" nếu chưa đăng nhập */
  get lastLoginText(): string {
    return this.lastLoginAt ? formatDateTime(this.lastLoginAt) : t.common.never;
  }
}
