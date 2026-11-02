import {
  studentFullName,
  type AvatarKey,
  type LoginMode,
  type StudentClassRef,
  type StudentSummary,
  type UserStatus,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Học sinh trong danh sách (từ `StudentSummary` của BE) + dữ liệu hiển thị chỉ phía FE */
export class StudentModel {
  readonly id: string;
  /** null với học sinh vào qua tài khoản phụ huynh */
  readonly email: string | null;
  /** Tên hiển thị trong game = tên tiếng Anh nếu có, không thì tên tiếng Việt (BE suy ra) */
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly loginMode: LoginMode;
  readonly class: StudentClassRef | null;
  readonly points: number;
  readonly rank: number | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;

  constructor(data: StudentSummary) {
    this.id = data.id;
    this.email = data.email;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.loginMode = data.loginMode;
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

  /** Email hoặc "—" (học sinh vào qua tài khoản phụ huynh không có email) */
  get emailText(): string {
    return this.email ?? t.common.none;
  }

  get isManaged(): boolean {
    return this.loginMode === 'MANAGED';
  }

  get loginModeLabel(): string {
    return t.loginMode[this.loginMode];
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
