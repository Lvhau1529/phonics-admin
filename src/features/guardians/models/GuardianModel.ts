import {
  formatPhone,
  studentFullName,
  type AvatarKey,
  type Guardian,
  type GuardianAccount,
  type GuardianChild,
  type GuardianRelation,
  type StudentClassRef,
  type StudentGuardianView,
  type UserStatus,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Trạng thái tài khoản gia đình: chưa có / đã mời (chưa đặt mật khẩu) / trạng thái user */
export type GuardianAccountState = 'NONE' | 'INVITED' | UserStatus;

/** Nhãn các cờ liên kết phụ huynh ↔ học sinh đang bật (nhận học phí / nhận bản sao / vào hồ sơ bé) */
function linkFlagLabels(flags: {
  isBillingContact: boolean;
  receivesReports: boolean;
  canAccess: boolean;
}): string[] {
  return [
    flags.isBillingContact && t.guardians.billing,
    flags.receivesReports && t.guardians.receivesReports,
    flags.canAccess && t.guardians.canAccess,
  ].filter((label): label is string => !!label);
}

/** Một bé trong danh sách con của phụ huynh */
export class GuardianChildModel {
  readonly studentId: string;
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly status: UserStatus;
  readonly class: StudentClassRef | null;
  readonly relation: GuardianRelation;
  readonly isBillingContact: boolean;
  readonly receivesReports: boolean;
  readonly canAccess: boolean;

  constructor(data: GuardianChild) {
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.status = data.status;
    this.class = data.class;
    this.relation = data.relation;
    this.isBillingContact = data.isBillingContact;
    this.receivesReports = data.receivesReports;
    this.canAccess = data.canAccess;
  }

  get fullName(): string {
    return studentFullName(this);
  }

  get flagLabels(): string[] {
    return linkFlagLabels(this);
  }
}

/** Phụ huynh (từ `Guardian` / `GuardianSummary` của BE) */
export class GuardianModel {
  readonly id: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly note: string | null;
  readonly account: GuardianAccount | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Rỗng khi dựng từ `Guardian` không kèm danh sách con (vd trong chi tiết học sinh) */
  readonly children: GuardianChildModel[];

  constructor(data: Guardian & { children?: GuardianChild[] }) {
    this.id = data.id;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phone = data.phone;
    this.note = data.note;
    this.account = data.account;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.children = (data.children ?? []).map((c) => new GuardianChildModel(c));
  }

  get accountState(): GuardianAccountState {
    if (!this.account) return 'NONE';
    if (!this.account.hasCredentials) return 'INVITED';
    return this.account.status;
  }

  /** "Tên · email · SĐT" (bỏ phần trống) — nhãn ô chọn phụ huynh */
  get label(): string {
    return [this.fullName, this.email, this.phoneText].filter(Boolean).join(' · ');
  }

  /** SĐT hiển thị `0912 345 678` (lưu E.164 `+84912345678`); rỗng khi chưa có */
  get phoneText(): string {
    return formatPhone(this.phone);
  }

  /** Tạo tài khoản gia đình được khi chưa có tài khoản và đã có email */
  get canCreateAccount(): boolean {
    return !this.account && !!this.email;
  }

  get lastLoginText(): string {
    return this.account?.lastLoginAt ? formatDateTime(this.account.lastLoginAt) : t.common.never;
  }
}

/** Một phụ huynh của học sinh (trang chi tiết học sinh) */
export class StudentGuardianModel {
  readonly relation: GuardianRelation;
  readonly isBillingContact: boolean;
  readonly receivesReports: boolean;
  readonly canAccess: boolean;
  readonly guardian: GuardianModel;

  constructor(data: StudentGuardianView) {
    this.relation = data.relation;
    this.isBillingContact = data.isBillingContact;
    this.receivesReports = data.receivesReports;
    this.canAccess = data.canAccess;
    this.guardian = new GuardianModel(data.guardian);
  }

  get flagLabels(): string[] {
    return linkFlagLabels(this);
  }
}
