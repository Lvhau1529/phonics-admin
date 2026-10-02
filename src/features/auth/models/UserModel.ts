import type { AuthProvider, AvatarKey, Role, StudentClassRef, User, UserStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

/** Người dùng đang đăng nhập (từ `User` của BE) + dữ liệu chỉ phía FE dùng */
export class UserModel {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly displayName: string;
  readonly avatarKey: AvatarKey;
  readonly class: StudentClassRef | null;
  readonly createdAt: string;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.provider = data.provider;
    this.displayName = data.displayName;
    this.avatarKey = data.avatarKey;
    this.class = data.class;
    this.createdAt = data.createdAt;
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isStudent(): boolean {
    return this.role === 'STUDENT';
  }

  /** "Google" / "Email" theo ngôn ngữ hiện tại */
  get providerLabel(): string {
    return t.provider[this.provider];
  }

  /** DTO gốc — dùng khi lưu localStorage (đọc lại bằng schema `User` rồi `new UserModel`) */
  toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      status: this.status,
      provider: this.provider,
      displayName: this.displayName,
      avatarKey: this.avatarKey,
      class: this.class,
      createdAt: this.createdAt,
    };
  }
}
