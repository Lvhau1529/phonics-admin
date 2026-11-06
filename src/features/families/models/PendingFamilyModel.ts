import {
  formatPhone,
  studentFullName,
  type AvatarKey,
  type DuplicateMatch,
  type PendingChild,
  type PendingFamily,
  type PublicClass,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Bé đang chờ duyệt */
export class PendingChildModel {
  readonly studentId: string;
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly requestedClass: PublicClass | null;
  readonly createdAt: string;

  constructor(data: PendingChild) {
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.requestedClass = data.requestedClass;
    this.createdAt = data.createdAt;
  }

  /** "Nguyễn Văn An (Andy)" */
  get fullName(): string {
    return studentFullName(this);
  }

  /** "K2A · Lớp 2 · 2026-2027"; "Không chọn lớp" khi trống */
  get requestedClassText(): string {
    const cls = this.requestedClass;
    return cls ? `${cls.name} · ${cls.grade} · ${cls.schoolYear}` : t.families.noRequestedClass;
  }
}

/** Phụ huynh có sẵn có thể gộp đơn vào */
export interface MergeTarget {
  guardianId: string;
  guardianName: string;
}

/** Một đơn chờ duyệt (tài khoản phụ huynh, hoặc học sinh tự đăng ký kiểu cũ) */
export class PendingFamilyModel {
  readonly id: string;
  readonly parent: PendingFamily['parent'];
  readonly children: PendingChildModel[];
  readonly otherChildren: number;
  readonly duplicates: DuplicateMatch[];
  readonly createdAt: string;

  constructor(data: PendingFamily) {
    this.id = data.id;
    this.parent = data.parent;
    this.children = data.children.map((c) => new PendingChildModel(c));
    this.otherChildren = data.otherChildren;
    this.duplicates = data.duplicates;
    this.createdAt = data.createdAt;
  }

  /** Tên phụ huynh */
  get title(): string {
    return this.parent.fullName;
  }

  /** "email · SĐT" (bỏ phần trống) */
  get contactText(): string {
    return [this.parent.email, formatPhone(this.parent.phone)].filter(Boolean).join(' · ');
  }

  get createdAtText(): string {
    return formatDateTime(this.createdAt);
  }

  /** Phụ huynh có sẵn (trong phạm vi người xem) để gộp — chỉ khi đơn có tài khoản phụ huynh; mỗi phụ huynh một lần */
  get mergeTargets(): MergeTarget[] {
    const seen = new Map<string, MergeTarget>();
    for (const d of this.duplicates) {
      if (!d.inScope || !d.guardianId || d.guardianId === this.parent.guardianId) continue;
      if (!seen.has(d.guardianId))
        seen.set(d.guardianId, { guardianId: d.guardianId, guardianName: d.guardianName ?? t.common.none });
    }
    return [...seen.values()];
  }

  /** Một dòng cảnh báo trùng: ngoài phạm vi thì không lộ tên / lớp của gia đình kia */
  duplicateText(match: DuplicateMatch): string {
    const kind = t.families.duplicateKind[match.kind];
    if (!match.inScope) return `${kind}: ${t.families.duplicateOutOfScope}`;
    const child = match.childId ? this.children.find((c) => c.studentId === match.childId) : undefined;
    const who = [match.studentName ?? match.guardianName, match.className && `(${match.className})`]
      .filter(Boolean)
      .join(' ');
    return `${kind}: ${child ? `${child.fullName} ↔ ` : ''}${who || t.common.none}`;
  }
}
