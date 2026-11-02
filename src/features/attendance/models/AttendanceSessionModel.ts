import {
  studentFullName,
  type AffectedRecord,
  type AttendanceMark,
  type AttendanceRecord,
  type AttendanceRecordSource,
  type AttendanceSessionDetail,
  type AttendanceSessionStatus,
  type AttendanceSessionSummary,
  type AvatarKey,
  type ConfirmedVia,
  type DigestSession,
  type ExtraSlotRef,
  type StudentAttendanceItem,
  type TeacherRef,
} from '@phonics/contracts';
import { isoWeekday } from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';
import { dayjs } from '@/shared/utils/dayjs';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

/** "T3 03/11/2026" — thứ (theo ngày) + ngày */
export function sessionDateText(date: string): string {
  // dayjs().day(): 0 = Chủ nhật → ISO 7
  const day = dayjs(date).day();
  return `${t.weekdayShort[isoWeekday(day === 0 ? 7 : day)]} ${formatDate(date)}`;
}

/** Chênh lệch tiền khi áp giá mới cho các bản ghi đã xác nhận (chỉ tính bản ghi có tính phí) */
export function affectedDelta(records: readonly AffectedRecord[]): number {
  return records.reduce((sum, r) => (r.charged ? sum + r.newPrice - r.oldPrice : sum), 0);
}

/** "+120.000 ₫" / "-50.000 ₫" / "0 ₫" */
export function signedMoney(n: number): string {
  return n > 0 ? `+${formatMoney(n)}` : formatMoney(n);
}

/** Buổi điểm danh (danh sách) */
export class AttendanceSessionModel {
  readonly id: string;
  readonly slot: ExtraSlotRef | null;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly teachers: TeacherRef[];
  readonly status: AttendanceSessionStatus;
  readonly studentCount: number;
  readonly presentCount: number;
  readonly recordsVersion: number;
  readonly missingRateCount: number;
  readonly confirmedBy: { id: string; displayName: string } | null;
  readonly confirmedAt: string | null;
  readonly confirmedVia: ConfirmedVia | null;
  readonly cancelReason: string | null;
  readonly note: string | null;

  constructor(data: AttendanceSessionSummary) {
    this.id = data.id;
    this.slot = data.slot;
    this.date = data.date;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.startsAt = data.startsAt;
    this.endsAt = data.endsAt;
    this.teachers = data.teachers;
    this.status = data.status;
    this.studentCount = data.studentCount;
    this.presentCount = data.presentCount;
    this.recordsVersion = data.recordsVersion;
    this.missingRateCount = data.missingRateCount;
    this.confirmedBy = data.confirmedBy;
    this.confirmedAt = data.confirmedAt;
    this.confirmedVia = data.confirmedVia;
    this.cancelReason = data.cancelReason;
    this.note = data.note;
  }

  /** Buổi bù tạo tay (không theo ca) */
  get isMakeUp(): boolean {
    return this.slot === null;
  }

  get title(): string {
    return this.slot?.name ?? t.attendance.makeUp;
  }

  get dateText(): string {
    return sessionDateText(this.date);
  }

  get timeRange(): string {
    return `${this.startTime}–${this.endTime}`;
  }

  get teacherNames(): string {
    return this.teachers.length ? this.teachers.map((tc) => tc.displayName).join(', ') : t.common.none;
  }

  /** "7 / 8" — có mặt / sĩ số */
  get presentText(): string {
    return `${this.presentCount} / ${this.studentCount}`;
  }

  get statusLabel(): string {
    return t.attendanceStatus[this.status];
  }

  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  get isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }

  /** "Cô Lan · 03/11/2026 21:05 · qua mail"; null khi chưa xác nhận */
  get confirmedText(): string | null {
    if (!this.confirmedAt) return null;
    const via = this.confirmedVia ? t.confirmedVia[this.confirmedVia] : null;
    return [this.confirmedBy?.displayName, formatDateTime(this.confirmedAt), via].filter(Boolean).join(' · ');
  }
}

/** Một học sinh trong buổi */
export class AttendanceRecordModel {
  readonly studentId: string;
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly mark: AttendanceMark;
  readonly charged: boolean;
  readonly unitPrice: number | null;
  readonly missingRate: boolean;
  readonly source: AttendanceRecordSource;
  readonly note: string | null;
  readonly updatedAt: string;

