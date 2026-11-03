import type { TuitionSettings } from '@phonics/contracts';

/** Cài đặt phiếu báo học phí — trường null = không in lên phiếu */
export class TuitionSettingsModel {
  readonly orgName: string | null;
  readonly orgAddress: string | null;
  readonly orgPhone: string | null;
  readonly bankBin: string | null;
  readonly bankName: string | null;
  readonly accountNo: string | null;
  readonly accountName: string | null;
  readonly transferContent: string | null;
  readonly dueDay: number | null;
  readonly note: string | null;
  readonly showSlot: boolean;
  readonly updatedAt: string | null;

  constructor(data: TuitionSettings) {
    this.orgName = data.orgName;
    this.orgAddress = data.orgAddress;
    this.orgPhone = data.orgPhone;
    this.bankBin = data.bankBin;
    this.bankName = data.bankName;
    this.accountNo = data.accountNo;
    this.accountName = data.accountName;
    this.transferContent = data.transferContent;
    this.dueDay = data.dueDay;
    this.note = data.note;
    this.showSlot = data.showSlot;
    this.updatedAt = data.updatedAt;
  }

  /** Phiếu có in mã VietQR không (cần mã BIN + số tài khoản) */
  get qrReady(): boolean {
    return !!(this.bankBin && this.accountNo);
  }

  /** Đang dùng phần "Tuỳ chọn thêm" (tên / địa chỉ trung tâm, hạn đóng, cột ca) → mở sẵn khi vào trang */
  get usesExtraOptions(): boolean {
    return !!(this.orgName || this.orgAddress || this.dueDay || this.showSlot);
  }
}
