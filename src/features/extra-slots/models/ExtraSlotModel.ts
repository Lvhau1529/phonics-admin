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
import { dayjs } from '@/shared/utils/dayjs';
import { formatDate, formatMoney, shortList, toIsoDate } from '@/shared/utils/format';

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

/** Đơn giá đã đặt: 0đ là "Miễn phí" (học miễn phí / học thử) */
export function priceText(price: number): string {
  return price === 0 ? t.extraSlots.free : formatMoney(price);
}

/** Đơn giá áp dụng: "150.000 ₫", "Miễn phí" hoặc "Chưa có giá" */
export function appliedRateText(rate: AppliedRate): string {
  return rate.source === 'NONE' ? t.rateSource.NONE : priceText(rate.pricePerSession);
}

/** "T3 18/11/2026" */
export function sessionDateText(date: string): string {
  return `${t.weekdayShort[isoWeekday(dayjs(date).day() || 7)]} ${formatDate(date)}`;
}

/** Ngày có buổi cuối cùng của ca thứ `weekday` trước ngày ngừng `endsOn` (không trước `startsOn`); null = không còn */
export function lastSessionBefore(
  slot: { weekday: number; startsOn: string | null },
  endsOn: string,
  today: string,
): string | null {
  const end = dayjs(endsOn).subtract(1, 'day');
  const last = end.subtract(((end.day() || 7) - slot.weekday + 7) % 7, 'day').format('YYYY-MM-DD');
  const from = slot.startsOn && slot.startsOn > today ? slot.startsOn : today;
  return last >= from ? last : null;
}

/** Ca học thêm (từ `ExtraSlot` của BE) */
export class ExtraSlotModel {
  readonly id: string;
  readonly name: string;
  readonly weekday: IsoWeekday;
  readonly startTime: string;
  readonly endTime: string;
  readonly startsOn: string | null;
  readonly endsOn: string | null;
  readonly archivedAt: string | null;
  readonly room: string | null;
  readonly capacity: number | null;
  readonly class: { id: string; name: string } | null;
  readonly teachers: TeacherRef[];
  readonly studentCount: number;
  readonly defaultPrice: number | null;
  readonly nextSessionDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: ExtraSlot) {
    this.id = data.id;
    this.name = data.name;
    this.weekday = isoWeekday(data.weekday);
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.startsOn = data.startsOn;
    this.endsOn = data.endsOn;
    this.archivedAt = data.archivedAt;
    this.room = data.room;
    this.capacity = data.capacity;
    this.class = data.class;
    this.teachers = data.teachers;
    this.studentCount = data.studentCount;
    this.defaultPrice = data.defaultPrice;
    this.nextSessionDate = data.nextSessionDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  get isArchived(): boolean {
    return this.archivedAt !== null;
  }

  /** Đã hẹn ngày ngừng nhưng chưa tới */
  get isStopping(): boolean {
    return !this.isArchived && this.endsOn !== null;
  }

  /** "Ngừng từ 01/12/2026" (ca chưa ngừng mà đã hẹn ngày) */
  get stopsText(): string | null {
    return this.isStopping && this.endsOn ? t.extraSlots.stopsFrom(formatDate(this.endsOn)) : null;
  }

  /** "Bắt đầu 10/11/2026" khi ca chưa tới ngày bắt đầu */
  get startsText(): string | null {
    return this.startsOn && this.startsOn > toIsoDate(dayjs())
      ? t.extraSlots.startsFrom(formatDate(this.startsOn))
      : null;
  }

  /** "T3 18/11/2026" hoặc "Không còn buổi" */
  get nextSessionText(): string {
    return this.nextSessionDate ? sessionDateText(this.nextSessionDate) : t.extraSlots.noNextSession;
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

  /** Đầy đủ (trang chi tiết, tooltip) */
  get teacherNames(): string {
    return this.teachers.length
      ? this.teachers.map((tc) => tc.displayName).join(', ')
      : t.extraSlots.noTeachers;
  }

  /** Rút gọn cho thẻ ca: "Cô Lan, Thầy Minh +1" */
  get teacherNamesShort(): string {
    return this.teachers.length
      ? shortList(this.teachers.map((tc) => tc.displayName))
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
    if (this.defaultPrice === null) return null;
    return this.defaultPrice === 0
      ? t.extraSlots.free
      : `${formatMoney(this.defaultPrice)} ${t.extraSlots.perSession}`;
  }
}

/** Khoảng ngày nửa mở `[from, to)` để hiển thị: "01/10/2026 – nay" */
export function dateRangeText(from: string, to: string | null): string {
  return `${formatDate(from)} – ${to ? formatDate(to) : t.common.untilNow}`;
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

  get rangeText(): string {
    return dateRangeText(this.effectiveFrom, this.effectiveTo);
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

  get rangeText(): string {
    return dateRangeText(this.effectiveFrom, this.effectiveTo);
  }

  get rateText(): string | null {
    return this.rate ? appliedRateText(this.rate) : null;
  }

  /** Có giá riêng (ở ca này / mọi ca) — không đổi theo giá ca */
  get hasOwnRate(): boolean {
    return this.rate?.source === 'STUDENT_SLOT' || this.rate?.source === 'STUDENT';
  }

  /** "Hết từ 01/12/2026" — giá riêng có hạn */
  get rateEndsText(): string | null {
    return this.hasOwnRate && this.rate?.effectiveTo
      ? t.extraSlots.rateEndsFrom(formatDate(this.rate.effectiveTo))
      : null;
  }
}

/** Trạng thái một dòng giá: đang áp dụng / đã dừng / bị dòng nhập sau thay thế từ đầu */
export type RateState = 'current' | 'upcoming' | 'ended' | 'superseded';

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
    if (this.effectiveTo === this.effectiveFrom) return 'superseded';
    const today = toIsoDate(dayjs());
    if (this.effectiveTo !== null && this.effectiveTo <= today) return 'ended';
    return this.effectiveFrom > today ? 'upcoming' : 'current';
  }

  /** Giá riêng học sinh chưa hết hiệu lực → kết thúc được (về giá chung / giá ca) */
  get canEnd(): boolean {
    return this.studentId !== null && (this.state === 'current' || this.state === 'upcoming');
  }

  /** "Hết từ 01/12/2026" — giá riêng có hạn chưa hết */
  get endsText(): string | null {
    return this.effectiveTo && this.canEnd ? t.extraSlots.rateEndsFrom(formatDate(this.effectiveTo)) : null;
  }

  get priceText(): string {
    return priceText(this.pricePerSession);
  }

  get rangeText(): string {
    return dateRangeText(this.effectiveFrom, this.effectiveTo);
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