  constructor(data: AttendanceRecord) {
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.mark = data.mark;
    this.charged = data.charged;
    this.unitPrice = data.unitPrice;
    this.missingRate = data.missingRate;
    this.source = data.source;
    this.note = data.note;
    this.updatedAt = data.updatedAt;
  }

  get fullName(): string {
    return studentFullName(this);
  }

  get isManual(): boolean {
    return this.source === 'MANUAL';
  }

  get markLabel(): string {
    return t.attendanceMark[this.mark];
  }

  get sourceLabel(): string {
    return t.attendanceSource[this.source];
  }

  /** null khi người xem không có quyền xem giá */
  get priceText(): string | null {
    return this.unitPrice === null ? null : formatMoney(this.unitPrice);
  }
}

/** Buổi + danh sách học sinh + cờ quyền */
export class AttendanceSessionDetailModel extends AttendanceSessionModel {
  readonly records: AttendanceRecordModel[];
  readonly canEdit: boolean;
  readonly canEditBilling: boolean;

  constructor(data: AttendanceSessionDetail) {
    super(data);
    this.records = data.records.map((r) => new AttendanceRecordModel(r));
    this.canEdit = data.canEdit;
    this.canEditBilling = data.canEditBilling;
  }

  /** Điểm danh / thêm / bớt học sinh được (có quyền và buổi chưa huỷ) */
  get editable(): boolean {
    return this.canEdit && !this.isCancelled;
  }

  /** Tổng tiền các bản ghi tính phí — null khi không xem được giá */
  get chargedTotal(): number | null {
    if (this.records.some((r) => r.unitPrice === null)) return null;
    return this.records.reduce((sum, r) => (r.charged ? sum + (r.unitPrice ?? 0) : sum), 0);
  }
}

/** Một buổi trên trang duyệt nhanh qua mail */
export class DigestSessionModel {
  readonly id: string;
  readonly slotName: string | null;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly studentCount: number;
  readonly presentCount: number;
  readonly status: AttendanceSessionStatus;
  readonly changed: boolean;
  readonly confirmedByName: string | null;
  readonly confirmedAt: string | null;

  constructor(data: DigestSession) {
    this.id = data.id;
    this.slotName = data.slotName;
    this.date = data.date;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.studentCount = data.studentCount;
    this.presentCount = data.presentCount;
    this.status = data.status;
    this.changed = data.changed;
    this.confirmedByName = data.confirmedByName;
    this.confirmedAt = data.confirmedAt;
  }

  get title(): string {
    return this.slotName ?? t.attendance.makeUp;
  }

  get dateText(): string {
    return sessionDateText(this.date);
  }

  get timeRange(): string {
    return `${this.startTime}–${this.endTime}`;
  }

  /** "8 học sinh · 7 có mặt" */
  get countText(): string {
    return t.attendance.countText(this.studentCount, this.presentCount);
  }

  /** Duyệt được qua link: còn chờ và danh sách chưa đổi sau khi gửi mail */
  get canConfirm(): boolean {
    return this.status === 'PENDING' && !this.changed;
  }

  /** "Đã xác nhận bởi Cô Lan lúc 03/11/2026 21:05" */
  get confirmedText(): string | null {
    if (this.status !== 'CONFIRMED') return null;
    return t.attendance.confirmedBy(this.confirmedByName ?? t.common.none, formatDateTime(this.confirmedAt));
  }
}

/** Một buổi trong bảng điểm danh theo tháng của học sinh */
export class StudentAttendanceItemModel {
  readonly sessionId: string;
  readonly date: string;
  readonly startTime: string;
  readonly slotName: string | null;
  readonly status: AttendanceSessionStatus;
  readonly mark: AttendanceMark;
  readonly charged: boolean;
  readonly unitPrice: number | null;
  readonly source: AttendanceRecordSource;

  constructor(data: StudentAttendanceItem) {
    this.sessionId = data.sessionId;
    this.date = data.date;
    this.startTime = data.startTime;
    this.slotName = data.slotName;
    this.status = data.status;
    this.mark = data.mark;
    this.charged = data.charged;
    this.unitPrice = data.unitPrice;
    this.source = data.source;
  }

  get title(): string {
    return this.slotName ?? t.attendance.makeUp;
  }

  get dateText(): string {
    return `${sessionDateText(this.date)} ${this.startTime}`;
  }

  get markLabel(): string {
    return t.attendanceMark[this.mark];
  }

  get priceText(): string | null {
    return this.unitPrice === null ? null : formatMoney(this.unitPrice);
  }
}
