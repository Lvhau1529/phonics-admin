import {
  studentFullName,
  type AvatarKey,
  type StudentClassRef,
  type StudentSummary,
  type UserStatus,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Học sinh trong danh sách (từ `StudentSummary` của BE) + dữ liệu hiển thị chỉ phía FE */
export class StudentModel {
  readonly id: string;
  /** Tên hiển thị trong game = tên tiếng Anh nếu có, không thì tên tiếng Việt (BE suy ra) */
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly class: StudentClassRef | null;
  readonly points: number;
  readonly rank: number | null;
  /** Lần gần nhất hồ sơ bé được mở (phụ huynh chọn bé trong game) */
  readonly lastLoginAt: string | null;
  readonly createdAt: string;

  constructor(data: StudentSummary) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.class = data.class;
    this.points = data.points;
    this.rank = data.rank;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
  }

  /** "Nguyễn Văn An (Andy)" — tên trên mọi màn quản trị */
  get fullName(): string {
    return studentFullName(this);
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /** "K2A · Lớp 2 · 2026-2027"; null khi chưa vào lớp */
  get classLabel(): string | null {
    return this.class ? `${this.class.name} · ${this.class.grade} · ${this.class.schoolYear}` : null;
  }

  /** Lần gần nhất hồ sơ bé được mở, "Chưa bao giờ" nếu chưa */
  get lastLoginText(): string {
    return this.lastLoginAt ? formatDateTime(this.lastLoginAt) : t.common.never;
  }
}
