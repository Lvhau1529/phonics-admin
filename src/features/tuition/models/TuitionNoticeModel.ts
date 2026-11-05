import {
  formatPhone,
  isValidPhone,
  noticeStudentName,
  renderTuitionNotice,
  zaloChatUrl,
  type TuitionNotice,
  type TuitionNoticeStudent,
  type TuitionNoticesResponse,
} from '@phonics/contracts';
import { type TuitionSettingsModel } from '@/features/tuition/models/TuitionSettingsModel';

/** Vấn đề với SĐT khiến không mở Zalo được: chưa có / sai / không phải di động Việt Nam */
export type NoticePhoneIssue = 'missing' | 'invalid' | 'notMobile';

/** Một tin nhắn = một phụ huynh nhận học phí (anh chị em gộp) */
export class TuitionNoticeModel {
  readonly key: string;
  readonly guardianId: string | null;
  readonly guardianName: string | null;
  /** E.164 như đã lưu */
  readonly phone: string | null;
  readonly students: TuitionNoticeStudent[];
  readonly confirmedTotal: number;
  readonly pendingTotal: number;
  readonly transferContent: string | null;

  constructor(data: TuitionNotice) {
    this.key = data.key;
    this.guardianId = data.guardianId;
    this.guardianName = data.guardianName;
    this.phone = data.phone;
    this.students = data.students;
    this.confirmedTotal = data.confirmedTotal;
    this.pendingTotal = data.pendingTotal;
    this.transferContent = data.transferContent;
  }

  /** Tiền học thêm tạm tính (gồm buổi chờ xác nhận — khớp tổng trên phiếu PDF) */
  get attendanceTotal(): number {
    return this.confirmedTotal + this.pendingTotal;
  }

  /** `0912 345 678` (rỗng khi chưa có) */
  get phoneText(): string {
    return formatPhone(this.phone);
  }

  /** Link mở khung chat Zalo; null khi SĐT không dùng được */
  get zaloUrl(): string | null {
    return zaloChatUrl(this.phone);
  }

  get phoneIssue(): NoticePhoneIssue | null {
    if (!this.phone) return 'missing';
    if (!isValidPhone(this.phone)) return 'invalid';
    return this.zaloUrl ? null : 'notMobile';
  }

  /** `Nguyễn Văn An (Andy), Nguyễn Thị Bình` */
  get studentNames(): string {
    return this.students.map(noticeStudentName).join(', ');
  }

  /** Soạn tin nhắn theo mẫu với số tiền đang chọn */
  message(opts: {
    template: string;
    month: string;
    amount: number;
    dueDate: string | null;
    settings: TuitionSettingsModel | undefined;
  }): string {
    const s = opts.settings;
    return renderTuitionNotice(opts.template, {
      students: this.students,
      parent: this.guardianName,
      month: opts.month,
      amount: opts.amount,
      dueDate: opts.dueDate,
      bank: s?.bankName ?? null,
      accountNo: s?.accountNo ?? null,
      accountName: s?.accountName ?? null,
      transferContent: this.transferContent,
      orgName: s?.orgName ?? null,
    });
  }
}

export class TuitionNoticesModel {
  readonly month: string;
  readonly classId: string | null;
  readonly dueDate: string | null;
  readonly items: TuitionNoticeModel[];

  constructor(data: TuitionNoticesResponse) {
    this.month = data.month;
    this.classId = data.classId;
    this.dueDate = data.dueDate;
    this.items = data.items.map((i) => new TuitionNoticeModel(i));
  }
}
