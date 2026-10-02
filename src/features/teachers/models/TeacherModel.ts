import type { AuthProvider, AvatarKey, PublicClass, TeacherSummary, UserStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Giáo viên (từ `TeacherSummary` của BE) + dữ liệu hiển thị chỉ phía FE */
export class TeacherModel {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly hasPassword: boolean;
  readonly classes: PublicClass[];
  readonly lastLoginAt: string | null;
  readonly createdAt: string;

  constructor(data: TeacherSummary) {
    this.id = data.id;
    this.email = data.email;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.provider = data.provider;
    this.hasPassword = data.hasPassword;
    this.classes = data.classes;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /** Nhãn trong ô chọn: "Cô Lan · lan@school.vn" */
  get optionLabel(): string {
    return `${this.displayName} · ${this.email}`;
  }

  /** "Có mật khẩu" hoặc "Chưa đặt mật khẩu (Google)" */
  get passwordText(): string {
    return this.hasPassword
      ? t.teachers.hasPassword
      : `${t.teachers.noPassword} (${t.provider[this.provider]})`;
  }

  get classIds(): string[] {
    return this.classes.map((cls) => cls.id);
  }
}
