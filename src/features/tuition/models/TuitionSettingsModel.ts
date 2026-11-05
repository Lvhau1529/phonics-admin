import type { TuitionSettings, UpdateTuitionSettings } from '@phonics/contracts';

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
  /** Mẫu tin nhắn thông báo học phí (Zalo); null = mẫu mặc định */
  readonly noticeTemplate: string | null;
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
    this.noticeTemplate = data.noticeTemplate;
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

  /** Body PUT giữ nguyên cài đặt hiện có (PUT thay cả bản) — ghi đè vài trường, vd lưu mẫu tin nhắn */
  toUpdateBody(patch: Partial<UpdateTuitionSettings> = {}): UpdateTuitionSettings {
    const current: UpdateTuitionSettings = {
      orgName: this.orgName ?? undefined,
      orgAddress: this.orgAddress ?? undefined,
      orgPhone: this.orgPhone ?? undefined,
      bankBin: this.bankBin ?? undefined,
      bankName: this.bankName ?? undefined,
      accountNo: this.accountNo ?? undefined,
      accountName: this.accountName ?? undefined,
      transferContent: this.transferContent ?? undefined,
      dueDay: this.dueDay ?? undefined,
      note: this.note ?? undefined,
      showSlot: this.showSlot,
      noticeTemplate: this.noticeTemplate ?? undefined,
    };
    const merged = { ...current, ...patch };
    return Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined),
    ) as UpdateTuitionSettings;
  }
}
