import {
  studentFullName,
  type AffectedRecord,
  type AffectedSession,
  type AppliedRate,
  type AvatarKey,
  type ExtraRate,
  type ExtraSlot,
  type ExtraSlotRef,
  type RateSource,
  type SlotAssignment,
  type SlotStudent,
  type StudentClassRef,
  type TeacherRef,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import type { IsoWeekday } from '@/shared/i18n';
import { formatDate, formatMoney } from '@/shared/utils/format';

/** Contracts để weekday là number (1..7) → khoá từ điển thứ */
export const isoWeekday = (n: number): IsoWeekday => Math.min(7, Math.max(1, Math.trunc(n))) as IsoWeekday;

/** "T3 18:00–19:30" */
export function slotTimeText(slot: Pick<ExtraSlotRef, 'weekday' | 'startTime' | 'endTime'>): string {
  return `${t.weekdayShort[isoWeekday(slot.weekday)]} ${slot.startTime}–${slot.endTime}`;
}

/** "Phonics nâng cao · T3 18:00–19:30" — nhãn ô chọn ca, lịch của học sinh */
export function slotLabel(slot: Pick<ExtraSlotRef, 'name' | 'weekday' | 'startTime' | 'endTime'>): string {
  return `${slot.name} · ${slotTimeText(slot)}`;
}

/** Học trong ngày `date` (YYYY-MM-DD): khoảng nửa mở `[from, to)` */
export function isActiveOn(
  range: { effectiveFrom: string; effectiveTo: string | null },
  date: string,
): boolean {
  return range.effectiveFrom <= date && (range.effectiveTo === null || date < range.effectiveTo);
}

/** Đơn giá áp dụng: "150.000 ₫" hoặc "Chưa có giá" */
export function appliedRateText(rate: AppliedRate): string {
  return rate.source === 'NONE' ? t.rateSource.NONE : formatMoney(rate.pricePerSession);
}

/** Ca học thêm (từ `ExtraSlot` của BE) */
export class ExtraSlotModel {
  readonly id: string;
  readonly name: string;
  readonly weekday: IsoWeekday;
  readonly startTime: string;
  readonly endTime: string;
  readonly archivedAt: string | null;
  readonly room: string | null;
  readonly capacity: number | null;
  readonly class: { id: string; name: string } | null;
  readonly teachers: TeacherRef[];
  readonly studentCount: number;
  readonly defaultPrice: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: ExtraSlot) {
    this.id = data.id;
    this.name = data.name;
    this.weekday = isoWeekday(data.weekday);
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.archivedAt = data.archivedAt;
    this.room = data.room;
    this.capacity = data.capacity;
    this.class = data.class;
    this.teachers = data.teachers;
    this.studentCount = data.studentCount;
    this.defaultPrice = data.defaultPrice;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get isArchived(): boolean {
    return this.archivedAt !== null;
  }

  get weekdayLabel(): string {
    return t.weekday[this.weekday];
  }

  /** "18:00–19:30" */
  get timeRange(): string {
    return `${this.startTime}–${this.endTime}`;
  }

  get timeText(): string {
    return slotTimeText(this);
  }

  get label(): string {
    return slotLabel(this);
  }

  get teacherNames(): string {
    return this.teachers.length
      ? this.teachers.map((tc) => tc.displayName).join(', ')
      : t.extraSlots.noTeachers;
  }

  get studentCountText(): string {
    return t.extraSlots.studentCount(this.studentCount, this.capacity);
  }

  /** Đã đủ sĩ số (chỉ để cảnh báo, server không chặn) */
  get isFull(): boolean {
    return this.capacity !== null && this.studentCount >= this.capacity;
  }

  /** null khi chưa đặt giá hoặc người xem không có quyền xem giá */
  get defaultPriceText(): string | null {
    return this.defaultPrice === null ? null : `${formatMoney(this.defaultPrice)} ${t.extraSlots.perSession}`;
  }
}

/** Một dòng lịch học thêm của học sinh */
export class SlotAssignmentModel {
  readonly id: string;
  readonly studentId: string;
  readonly slot: ExtraSlotRef;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Chỉ có ở response tạo / sửa / chuyển: buổi đã xác nhận lệch với lịch mới */
  readonly affectedSessions: AffectedSession[];

  constructor(data: SlotAssignment) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.slot = data.slot;
    this.effectiveFrom = data.effectiveFrom;
    this.effectiveTo = data.effectiveTo;
    this.note = data.note;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.affectedSessions = data.affectedSessions ?? [];
  }

  get slotLabel(): string {
    return slotLabel(this.slot);
  }

  /** Còn hiệu lực (chưa có ngày kết thúc, hoặc kết thúc sau `today`) — được cho rời / chuyển ca */
  isOpen(today: string): boolean {
    return this.effectiveTo === null || this.effectiveTo > today;
  }

  statusOn(today: string): 'active' | 'ended' | 'upcoming' {
    if (isActiveOn(this, today)) return 'active';
    return this.effectiveFrom > today ? 'upcoming' : 'ended';
  }

  get fromText(): string {
    return formatDate(this.effectiveFrom);
  }

  get toText(): string {
    return this.effectiveTo ? formatDate(this.effectiveTo) : t.common.none;
  }
}

