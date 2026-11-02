import type {
  TuitionByStudent,
  TuitionBySlot,
  TuitionMonth,
  TuitionOverview,
  StudentTuitionResponse,
} from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { dayjs } from '@/shared/utils/dayjs';

type Totals = Omit<TuitionMonth, 'month' | 'studentCount'>;

/** Getter chung: tổng tạm tính (đã + chờ xác nhận), tỉ lệ có mặt */
abstract class TuitionTotalsModel {
  readonly confirmedTotal: number;
  readonly pendingTotal: number;
  readonly chargedCount: number;
  readonly presentCount: number;
  readonly absentCount: number;
  readonly excusedCount: number;

  constructor(data: Totals) {
    this.confirmedTotal = data.confirmedTotal;
    this.pendingTotal = data.pendingTotal;
    this.chargedCount = data.chargedCount;
    this.presentCount = data.presentCount;
    this.absentCount = data.absentCount;
    this.excusedCount = data.excusedCount;
  }

  get total(): number {
    return this.confirmedTotal + this.pendingTotal;
  }

  /** Có mặt / tổng lượt điểm danh; null khi chưa có lượt nào */
  get attendanceRate(): number | null {
    const all = this.presentCount + this.absentCount + this.excusedCount;
    return all ? this.presentCount / all : null;
  }
}

export class TuitionMonthModel extends TuitionTotalsModel {
  readonly month: string;
  readonly studentCount: number;

  constructor(data: TuitionMonth) {
    super(data);
    this.month = data.month;
    this.studentCount = data.studentCount;
  }

  /** "10/2026" */
  get label(): string {
    return dayjs(`${this.month}-01`).format(t.attendance.monthFormat);
  }

  /** "10/26" — trục biểu đồ */
  get shortLabel(): string {
    return dayjs(`${this.month}-01`).format(t.format.monthShort);
  }
}

export class TuitionSlotModel extends TuitionTotalsModel {
  readonly slotId: string | null;
  readonly slotName: string | null;
  readonly studentCount: number;

  constructor(data: TuitionBySlot) {
    super(data);
    this.slotId = data.slotId;
    this.slotName = data.slotName;
    this.studentCount = data.studentCount;
  }

  /** Buổi bù không theo ca */
  get label(): string {
    return this.slotName ?? t.attendance.makeUp;
  }
}

export class TuitionStudentModel extends TuitionTotalsModel {
  readonly studentId: string;
  readonly displayName: string;

  constructor(data: TuitionByStudent) {
    super(data);
    this.studentId = data.studentId;
    this.displayName = data.displayName;
  }
}

/** Tháng có điểm danh (bỏ tháng trống khi tính trung bình / hiện bảng) */
const hasAttendance = (m: TuitionMonth | TuitionMonthModel): boolean =>
  m.presentCount + m.absentCount + m.excusedCount > 0;

export class TuitionSummaryModel extends TuitionTotalsModel {
  readonly studentCount: number;
  /** Số tháng có điểm danh trong khoảng */
  readonly monthCount: number;

  constructor(data: Omit<TuitionMonth, 'month'>, months: readonly TuitionMonth[]) {
    super(data);
    this.studentCount = data.studentCount;
    this.monthCount = months.filter(hasAttendance).length;
  }

  /** Trung bình trên các tháng có điểm danh */
  get avgPerMonth(): number {
    return this.monthCount ? Math.round(this.total / this.monthCount) : 0;
  }
}

export class TuitionOverviewModel {
  readonly from: string;
  readonly to: string;
  readonly months: TuitionMonthModel[];
  readonly totals: TuitionSummaryModel;
  readonly bySlot: TuitionSlotModel[];
  readonly topStudents: TuitionStudentModel[];
  readonly pendingSessions: number;
  readonly zeroPriceRecords: number;

  constructor(data: TuitionOverview) {
    this.from = data.from;
    this.to = data.to;
    this.months = data.months.map((m) => new TuitionMonthModel(m));
    this.totals = new TuitionSummaryModel(data.totals, data.months);
    this.bySlot = data.bySlot.map((s) => new TuitionSlotModel(s));
    this.topStudents = data.topStudents.map((s) => new TuitionStudentModel(s));
    this.pendingSessions = data.pendingSessions;
    this.zeroPriceRecords = data.zeroPriceRecords;
  }
}

export class StudentTuitionModel {
  readonly from: string;
  readonly to: string;
  readonly months: TuitionMonthModel[];
  readonly totals: TuitionSummaryModel;

  constructor(data: StudentTuitionResponse) {
    this.from = data.from;
    this.to = data.to;
    this.months = data.months.map((m) => new TuitionMonthModel(m));
    this.totals = new TuitionSummaryModel(data.totals, data.months);
  }

  /** Tháng có điểm danh (bảng chi tiết bỏ tháng trống) */
  get activeMonths(): TuitionMonthModel[] {
    return this.months.filter(hasAttendance);
  }
}