/** Học sinh của ca tại một ngày */
export class SlotStudentModel {
  readonly studentId: string;
  readonly displayName: string;
  readonly vietnameseName: string;
  readonly englishName: string | null;
  readonly avatarKey: AvatarKey;
  readonly class: StudentClassRef | null;
  readonly assignmentId: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly rate: AppliedRate | null;

  constructor(data: SlotStudent) {
    this.studentId = data.studentId;
    this.displayName = data.displayName;
    this.vietnameseName = data.vietnameseName;
    this.englishName = data.englishName;
    this.avatarKey = data.avatarKey;
    this.class = data.class;
    this.assignmentId = data.assignmentId;
    this.effectiveFrom = data.effectiveFrom;
    this.effectiveTo = data.effectiveTo;
    this.rate = data.rate;
  }

  get fullName(): string {
    return studentFullName(this);
  }

  get rateText(): string | null {
    return this.rate ? appliedRateText(this.rate) : null;
  }
}

/** Trạng thái một dòng giá: đang áp dụng / đã dừng / bị dòng nhập sau thay thế từ đầu */
export type RateState = 'current' | 'ended' | 'superseded';

export class ExtraRateModel {
  readonly id: string;
  readonly studentId: string | null;
  readonly slotId: string | null;
  readonly pricePerSession: number;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly note: string | null;
  readonly createdBy: { id: string; displayName: string } | null;
  readonly createdAt: string;
  /** Chỉ có ở response đặt giá: bản ghi đã xác nhận có đơn giá khác giá mới */
  readonly affectedRecords: AffectedRecord[];

  constructor(data: ExtraRate) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.slotId = data.slotId;
    this.pricePerSession = data.pricePerSession;
    this.effectiveFrom = data.effectiveFrom;
    this.effectiveTo = data.effectiveTo;
    this.note = data.note;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.affectedRecords = data.affectedRecords ?? [];
  }

  get state(): RateState {
    if (this.effectiveTo === null) return 'current';
    return this.effectiveTo === this.effectiveFrom ? 'superseded' : 'ended';
  }

  get priceText(): string {
    return formatMoney(this.pricePerSession);
  }

  get source(): RateSource {
    if (this.studentId) return this.slotId ? 'STUDENT_SLOT' : 'STUDENT';
    return 'SLOT';
  }
}

/** Tab "Học thêm" của học sinh */
export interface StudentExtra {
  assignments: SlotAssignmentModel[];
  rates: ExtraRateModel[] | null;
  appliedRates: { slotId: string; rate: AppliedRate }[] | null;
  canManageSchedule: boolean;
  canManagePricing: boolean;
}
